import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-[#e92848]">
          UMMY<span className="text-slate-900">CHAT</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 py-12 md:py-20">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">
            Account Deletion Request
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We value your privacy. Follow the instructions below to permanently delete your Ummy Chat account and all associated data.
          </p>
        </div>

        <Card className="p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 bg-white space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase text-slate-900 flex items-center gap-2">
              <span className="bg-slate-100 p-2 rounded-lg"><ShieldCheck className="w-5 h-5 text-green-600" /></span>
              Method 1: In-App Deletion (Fastest)
            </h2>
            <p className="text-slate-600 leading-relaxed pl-11">
              You can instantly delete your account from within the Ummy Chat app:
            </p>
            <ol className="list-decimal pl-16 text-slate-600 space-y-2 font-medium">
              <li>Open the Ummy Chat App.</li>
              <li>Go to your <strong>Profile</strong>.</li>
              <li>Tap the <strong>Settings (Gear icon)</strong> in the top right.</li>
              <li>Scroll to the bottom and tap <strong>DELETE ACCOUNT</strong>.</li>
              <li>Confirm your choice. Your data will be deleted instantly.</li>
            </ol>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase text-slate-900 flex items-center gap-2">
              <span className="bg-slate-100 p-2 rounded-lg"><Mail className="w-5 h-5 text-blue-600" /></span>
              Method 2: Email Request
            </h2>
            <p className="text-slate-600 leading-relaxed pl-11">
              If you no longer have access to the app, you can request account deletion by contacting our support team via email.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl ml-11 border border-slate-100">
              <p className="text-slate-700 font-medium mb-4">Send an email to:</p>
              <a href="mailto:support@ummychat.in" className="text-xl font-bold text-blue-600 hover:underline block mb-6">
                support@ummychat.in
              </a>
              
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Email Format:</p>
              <div className="bg-white border p-4 rounded-xl text-sm font-mono text-slate-700 space-y-2 shadow-sm">
                <p><strong>Subject:</strong> Account Deletion Request</p>
                <p><strong>Body:</strong></p>
                <p>Please delete my Ummy Chat account.</p>
                <p>Ummy ID: [Your Ummy ID]</p>
                <p>Registered Phone/Email: [Your Number or Email]</p>
              </div>
            </div>
          </section>

          <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mt-8">
            <h3 className="font-bold text-amber-900 uppercase tracking-tight mb-2">Data Deletion Policy</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Upon account deletion, all your personal data including profile information, posts, messages, and wallet balance will be permanently and irreversibly deleted from our active servers within 24 hours. Some data may be retained temporarily in secure backups for legal compliance purposes before being purged.
            </p>
          </section>
        </Card>
      </main>
      
      <footer className="bg-slate-900 py-8 px-6 text-center mt-12">
        <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} Ummy Chat. All rights reserved.</p>
      </footer>
    </div>
  );
}
