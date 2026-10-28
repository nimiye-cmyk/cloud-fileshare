'use client';

import React from 'react';
import Link from 'next/link';

export default function StatusPage() {
  const monitors = [
    { name: "Firestore Data Streams", state: "Operational", color: "text-emerald-400" },
    { name: "Cloud Storage File Core", state: "Operational", color: "text-emerald-400" },
    { name: "Authentication JWT Engine", state: "Operational", color: "text-emerald-400" },
    { name: "Asset Public Permalinks Router", state: "Operational", color: "text-emerald-400" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">System Node Status</h1>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
            All Systems Nominal
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          {monitors.map((node, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-900 last:border-0 last:pb-0">
              <span className="text-sm font-medium text-slate-300">{node.name}</span>
              <span className={`text-xs font-bold ${node.color}`}>{node.state}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Link href="/" className="text-xs text-blue-400 hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </div>
  );
}
