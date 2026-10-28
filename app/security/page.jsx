'use client';

import React from 'react';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Security Details</h1>
        <p className="text-xs text-slate-500">Status: Active Firewall Defense</p>
        
        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            Security is deeply embedded into our data sync architecture. Our frameworks integrate direct layer processing to secure your files against unverified extraction routines.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">1. Storage Bucket Isolation</h2>
          <p>
            Files uploaded to the storage engine are mapped into distinct pathways identified by authenticated cryptographic user strings. This structural partition prevents directory traversal exploits across tenants.
          </p>
          <h2 className="text-lg font-bold text-slate-200 pt-4">2. Secure Transaction Tokens</h2>
          <p>
            All connection links are parsed using industry-standard communication tokens. This blocks intermediate interception vectors, ensuring that asset downloads remain verified end-to-end.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/" className="text-xs text-blue-400 hover:underline">← Return Home</Link>
        </div>
      </div>
    </div>
  );
}
