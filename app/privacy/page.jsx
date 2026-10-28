'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last Revised: Current Deployment Matrix</p>
        
        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            This Privacy Statement delineates the data aggregation protocols utilized by Cloud File Share. We preserve your raw authentication identity tokens exclusively to control storage cluster allocations.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">1. Data Nodes Retained</h2>
          <p>
            When utilizing our upload pipelines, your unique user identification parameters (<code className="bg-slate-900 px-1 py-0.5 rounded text-blue-400">userId</code>) are mapped precisely alongside file transaction fields to enforce account security bounds.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">2. Storage Security Profiling</h2>
          <p>
            Files routed as private remain concealed behind your account context verification rules. Public configurations override runtime constraints, rendering download access parameters open to external fetches.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/" className="text-xs text-blue-400 hover:underline">← Return Home</Link>
        </div>
      </div>
    </div>
  );
}
