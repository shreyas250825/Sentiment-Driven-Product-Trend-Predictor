# Sentiment Driven Product Trend Predictor

**Minor in AI, IIT Ropar - Module E**

AI-powered sentiment analysis and trend prediction platform for products. This project analyzes social media sentiment, news articles, and market data to predict product trends and sales forecasting.

## 🚀 Features

### Core Features
- **Multi-Source Data Collection**: Aggregates data from Reddit, Twitter, YouTube, News, Google Trends, and E-commerce platforms
- **Advanced Sentiment Analysis**: Uses OpenRouter AI for sophisticated sentiment analysis
- **Time Series Forecasting**: Implements Prophet and ARIMA models for accurate trend prediction
- **Real-time Trend Prediction**: Live monitoring and prediction of product trends
- **User Authentication**: Secure Firebase authentication system
- **Interactive Dashboard**: Modern React-based dashboard with data visualization
- **Product Comparison**: Compare multiple products side-by-side
- **Analysis History**: Track and review past analyses
- **Newsletter Subscription**: Stay updated with latest trends
- **User Profile Management**: Personalized user experience

### Technical Features
- **RESTful API**: FastAPI backend with automatic documentation
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live data synchronization
- **Data Visualization**: Interactive charts and graphs
- **Error Handling**: Comprehensive error handling and logging
- **Security**: JWT authentication and secure API endpoints

## 🎯 MVP (Minimum Viable Product)

The MVP includes:
1. **User Authentication** (Login/Signup with Firebase)
2. **Product Analysis** (Sentiment analysis for a single product)
3. **Basic Dashboard** (Simple charts and metrics display)
4. **Data Collection** (Integration with 2-3 social media platforms)
5. **Trend Prediction** (Basic forecasting using sentiment data)
6. **Responsive UI** (Works on desktop and mobile)

## 📁 Project Structure

```
sentiment-trend-predictor/
├── backend/                          # FastAPI Backend
│   ├── __init__.py                   # Package initialization
│   ├── main.py                       # FastAPI app initialization and routing
│   ├── run.py                        # Application entry point
│   ├── config.py                     # Configuration settings
│   ├── models.py                     # Pydantic data models
│   ├── dependencies.py               # Authentication and dependency injection
│   ├── utils.py                      # Utility functions and helpers
│   ├── middleware.py                 # Request/response middleware
│   ├── requirements.txt              # Python dependencies
│   ├── routes/                       # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py                   # Authentication endpoints
│   │   ├── analysis.py               # Product analysis endpoints
│   │   ├── profile.py                # User profile management
│   │   ├── newsletter.py             # Newsletter subscription
│   │   └── status.py                 # Health check endpoints
│   ├── services/                     # Business logic and data services
│   │   ├── __init__.py
│   │   ├── trend_predictor.py        # Main trend prediction logic
│   │   ├── product_analyzer.py       # Product analysis service
│   │   ├── sales_forecaster.py       # Sales forecasting algorithms
│   │   ├── google_trends_service.py  # Google Trends data collection
│   │   ├── twitter_service.py        # Twitter API integration
│   │   ├── reddit_service.py         # Reddit data scraping
│   │   ├── youtube_service.py        # YouTube API integration
│   │   ├── news_service.py           # News API integration
│   │   ├── ecommerce_scraper.py      # E-commerce platform scraping
│   │   ├── openrouter_service.py     # OpenRouter AI integration
│   │   └── test_product_matching.py  # Testing utilities
│   ├── user_activity.json            # User activity logs
│   ├── newsletter_subscriptions.json # Newsletter subscriber data
│   ├── app.log                       # Application logs
│   ├── simple_test.py                # Simple testing script
│   ├── test_openrouter.py            # OpenRouter testing
│   ├── test_analysis_corrected.py    # Analysis testing
│   ├── test_analysis_endpoint.py     # API endpoint testing
│   └── test_analysis_endpoint_fixed.py # Fixed endpoint testing
├── src/                              # React Frontend
│   ├── App.js                        # Main React application
│   ├── App.css                       # Global styles
│   ├── index.js                      # Application entry point
│   ├── index.css                     # Index page styles
│   ├── logo.svg                      # Application logo
│   ├── reportWebVitals.js            # Performance monitoring
│   ├── setupTests.js                 # Test configuration
│   ├── components/                   # Reusable React components
│   │   ├── AuthComponents.js         # Authentication components
│   │   ├── Auth/                     # Authentication UI
│   │   │   ├── AuthModal.jsx         # Authentication modal
│   │   │   ├── LoginForm.jsx         # Login form
│   │   │   └── SignupForm.jsx        # Signup form
│   │   ├── Common/                   # Common UI components
│   │   │   ├── Header.jsx            # Application header
│   │   │   ├── Footer.jsx            # Application footer
│   │   │   ├── LoadingSpinner.jsx    # Loading indicator
│   │   │   └── ProtectedRoute.jsx    # Route protection
│   │   └── Dashboard/                # Dashboard components
│   │       ├── Charts/               # Chart components
│   │       │   └── SimpleBarChart.jsx # Bar chart visualization
│   │       ├── Forms/                # Form components
│   │       └── Metrics/              # Metrics display
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.js            # Authentication state
│   │   └── DashboardContext.js       # Dashboard state
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.js                # Authentication hook
│   │   └── useApi.js                 # API interaction hook
│   ├── pages/                        # Page components
│   │   ├── LandingPage.jsx           # Landing/home page
│   │   ├── Login.jsx                 # Login page
│   │   ├── Signup.jsx                # Signup page
│   │   ├── Dashboard.jsx             # Main dashboard
│   │   ├── AnalysisPage.jsx          # Product analysis page
│   │   ├── AnalysisHistoryPage.jsx   # Analysis history
│   │   ├── ProductComparison.jsx     # Product comparison
│   │   └── Profile.jsx               # User profile
│   ├── services/                     # API and external services
│   │   ├── api.js                    # Main API service
│   │   ├── apiInstance.js            # Axios instance configuration
│   │   ├── auth.js                   # Authentication service
│   │   └── firebase.js               # Firebase configuration
│   └── utils/                        # Utility functions
│       └── constants.js              # Application constants
├── public/                           # Static assets
│   ├── index.html                    # Main HTML template
│   ├── favicon.ico                   # Favicon
│   ├── logo192.png                   # Logo 192x192
│   ├── logo512.png                   # Logo 512x512
│   ├── manifest.json                 # PWA manifest
│   └── robots.txt                    # Search engine crawling
├── package.json                      # Node.js dependencies
├── package-lock.json                 # Dependency lock file
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── .gitignore                        # Git ignore rules
├── TODO.md                           # Project tasks and progress
├── README.md                         # Project documentation
└── newsletter-subscription-implementation.txt # Newsletter implementation notes
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd sentiment-trend-predictor/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

5. Run the backend server:
   ```bash
   python run.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd sentiment-trend-predictor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Deployment

