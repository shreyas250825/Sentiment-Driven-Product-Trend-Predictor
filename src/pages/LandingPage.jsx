import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Shield, Zap, ArrowRight, Star, Users, Award, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      name: 'Sentiment Analysis',
      description: 'Analyze customer reviews using advanced NLP models to understand product sentiment with 95% accuracy.',
      icon: BarChart3,
      gradient: 'from-blue-500 to-indigo-600',
      stats: '95% Accuracy'
    },
    {
      name: 'Trend Prediction',
      description: 'Predict product demand trends by combining sentiment analysis with real-time sales data.',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      stats: '30 Days Forward'
    },
    {
      name: 'Explainable AI',
      description: 'Understand why trends are predicted with SHAP-based explanations and transparent decision trees.',
      icon: Shield,
      gradient: 'from-purple-500 to-violet-600',
      stats: '100% Transparent'
    },
    {
      name: 'Real-time Insights',
      description: 'Get up-to-date information using social media, search trends, and market data streams.',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
      stats: 'Live Updates'
    },
  ];

  const testimonials = [
    {
      name: 'Siddhi Tiwari',
      role: 'Chief Executive Officer, HearMeOut',
      content: 'TrendSight helped us increase product launch success rate by 78%. The insights are incredibly accurate.',
      rating: 5
    },
    {
      name: 'Aayushi Verma',
      role: 'E-commerce Director, RetailGiant',
      content: 'The trend predictions are spot-on. We reduced inventory costs by 45% using TrendSight.',
      rating: 5
    }
  ];

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Award className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-white">Project -Module-E , Minor in AI , IIT Ropar </span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                Predict Product
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block">
                  Trends with AI
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                Transform your business with AI-powered insights that combine sentiment analysis, 
                market trends, and predictive analytics to forecast product demand with unprecedented accuracy.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleSignUp}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-white shadow-2xl transform hover:scale-105 transition-all duration-200 hover:shadow-cyan-500/25"
                >
                  <span className="relative z-10">Signup</span>
                  <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                
                <button
                  onClick={handleLogin}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all duration-200"
                >
                  Login
                </button>
              </div>

              <div className="flex items-center space-x-8 text-gray-300">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-cyan-400" />
                  <span className="font-semibold">10,000+</span>
                  <span className="ml-1">Users</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-400" />
                  <span className="font-semibold">4.9/5</span>
                  <span className="ml-1">Rating</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-400" />
                  <span className="font-semibold">98%</span>
                  <span className="ml-1">Accuracy</span>
                </div>
              </div>
            </div>

            {/* Interactive visualization */}
            <div className={`mt-12 lg:mt-0 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-3xl filter blur-3xl"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                      <div
                        key={feature.name}
                        className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                          activeFeature === index
                            ? `bg-gradient-to-br ${feature.gradient} border-white/30 shadow-xl scale-105`
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                        onClick={() => setActiveFeature(index)}
                      >
                        <feature.icon className={`h-8 w-8 mb-3 ${activeFeature === index ? 'text-white' : 'text-gray-300'}`} />
                        <h3 className={`font-semibold text-sm mb-1 ${activeFeature === index ? 'text-white' : 'text-gray-200'}`}>
                          {feature.name}
                        </h3>
                        <p className={`text-xs ${activeFeature === index ? 'text-white/90' : 'text-gray-400'}`}>
                          {feature.stats}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
                    <p className="text-white text-sm leading-relaxed">
                      {features[activeFeature].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Modern Business</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to stay ahead of market trends and make data-driven decisions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="flex items-center mt-3 text-cyan-400 font-medium">
                        <span className="text-sm">Learn more</span>
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-3xl filter blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Live Analytics Dashboard</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Prediction Accuracy</span>
                    <span className="text-emerald-400 font-semibold">98.3%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full w-[98.3%] animate-pulse"></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-gray-300">Active Analyses</span>
                    <span className="text-purple-400 font-semibold">1,247</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full w-[76%] animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-200 text-lg mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-r from-cyan-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands of companies using AI to predict market trends and stay ahead of the competition.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleSignUp}
              className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all duration-200 hover:shadow-cyan-500/25"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
          
          <p className="text-gray-400 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;