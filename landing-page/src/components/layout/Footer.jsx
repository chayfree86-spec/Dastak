import React from 'react'
import {
  ShoppingBag,
  Store,
  Bike,
  Shield,
  Heart,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { APP_URLS } from '../../config/appUrls'

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#113BD0] via-[#0E2FA8] to-[#0A227A] text-white pt-16 pb-12 border-t border-blue-900/40 relative overflow-hidden">
      {/* Subtle Background Mesh Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF5200]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak Logo"
              className="h-10 w-auto object-contain brightness-0 invert"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-sm font-medium">
              Dastak is India’s next-generation hyperlocal food and grocery delivery platform delivering fresh meals from verified neighborhood kitchens in under 20 minutes.
            </p>
            <div className="pt-2 text-xs text-blue-100/80 space-y-1.5 font-medium">
              <a
                href="mailto:support@dastak.cc"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-orange-300 shrink-0" />
                <span>support@dastak.cc</span>
              </a>
              <a
                href="tel:+919628717175"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>+91 9628717175</span>
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Chay Chaupal, Lalganj, Azamgarh, UP, India</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-blue-100/80">
              <li>
                <a href="#categories" className="hover:text-white hover:underline transition-colors">Popular Cuisines</a>
              </li>
              <li>
                <a href="#restaurants" className="hover:text-white hover:underline transition-colors">Featured Kitchens</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white hover:underline transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#coverage" className="hover:text-white hover:underline transition-colors">Cities &amp; Zones</a>
              </li>
            </ul>
          </div>

          {/* Dastak Ecosystem Portals */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Ecosystem
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-blue-100/80">
              <li>
                <a
                  href={APP_URLS.customerLogin}
                  className="hover:text-white flex items-center gap-1.5 transition-colors group"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-300" />
                  <span className="group-hover:underline">Customer App</span>
                </a>
              </li>
              <li>
                <a
                  href={APP_URLS.partnerLogin}
                  className="hover:text-white flex items-center gap-1.5 transition-colors group"
                >
                  <Store className="w-3.5 h-3.5 text-amber-300" />
                  <span className="group-hover:underline">Restaurant Partner</span>
                </a>
              </li>
              <li>
                <a
                  href={APP_URLS.riderLogin}
                  className="hover:text-white flex items-center gap-1.5 transition-colors group"
                >
                  <Bike className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="group-hover:underline">Delivery Fleet</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-blue-100/80">
              <li>
                <a href="#" className="hover:text-white hover:underline transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline transition-colors">Merchant Agreement</a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline transition-colors">Rider Code of Conduct</a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline transition-colors">FSSAI Compliance</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-100/70 font-medium">
          <p>© {new Date().getFullYear()} Dastak Platform Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
            <span>for food lovers everywhere.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
