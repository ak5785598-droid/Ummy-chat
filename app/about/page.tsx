'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { UmmyLogoIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * High-Fidelity Official About Dimension.
 * Corrected to root App directory with integrated User Agreement.
 */
export default function AboutPage() {
  const router = useRouter();

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav fullScreen>
      <div className="min-h-full bg-[#f8f9fa] font-headline flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
        
        {/* Ambient Top Gradient Sync */}
        <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

        <header className="relative z-50 p-6 pt-12 flex items-center">
           <button 
             onClick={() => router.back()} 
             className="p-1 -ml-1 hover:scale-110 transition-transform active:scale-90"
           >
              <ChevronLeft className="h-7 w-7 text-gray-800" strokeWidth={2.5} />
           </button>
           <h1 className="text-xl font-black text-gray-800 absolute left-1/2 -translate-x-1/2">About</h1>
        </header>

        <main className="relative z-50 flex-1 px-6 mt-4">
           <Card className="rounded-[2.5rem] bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col items-center">
              <div className="pt-14 pb-16 flex flex-col items-center gap-4 text-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-pink-400/5 blur-2xl rounded-full scale-150" />
                    <div className="h-32 w-32 relative rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-white flex items-center justify-center">
                       <UmmyLogoIcon className="h-24 w-24" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">UMMY</h2>
                    <p className="text-[13px] font-bold text-gray-400 tracking-tight">Current Version 1.03.20</p>
                 </div>
              </div>

              <div className="w-full">
                 <Dialog>
                    <DialogTrigger asChild>
                       <button 
                         className="w-full flex items-center justify-between p-10 py-12 hover:bg-gray-50 active:bg-gray-100 transition-all text-left group border-t border-gray-50"
                       >
                          <span className="text-[17px] font-black text-gray-700 italic tracking-tight">User Agreement</span>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                       </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
                       <DialogHeader className="p-8 pb-4 border-b">
                          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">User Agreement</DialogTitle>
                          <DialogDescription className="sr-only">Ummy Chat official terms of service.</DialogDescription>
                       </DialogHeader>
                       <ScrollArea className="h-[60vh] p-8 pt-4">
                          <div className="space-y-6 text-gray-600 font-body text-base leading-relaxed">
                             <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 uppercase italic">Ummy Chat User Agreement</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last updated: January 2026</p>
                             </div>

                             <p className="font-black text-slate-800 italic bg-pink-50/50 p-4 rounded-xl border border-pink-100/50">
                                Welcome to Ummy! 😊 By using our app, you agree to these terms.
                             </p>
                             
                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*1. Eligibility*</h4>
                                <p>You must be 18+ to use Ummy. By using the app, you confirm you're at least 18.</p>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*2. Account*</h4>
                                <ul className="list-disc pl-5 space-y-1.5">
                                   <li>Create an account with accurate info.</li>
                                   <li>Keep your account secure; you're responsible for activity on your account.</li>
                                   <li>Don't share your account or let others use it.</li>
                                </ul>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*3. Content*</h4>
                                <ul className="list-disc pl-5 space-y-1.5">
                                   <li>Post content that's legal, respectful, and doesn't violate others' rights.</li>
                                   <li>Don't post explicit, abusive, or harmful content.</li>
                                   <li>You own your content, but grant Ummy permission to use it for the app.</li>
                                </ul>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*4. Behavior*</h4>
                                <ul className="list-disc pl-5 space-y-1.5">
                                   <li>Be respectful to others.</li>
                                   <li>No harassment, bullying, or hate speech.</li>
                                   <li>No spamming or scams.</li>
                                </ul>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*5. Services*</h4>
                                <p>Ummy provides a platform for social interaction. We can change or stop services anytime.</p>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*6. Payment & Coins*</h4>
                                <ul className="list-disc pl-5 space-y-1.5">
                                   <li>Use Party Coins for in-app features.</li>
                                   <li>Payments are non-refundable.</li>
                                   <li>Abuse of payment systems will lead to account suspension.</li>
                                </ul>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*7. Seller Policy*</h4>
                                <ul className="list-disc pl-5 space-y-1.5">
                                   <li>Anyone can apply to be a seller.</li>
                                   <li>Sellers have 4 levels: Seller, S Seller, A Seller, SA Seller.</li>
                                   <li>Sellers manage transactions at their own risk.</li>
                                   <li>Supported payment methods: Paytm, Google Pay, Phone Pe.</li>
                                   <li>Violations can lead to permanent ban.</li>
                                </ul>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*8. Intellectual Property*</h4>
                                <p>Ummy owns the app's IP. Don't copy or misuse Ummy's features.</p>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*9. Termination*</h4>
                                <p>We can suspend or terminate your account for violations. You can deactivate your account anytime.</p>
                             </section>

                             <section className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*10. Changes*</h4>
                                <p>We can update these terms. Changes are effective immediately.</p>
                             </section>

                             <section className="space-y-2 pb-10">
                                <h4 className="font-black text-slate-900 uppercase text-sm italic tracking-tight">*11. Contact*</h4>
                                <p>For questions, contact us via the official support channels in the Help Center.</p>
                             </section>

                             <p className="font-black text-slate-900 italic text-center py-4 border-t">
                                By using Ummy, you agree to these terms.
                             </p>
                          </div>
                       </ScrollArea>
                       <div className="p-8 pt-0 border-t bg-slate-50/50">
                          <button 
                            className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all"
                          >
                             Understand & Agree
                          </button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
           </Card>
        </main>

        <footer className="p-12 text-center">
           <div className="inline-block h-1.5 w-14 bg-gray-100 rounded-full" />
        </footer>

      </div>
    </AppLayout>
  );
}
