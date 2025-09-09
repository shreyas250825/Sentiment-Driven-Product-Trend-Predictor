
from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from datetime import datetime
import logging
from io import BytesIO

# Absolute imports
import models
import dependencies
from services import product_analyzer
from utils import update_user_analytics
from firebase_admin import firestore

from services.product_analyzer import ProductAnalyzer
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)



router = APIRouter(prefix="/api", tags=["analysis"])

# db will be initialized in lifespan
product_analyzer = ProductAnalyzer()

# Lazy import db to avoid None during import time
def get_db():
    from main import db
    return db

@router.post("/analyze")
async def analyze_product(
    request: models.AnalysisRequest,
    user: dict = Depends(dependencies.verify_token)
):
    try:
        user_id = user['uid']
        product = request.product.strip()
        sources = request.sources
        
        # Run analysis
        analysis_data = await product_analyzer.analyze_product(product, sources)
        
        # Generate analysis ID
        analysis_id = f"{product}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        analysis_data['analysis_id'] = analysis_id
        
        # Save to Firestore
        doc_ref = get_db().collection('users').document(user_id).collection('analyses').document(analysis_id)
        analysis_data['user_id'] = user_id
        doc_ref.set(analysis_data)
        
        # Update user analytics
        await update_user_analytics(user_id)

        return {"success": True, "data": analysis_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/analyses")
async def get_user_analyses(
    limit: int = 1000,
    user: dict = Depends(dependencies.verify_token)
):
    try:
        user_id = user['uid']
        analyses_ref = get_db().collection('users').document(user_id).collection('analyses')
        analyses = analyses_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        result = []
        for doc in analyses:
            data = doc.to_dict()
            data['id'] = doc.id
            # Remove heavy raw data for list view
            if 'raw_data' in data:
                data['raw_data'] = {"sources_used": data['raw_data'].get('sources_used', [])}
            result.append(data)
        
        return {
            "success": True,
            "data": result,
            "count": len(result),
            "user_id": user_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyses: {str(e)}")

@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    user: dict = Depends(dependencies.verify_token)
):
    try:
        user_id = user['uid']
        doc_ref = get_db().collection('users').document(user_id).collection('analyses').document(analysis_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        data = doc.to_dict()
        data['id'] = doc.id
        
        return {
            "success": True,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")

@router.get("/sources")
async def get_available_sources():
    return {
        "sources": [
            {"id": "reddit", "name": "Reddit", "description": "Discussions and reviews from Reddit"},
            {"id": "twitter", "name": "Twitter", "description": "Tweets and conversations from Twitter"},
            {"id": "youtube", "name": "YouTube", "description": "Video reviews and comments from YouTube"},
            {"id": "news", "name": "News", "description": "News articles from various sources"},
            {"id": "google_trends", "name": "Google Trends", "description": "Trend data from Google"},
            {"id": "amazon", "name": "Amazon", "description": "Product reviews from Amazon"},
            {"id": "flipkart", "name": "Flipkart", "description": "Product reviews from Flipkart"}
        ]
    }

@router.get("/compare")
async def compare_products(products: str, user: dict = Depends(dependencies.verify_token)):
    try:
        user_id = user['uid']
        product_names = [p.strip() for p in products.split(",")]
        analyses_ref = get_db().collection('users').document(user_id).collection('analyses')

        result = []
        for name in product_names:
            try:
                # Try the optimized query first (requires composite index)
                docs = analyses_ref.where('product', '==', name).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
                docs_list = list(docs)
                if docs_list:
                    data = docs_list[0].to_dict()
                    data['id'] = docs_list[0].id
                    result.append(data)
                else:
                    # If no results, try fallback query without ordering
                    docs = analyses_ref.where('product', '==', name).limit(1).stream()
                    for doc in docs:
                        data = doc.to_dict()
                        data['id'] = doc.id
                        result.append(data)
            except Exception as query_error:
                error_message = str(query_error)
                # Check for Firestore index error and try fallback
                if "index" in error_message.lower() and ("create_composite" in error_message or "requires an index" in error_message):
                    logger.warning(f"Composite index required for product query, using fallback: {error_message}")
                    # Fallback: Get all documents for the product and sort in memory
                    try:
                        docs = analyses_ref.where('product', '==', name).stream()
                        docs_list = []
                        for doc in docs:
                            data = doc.to_dict()
                            data['id'] = doc.id
                            docs_list.append(data)

                        if docs_list:
                            # Sort by timestamp in memory and take the most recent
                            docs_list.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
                            result.append(docs_list[0])
                    except Exception as fallback_error:
                        logger.error(f"Fallback query also failed: {fallback_error}")
                        # Continue to next product instead of failing completely
                        continue
                else:
                    # Re-raise non-index related errors
                    raise query_error

        return {"success": True, "data": result}
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error in compare_products: {error_message}")

        # Provide specific error messages for different scenarios
        if "index" in error_message.lower() and ("create_composite" in error_message or "requires an index" in error_message):
            raise HTTPException(
                status_code=500,
                detail="Database optimization needed. The system is using a fallback method. For better performance, please create a composite index in Firebase console for the 'product' and 'timestamp' fields in the analyses collection."
            )
        elif "permission" in error_message.lower():
            raise HTTPException(
                status_code=403,
                detail="Access denied. Please check your permissions and try again."
            )
        elif "not found" in error_message.lower():
            raise HTTPException(
                status_code=404,
                detail="No analysis data found for the selected products. Please run analyses first."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Failed to compare products: {error_message}")

@router.get("/products")
async def get_products():
    # Return a static list of products or fetch from a database if available
    products = [
        {"id": 1, "name": "iPhone"},
        {"id": 2, "name": "InstantPot"},
        {"id": 3, "name": "Fitbit"}
    ]
    return {"success": True, "products": products}

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    user: dict = Depends(dependencies.verify_token)
):
    try:
        user_id = user['uid']
        doc_ref = get_db().collection('users').document(user_id).collection('analyses').document(analysis_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Analysis not found")
        doc_ref.delete()
        return {"success": True, "message": "Analysis deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")

@router.post("/compare/export")
async def export_comparison_report(
    request: dict,
    user: dict = Depends(dependencies.verify_token)
):
    try:
        user_id = user['uid']
        products = request.get('products', '').split(',') if isinstance(request.get('products'), str) else request.get('products', [])

        if not products:
            raise HTTPException(status_code=400, detail="No products specified for export")

        # Get comparison data
        product_names = [p.strip() for p in products]
        analyses_ref = get_db().collection('users').document(user_id).collection('analyses')

        comparison_data = []
        for name in product_names:
            try:
                # Try the optimized query first (requires composite index)
                docs = analyses_ref.where('product', '==', name).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
                docs_list = list(docs)
                if docs_list:
                    data = docs_list[0].to_dict()
                    data['id'] = docs_list[0].id
                    comparison_data.append(data)
                else:
                    # If no results, try fallback query without ordering
                    docs = analyses_ref.where('product', '==', name).limit(1).stream()
                    for doc in docs:
                        data = doc.to_dict()
                        data['id'] = doc.id
                        comparison_data.append(data)
            except Exception as query_error:
                error_message = str(query_error)
                # Check for Firestore index error and try fallback
                if "index" in error_message.lower() and ("create_composite" in error_message or "requires an index" in error_message):
                    logger.warning(f"Composite index required for product query, using fallback: {error_message}")
                    # Fallback: Get all documents for the product and sort in memory
                    try:
                        docs = analyses_ref.where('product', '==', name).stream()
                        docs_list = []
                        for doc in docs:
                            data = doc.to_dict()
                            data['id'] = doc.id
                            docs_list.append(data)

                        if docs_list:
                            # Sort by timestamp in memory and take the most recent
                            docs_list.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
                            comparison_data.append(docs_list[0])
                    except Exception as fallback_error:
                        logger.error(f"Fallback query also failed: {fallback_error}")
                        # Continue to next product instead of failing completely
                        continue
                else:
                    # Re-raise non-index related errors
                    raise query_error

        if not comparison_data:
            raise HTTPException(status_code=404, detail="No analysis data found for the selected products")

        # Generate PDF report
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            textColor=colors.blue
        )

        normal_style = styles['Normal']

        # Build PDF content
        content = []

        # Title
        content.append(Paragraph("Product Comparison Report", title_style))
        content.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        content.append(Spacer(1, 20))

        # Executive Summary
        content.append(Paragraph("Executive Summary", subtitle_style))

        # Find the best performing product
        best_product = None
        best_score = 0
        for product in comparison_data:
            sentiment_score = (product.get('sentiment', {}).get('confidence_score', 0) or 0) * 100
            trend_score = (product.get('trend_prediction', {}).get('confidence', 0) or 0) * 100
            combined_score = (sentiment_score + trend_score) / 2
            if combined_score > best_score:
                best_score = combined_score
                best_product = product.get('product', 'Unknown')

        summary_text = f"This report compares {len(comparison_data)} products. "
        if best_product:
            summary_text += f"The highest performing product is {best_product} with a combined score of {best_score:.1f}%."
        content.append(Paragraph(summary_text, normal_style))
        content.append(Spacer(1, 20))

        # Product Details Table
        content.append(Paragraph("Product Analysis Details", subtitle_style))

        # Table data
        table_data = [['Product', 'Sentiment', 'Confidence', 'Trend', 'Sample Size']]

        for product in comparison_data:
            product_name = product.get('product', 'Unknown')
            sentiment = product.get('sentiment', {})
            sentiment_overall = sentiment.get('overall_sentiment', 'N/A')
            sentiment_confidence = f"{(sentiment.get('confidence_score', 0) * 100):.1f}%"

            trend_prediction = product.get('trend_prediction', {})
            trend = trend_prediction.get('predicted_trend', 'N/A')
            sample_size = sentiment.get('sample_size', 0)

            table_data.append([
                product_name,
                sentiment_overall.title() if sentiment_overall != 'N/A' else 'N/A',
                sentiment_confidence,
                trend.title() if trend != 'N/A' else 'N/A',
                str(sample_size)
            ])

        # Create table
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        content.append(table)
        content.append(Spacer(1, 20))

        # Recommendations
        content.append(Paragraph("Recommendations", subtitle_style))

        recommendations = []

        # Find positive sentiment products
        positive_products = [p for p in comparison_data if p.get('sentiment', {}).get('overall_sentiment') == 'positive']
        if positive_products:
            product_names = [p.get('product') for p in positive_products]
            recommendations.append(f"Focus on products with positive sentiment: {', '.join(product_names)}")

        # Find surging products
        surging_products = [p for p in comparison_data if p.get('trend_prediction', {}).get('predicted_trend') == 'surge']
        if surging_products:
            product_names = [p.get('product') for p in surging_products]
            recommendations.append(f"Consider increasing investment in trending products: {', '.join(product_names)}")

        # Find products with high confidence
        high_confidence_products = [p for p in comparison_data if (p.get('sentiment', {}).get('confidence_score', 0) or 0) > 0.8]
        if high_confidence_products:
            product_names = [p.get('product') for p in high_confidence_products]
            recommendations.append(f"Products with high sentiment confidence: {', '.join(product_names)}")

        if not recommendations:
            recommendations.append("No specific recommendations available based on current data.")

        for rec in recommendations:
            content.append(Paragraph(f"• {rec}", normal_style))

        # Build the PDF
        doc.build(content)

        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()

        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename="product_comparison_report.pdf"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")
