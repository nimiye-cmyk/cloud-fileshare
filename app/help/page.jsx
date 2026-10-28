'use client';

import React from 'react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    { q: "How do I upgrade my file storage capacity?", a: "Navigate to the Pricing layout, choose a high-bandwidth plan allocation, and the operations team will instantly update your storage quota attributes." },
    { q: "Why is my file pipeline upload failing?", a: "Ensure your individual asset size does not exceed the 50MB ceiling rule, and verify your storage configuration values are active inside your local environment setup." },
    { q: "How do public sharing links function?", a: "Activating the public allocation checkmark inside the upload modal sets an 'isPublic: true' attribute flag. This permits data retrieval checks without standard authentication access requirements." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Help Center & Docs</h1>
        <p className="text-sm text-slate-400">Answers to help you navigate through our system cluster operations effectively.</p>

        <div className="space-y-6 pt-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white">⚙️ {faq.q}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <Link href="/" className="text-xs text-blue-400 hover:underline">← Return Home</Link>
        </div>
      </div>
    </div>
  );
}
