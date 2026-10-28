'use client';

import React from 'react';

export default function FeaturesPage() {
  const highlights = [
    { icon: "⚡", title: "Instant Upload Pipelines", text: "Drag, drop, and witness rapid-fire parsing routines direct to isolated storage nodes." },
    { icon: "🔒", title: "Enterprise Encryption Engine", text: "Military-grade encryption tokens securing your administrative and educational resources." },
    { icon: "🔗", title: "Dynamic Public Permalinks", text: "Toggle asset visibility profiles on the fly to render public nodes instantly." },
    { icon: "📊", title: "Live Real-Time Monitoring", text: "Continuous synchronizations reflecting operational limits and database adjustments." },
    { icon: "📁", title: "Extension Diagnostics Matrix", text: "Deep metadata tag analysis extracting raw document metrics on upload sequences." },
    { icon: "📦", title: "Smart Allocation Vaults", text: "Proactive calculation bounds monitoring storage consumption dynamically." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden py-24 px-4 sm:px-6">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            ⚙️ System Framework Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Engineered For <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Optimal Performance</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Explore the multi-threaded capabilities of Cloud File Share, optimized for deep operational reliability and fast-paced asset exchanges.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((feat, index) => (
            <div key={index} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700/80 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center text-xl shadow-inner mb-4 transition-transform group-hover:scale-110">
                {feat.icon}
              </div>
              <h3 className="text-md font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
