'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-900/80 text-slate-400 selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden z-10 mt-auto">
      
      {/* Subtle Glow Visual Anchor */}
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Block */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5 5 0 00-4.591-2.941A1 1 0 0010 7v3.586L8.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 10.586V5a3 3 0 116 0v1a5 5 0 011 9.9M4.582 9m0 0H9m-4.418 0a2 2 0 112.836-2.836" />
                </svg>
              </div>
              <span className="text-md font-bold tracking-tight text-white">Cloud File Share</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Securely store, organize, and transfer your critical administrative and educational documents.
            </p>
          </div>

          {/* Navigation Links Columns */}
          <div className="grid grid-cols-2 gap-8 md:col-span-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-blue-400 transition-colors">Security Details</Link></li>
              </ul>
            </div>
          </div>

          {/* Updates Newsletter Form Column */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Stay Updated</h4>
            <p className="text-sm text-slate-400">Subscribe to receive system features updates and status checks.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-md">
              <input
                type="email"
                required
                placeholder="Enter email address"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.97]"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            &copy; {currentYear} Cloud File Share. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-500">
            <Link href="/status" className="hover:text-slate-400 transition-colors">System Status</Link>
            <Link href="/help" className="hover:text-slate-400 transition-colors">Help Center</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
