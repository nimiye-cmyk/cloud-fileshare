'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500">Effective Execution Date: Active Sync</p>
        
        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            Welcome to Cloud File Share. By interacting with our system endpoints or pushing document uploads into our database arrays, you agree to comply with the parameters listed below.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">1. Storage Account Quotas</h2>
          <p>
            Users are restricted from manipulating file sizes or spoofing storage balance increments. Exceeding your configured storage allocations will block write operations inside the pipeline interface.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">2. Content Compliance</h2>
          <p>
            Malicious script injection, automated asset scraping, and storing data violating standard security guidelines are strictly barred from all active infrastructure directories.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/" className="text-xs text-blue-400 hover:underline">← Return Home</Link>
        </div>
      </div>
    </div>
  );
}