### Backend Deployment on Render

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Deploy Backend**
   - Click "New +" and select "Web Service"
   - Connect your GitHub repo and select the `sentiment-trend-predictor` repository
   - Configure build settings:
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `cd backend && python run.py`
   - Add environment variables in Render dashboard
   - Click "Create Web Service"

3. **Environment Variables for Render**
   ```
   OPENROUTER_API_KEY=your_openrouter_key
   FIREBASE_API_KEY=your_firebase_key
   TWITTER_API_KEY=your_twitter_key
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_secret
   NEWS_API_KEY=your_news_api_key
   YOUTUBE_API_KEY=your_youtube_key
   GOOGLE_TRENDS_API_KEY=your_google_trends_key
   DATABASE_URL=your_database_url
   SECRET_KEY=your_secret_key
   ```

### Frontend Deployment on Vercel

1. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub repository

2. **Deploy Frontend**
   - Click "New Project" and import your GitHub repo
   - Configure build settings:
     - **Framework Preset**: Create React App
     - **Root Directory**: `./` (leave as default)
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
   - Add environment variables:
     ```
     REACT_APP_API_BASE_URL=https://your-render-backend-url.onrender.com
     REACT_APP_FIREBASE_API_KEY=your_firebase_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     ```
   - Click "Deploy"

3. **Update Backend CORS**
   - After deployment, update your backend's CORS settings to allow requests from your Vercel domain

## 📚 API Documentation

Once the backend is running, visit:
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc`

## 🔧 Environment Variables

### Backend (.env)
```
# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Social Media APIs
TWITTER_API_KEY=your_twitter_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
NEWS_API_KEY=your_news_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# Google Services
GOOGLE_TRENDS_API_KEY=your_google_trends_api_key

# Database
DATABASE_URL=your_database_url

# Security
SECRET_KEY=your_secret_key
```

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Minor in AI program at IIT Ropar.

## 👥 Team

- **Project**: Sentiment Driven Product Trend Predictor
- **Module**: Module E
- **Institution**: IIT Ropar
- **Program**: Minor in AI

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.
