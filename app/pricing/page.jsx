'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter Sandbox",
      price: "$0",
      period: "forever",
      description: "Perfect for foundational file asset storage adjustments.",
      features: ["1.5 GB Node Quota", "Standard Upload Pipelines", "Single Active Public Links", "Community System Support"],
      cta: "Initialize Session",
      highlight: false
    },
    {
      name: "Pro Allocation",
      price: "$12",
      period: "per month",
      description: "Enhanced bandwidth tracking metrics for rapid file deployments.",
      features: ["50 GB Cloud Allocation", "High Priority Stream Pipes", "Unlimited Public Permalinks", "Advanced Metadata Analytics", "24/7 Monitoring Access"],
      cta: "Upgrade Cluster",
      highlight: true
    },
    {
      name: "Enterprise Architecture",
      price: "$49",
      period: "per month",
      description: "Isolated environments customized for organizational compliance.",
      features: ["Custom Storage Thresholds", "Dedicated Encryption Modules", "Automated Retention Profiles", "SLA System Uptime Guarantees", "Direct Engineer Access"],
      cta: "Contact Ops Team",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden py-24 px-4 sm:px-6">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
            💎 Resource Scaling Plan
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Transparent Pricing, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">No Overhead</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Select the processing bandwidth tier required to sustain your file sharing workload efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier, idx) => (
            <div 
              key={idx} 
              className={`bg-slate-900/40 backdrop-blur-xl border rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                tier.highlight 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl shadow-blue-500/5 scale-105 z-10' 
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full shadow-md">
                  RECOMMENDED
                </span>
              )}

              <div className="space-y-4">
                <h3 className="text-md font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">{tier.description}</p>
                <div className="pt-2 flex items-baseline gap-1.5 text-white">
                  <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                  <span className="text-xs text-slate-500 font-medium">/ {tier.period}</span>
                </div>

                <ul className="pt-6 space-y-3 border-t border-slate-800/60">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="text-blue-400 shrink-0">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  className={`w-full text-center font-semibold text-xs py-3 rounded-xl transition-all active:scale-[0.98] ${
                    tier.highlight 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-blue-400' 
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors">
            <span>←</span> Return to Application Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
