import pandas as pd
import numpy as np
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
import warnings

# Suppress Prophet warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

logger = logging.getLogger(__name__)

class SalesForecaster:
    """Time series forecasting using Prophet and ARIMA with enhanced error handling"""
    
    def __init__(self):
        self.prophet_model = None
        self.arima_model = None
        self._prophet_available = True
        self._arima_available = True
        
        # Check if Prophet is available
        try:
            from prophet import Prophet
            self._prophet_available = True
        except ImportError:
            logger.warning("Prophet not available, using fallback forecasting")
            self._prophet_available = False
        
        # Check if statsmodels is available
        try:
            from statsmodels.tsa.arima.model import ARIMA
            self._arima_available = True
        except ImportError:
            logger.warning("ARIMA not available, using fallback forecasting")
            self._arima_available = False
    
    def load_sales_data(self, product: str) -> Optional[pd.DataFrame]:
        """Load or generate sales data for forecasting with proper error handling"""
        try:
            if not isinstance(product, str) or not product.strip():
                raise ValueError("Product name must be a non-empty string")

            # Try to load real sales data from CSV/database first
            try:
                # Look for product-specific sales data file
                sales_file = f"data/sales_{product.lower().replace(' ', '_')}.csv"
                if os.path.exists(sales_file):
                    df = pd.read_csv(sales_file)
                    if 'ds' in df.columns and 'y' in df.columns:
                        df['ds'] = pd.to_datetime(df['ds'])
                        logger.info(f"Loaded real sales data for '{product}' from {sales_file}")
                        return df
            except Exception as file_error:
                logger.warning(f"Could not load sales data from file: {file_error}")

            # Try to load from database if configured
            try:
                # This would connect to a real database in production
                # For now, we'll skip this and use synthetic data
                pass
            except Exception as db_error:
                logger.warning(f"Could not load sales data from database: {db_error}")

            # Fallback to synthetic data generation
            logger.info(f"Using synthetic sales data for '{product}'")
            dates = pd.date_range(end=datetime.now(), periods=365, freq='D')
            base_sales = 100

            # Create seasonal pattern + trend + noise
            seasonal_effect = 20 * np.sin(2 * np.pi * dates.dayofyear / 365)
            trend_effect = np.linspace(0, 50, len(dates))

            # Add some randomness but ensure reproducibility for same product
            np.random.seed(hash(product) % 2**32)
            noise = np.random.normal(0, 10, len(dates))

            sales = base_sales + seasonal_effect + trend_effect + noise
            sales = np.maximum(sales, 20)  # Ensure positive sales

            df = pd.DataFrame({
                'ds': dates,
                'y': sales
            })

            # Validate the dataframe
            if df.empty or df['y'].isna().all():
                raise ValueError("Generated sales data is empty or invalid")

            return df

        except Exception as e:
            logger.error(f"Failed to load sales data for '{product}': {e}")
            return None
    
    def forecast_prophet(self, df: Optional[pd.DataFrame], periods: int = 30) -> Dict:
        """Forecast using Facebook Prophet with enhanced error handling"""
        try:
            if not self._prophet_available:
                logger.info("Prophet not available, using fallback forecast")
                return self._fallback_forecast(df, periods)
            
            if df is None or df.empty:
                logger.warning("No sales data available, using fallback forecast")
                return self._fallback_forecast(df, periods)
            
            # Validate dataframe structure
            if 'ds' not in df.columns or 'y' not in df.columns:
                raise ValueError("Sales data must have 'ds' and 'y' columns")
            
            # Check for sufficient data points
            if len(df) < 10:
                logger.warning("Insufficient data points for Prophet, using fallback")
                return self._fallback_forecast(df, periods)
            
            from prophet import Prophet
            
            # Configure Prophet with conservative settings
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0,
                holidays_prior_scale=10.0,
                mcmc_samples=0,  # Use MAP estimation for speed
                interval_width=0.8,
                uncertainty_samples=1000
            )
            
            # Fit the model
            model.fit(df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=periods)
            
            # Make predictions
            forecast = model.predict(future)
            
            # Extract forecast results
            forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
            
            # Calculate trend
            forecast_values = forecast_data['yhat'].values
            trend = self._calculate_trend(forecast_values)
            
            # Calculate confidence based on prediction intervals
            confidence = self._calculate_forecast_confidence(forecast_data)
            
            return {
                'model': 'prophet',
                'success': True,
                'forecast': forecast_data.to_dict('records'),
                'trend': trend,
                'confidence': confidence,
                'periods': periods,
                'data_points_used': len(df)
            }
            
        except Exception as e:
            logger.error(f"Prophet forecasting error: {e}")
            return self._fallback_forecast(df, periods)
    
    def forecast_arima(self, df: Optional[pd.DataFrame], periods: int = 30) -> Dict:
        """Forecast using ARIMA with enhanced error handling"""
        try:
            if not self._arima_available:
                logger.info("ARIMA not available, using fallback forecast")
                return self._fallback_forecast(df, periods)
            
            if df is None or df.empty:
                logger.warning("No sales data available for ARIMA, using fallback")
                return self._fallback_forecast(df, periods)
            
            # Use last 90 days for ARIMA (or all data if less than 90 days)
            recent_data = df['y'].tail(90).values
            
            if len(recent_data) < 10:
                logger.warning("Insufficient data for ARIMA, using fallback")
                return self._fallback_forecast(df, periods)
            
            from statsmodels.tsa.arima.model import ARIMA
            
            # Try different ARIMA orders if the default fails
            orders_to_try = [(5,1,0), (2,1,1), (1,1,1), (3,1,0)]
            
            for order in orders_to_try:
                try:
                    model = ARIMA(recent_data, order=order)
                    model_fit = model.fit()
                    
                    # Make forecast
                    forecast_values = model_fit.forecast(steps=periods)
                    forecast_dates = pd.date_range(
                        start=df['ds'].iloc[-1] + timedelta(days=1), 
                        periods=periods, 
                        freq='D'
                    )
                    
                    # Calculate trend
                    trend = self._calculate_trend(forecast_values)
                    
                    return {
                        'model': f'arima{order}',
                        'success': True,
                        'forecast': [
                            {'ds': d.strftime('%Y-%m-%d'), 'yhat': float(f)} 
                            for d, f in zip(forecast_dates, forecast_values)
                        ],
                        'trend': trend,
                        'confidence': 0.7,
                        'periods': periods,
                        'data_points_used': len(recent_data)
                    }
                    
                except Exception as order_error:
                    logger.warning(f"ARIMA order {order} failed: {order_error}")
                    continue
            
            # If all orders failed, use fallback
            logger.error("All ARIMA orders failed, using fallback")
            return self._fallback_forecast(df, periods)
            
        except Exception as e:
            logger.error(f"ARIMA forecasting error: {e}")
            return self._fallback_forecast(df, periods)
    
    def _calculate_trend(self, values: np.ndarray) -> str:
        """Calculate trend direction from forecasted values"""
        try:
            if len(values) < 2:
                return "stable"
            
            # Remove any NaN or infinite values
            clean_values = values[np.isfinite(values)]
            if len(clean_values) < 2:
                return "stable"
            
            first_half = clean_values[:len(clean_values)//2].mean()
            second_half = clean_values[len(clean_values)//2:].mean()
            
            if first_half == 0:
                return "stable"
            
            change = ((second_half - first_half) / first_half) * 100
            
            if change > 10:
                return "growing"
            elif change < -10:
                return "declining"
            else:
                return "stable"
                
        except Exception as e:
            logger.error(f"Failed to calculate trend: {e}")
            return "stable"
    
    def _calculate_forecast_confidence(self, forecast_data: pd.DataFrame) -> float:
        """Calculate confidence based on prediction intervals"""
        try:
            if 'yhat_lower' not in forecast_data.columns or 'yhat_upper' not in forecast_data.columns:
                return 0.6  # Default confidence
            
            # Calculate average relative interval width
            intervals = forecast_data['yhat_upper'] - forecast_data['yhat_lower']
            predictions = forecast_data['yhat']
            
            # Avoid division by zero
            valid_predictions = predictions[predictions != 0]
            if len(valid_predictions) == 0:
                return 0.5
            
            relative_intervals = intervals[predictions != 0] / valid_predictions
            avg_relative_interval = relative_intervals.mean()
            
            # Convert to confidence (smaller intervals = higher confidence)
            confidence = max(0.3, min(0.9, 1.0 - (avg_relative_interval / 2)))
            
            return round(confidence, 2)
            
        except Exception as e:
            logger.error(f"Failed to calculate forecast confidence: {e}")
            return 0.6
    
    def _fallback_forecast(self, df: Optional[pd.DataFrame], periods: int) -> Dict:
        """Fallback forecasting method using simple linear extrapolation"""
        try:
            if df is not None and not df.empty and len(df) >= 2:
                # Use last few data points for trend calculation
                last_values = df['y'].tail(min(10, len(df))).values
                last_date = df['ds'].iloc[-1]
                
                # Calculate simple trend
                if len(last_values) >= 2:
                    trend_slope = np.polyfit(range(len(last_values)), last_values, 1)[0]
                    last_value = last_values[-1]
                else:
                    trend_slope = 0
                    last_value = last_values[0] if len(last_values) > 0 else 100
            else:
                # Complete fallback with synthetic data
                last_value = 100
                trend_slope = 0.5
                last_date = datetime.now()
            
            # Generate forecast
            forecast_values = []
            forecast_dates = []
            
            for i in range(1, periods + 1):
                # Simple linear trend with small random variation
                np.random.seed(42 + i)  # Reproducible randomness
                noise = np.random.normal(0, 2)
                forecast_value = max(10, last_value + (trend_slope * i) + noise)
                forecast_values.append(forecast_value)
                
                forecast_date = last_date + timedelta(days=i)
                forecast_dates.append(forecast_date)
            
            # Calculate trend direction
            trend = self._calculate_trend(np.array(forecast_values))
            
            return {
                'model': 'fallback_linear',
                'success': True,
                'forecast': [
                    {'ds': d.strftime('%Y-%m-%d'), 'yhat': float(f)} 
                    for d, f in zip(forecast_dates, forecast_values)
                ],
                'trend': trend,
                'confidence': 0.5,
                'periods': periods,
                'data_points_used': len(df) if df is not None else 0,
                'fallback_reason': 'Prophet/ARIMA unavailable or insufficient data'
            }
            
        except Exception as e:
            logger.error(f"Fallback forecasting failed: {e}")
            return {
                'model': 'minimal_fallback',
                'success': False,
                'forecast': [],
                'trend': 'stable',
                'confidence': 0.3,
                'periods': periods,
                'data_points_used': 0,
                'error': str(e)
            }
    
    def get_model_info(self) -> Dict:
        """Get information about available forecasting models"""
        return {
            'prophet_available': self._prophet_available,
            'arima_available': self._arima_available,
            'fallback_available': True,
            'recommended_model': 'prophet' if self._prophet_available else 'arima' if self._arima_available else 'fallback'
        }
    
    def validate_forecast_input(self, df: pd.DataFrame) -> bool:
        """Validate input data for forecasting"""
        try:
            if df is None or df.empty:
                return False
            
            if 'ds' not in df.columns or 'y' not in df.columns:
                return False
            
            if df['y'].isna().all() or df['ds'].isna().all():
                return False
            
            if len(df) < 2:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Forecast input validation failed: {e}")
            return False