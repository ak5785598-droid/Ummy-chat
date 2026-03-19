'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShieldCheck, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';

const faqs = [
  {
    question: 'How do I create an account?',
    answer:
      'You can create an account using your phone number or Google account directly from the login screen.',
  },
  {
    question: 'How do I buy coins?',
    answer:
      "You can buy coins by navigating to Boutique > Gold Coins. There you'll find various coin packages available for purchase.",
  },
  {
    question: 'What are coins used for?',
    answer:
      'Coins are used to send virtual gifts to other users in chat rooms and to equip premium assets in the Boutique.',
  },
  {
    question: 'How can I edit my profile?',
    answer:
      'You can edit your profile information, including your name, bio, and avatar, by going to Me > Modify Persona.',
  },
  {
    question: 'How do I launch a frequency?',
    answer:
      'On the main Home screen, select "Create Room" to define your frequency and gather your tribe.',
  },
];

/**
 * Help Center - High-Fidelity Light Green Edition (Source Sync).
 */
export default function HelpCenterPage() {
  return (
    <AppLayout>
      <div className="min-h-full bg-[#f1f8e9] font-headline flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
        
        <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

        <div className="relative z-10 space-y-8 p-6 max-w-4xl mx-auto pb-32">
          <header className="space-y-3 pt-10">
            <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-xl px-4 py-1 rounded-full border border-white/50 shadow-sm">
               <Zap className="h-3.5 w-3.5 text-yellow-500 fill-current" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-800">Support Protocol</span>
            </div>
            <h1 className="font-headline text-5xl font-black tracking-tight text-green-900 uppercase italic leading-none">
              Official Help Center
            </h1>
            <p className="text-xl text-green-700/70 font-body italic">
              Find answers to your questions and get the support you need.
            </p>
          </header>
          
          <Card className="border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden relative group">
            <CardHeader className="bg-green-50/50 border-b border-green-100 p-8">
              <CardTitle className="font-headline text-2xl text-green-900 uppercase italic tracking-tighter">Need Live Support?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <p className="text-gray-600 font-body text-xl italic leading-relaxed">
                Contact our official support team via email or look for members with the <span className="text-green-600 font-black bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">"Official"</span> badge in any frequency.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between rounded-[2.5rem] border-2 border-green-100 bg-green-50/30 p-8 hover:bg-green-50 transition-all shadow-sm group/btn gap-6">
                  <div className="flex items-center gap-6">
                      <div className="h-20 w-20 bg-green-600 rounded-3xl flex items-center justify-center shadow-xl shadow-green-900/20 group-hover/btn:rotate-6 transition-transform">
                          <Mail className="h-10 w-10 text-white" />
                      </div>
                      <div>
                          <h3 className="font-black text-2xl uppercase tracking-tighter text-green-900 italic">Ummy Support</h3>
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-[0.2em] mt-1">
                              Response in 24 Hours Sync
                          </p>
                      </div>
                  </div>
                  <button className="w-full sm:w-auto bg-green-600 text-white font-black uppercase italic tracking-widest text-base px-12 py-5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
                      Email Us
                  </button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center gap-4 ml-4">
               <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
               </div>
               <h2 className="text-2xl font-black uppercase tracking-tight text-green-900 italic">
                 FAQ Dimension
               </h2>
            </div>
            
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/80 backdrop-blur-md overflow-hidden border border-white/40">
              <CardContent className="p-4">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="border-green-50/50 px-6 last:border-0">
                      <AccordionTrigger className="text-left font-black uppercase italic text-lg py-8 text-slate-800 hover:text-green-600 hover:no-underline transition-colors gap-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-500 font-body text-xl pb-8 italic leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
