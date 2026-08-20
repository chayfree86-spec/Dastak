import React from 'react'
import Navbar from './components/layout/Navbar'
import HeroSection from './components/home/HeroSection'
import LiveStatsBar from './components/home/LiveStatsBar'
import DynamicCategories from './components/home/DynamicCategories'
import FeaturedRestaurants from './components/home/FeaturedRestaurants'
import EcosystemShowcase from './components/home/EcosystemShowcase'
import HowItWorks from './components/home/HowItWorks'
import CoverageChecker from './components/home/CoverageChecker'
import Testimonials from './components/home/Testimonials'
import Footer from './components/layout/Footer'
import { APP_URLS } from './config/appUrls'

export function App() {
  const handleLocationSearch = (query) => {
    window.location.href = `${APP_URLS.customer}?search=${encodeURIComponent(query)}`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans antialiased selection:bg-[#FF5200] selection:text-white">
      {/* 1. Sticky Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection onLocationSearch={handleLocationSearch} />

      {/* 3. Live Stats Bar */}
      <LiveStatsBar />

      {/* 4. Popular Cuisines / Dynamic Categories */}
      <DynamicCategories />

      {/* 5. Featured Restaurants & Kitchens */}
      <FeaturedRestaurants />

      {/* 6. Dastak 3-in-1 Ecosystem (Customer / Partner / Rider) */}
      <EcosystemShowcase />

      {/* 7. How It Works (20-min delivery flow) */}
      <HowItWorks />

      {/* 8. Live City / Zone Coverage Checker */}
      <CoverageChecker />

      {/* 9. Verified Customer & Merchant Testimonials */}
      <Testimonials />

      {/* 10. Platform Footer */}
      <Footer />
    </div>
  )
}

export default App
