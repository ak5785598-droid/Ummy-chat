'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, Mail, Sparkles, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { cn } from '@/lib/utils';

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

export default function HelpCenterPage() {
  return (
    <AppLayout>
      <div className="min-h-full bg-ummy-gradient relative overflow-hidden font-headline">
        {/* Cinematic Atmospheric Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />

        <div className="relative z-10 space-y-10 p-6 max-w-4xl mx-auto pb-32">
          <header className="space-y-4 pt-10">
            <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-xl px-5 py-1.5 rounded-full border border-white/50 shadow-sm animate-in fade-in zoom-in duration-700">
               <Zap className="h-3.5 w-3.5 text-yellow-500 fill-current" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tribal Authority Support</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-in slide-in-from-left-6 duration-1000">
              Official Help Hub
            </h1>
            <p className="text-2xl text-muted-foreground font-body italic opacity-80 max-w-2xl">
              Synchronize with our elite frequency. Find answers and establish your tribal presence.
            </p>
          </header>
          
          <Card className="border-none bg-gradient-to-br from-primary/30 via-white/90 to-accent/30 backdrop-blur-2xl overflow-hidden relative group rounded-[3rem] shadow-2xl border-2 border-white/50">
            <CardHeader className="relative z-10 p-8 pb-2">
              <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-primary drop-shadow-sm">Need Live Support?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10 p-8 pt-4">
              <p className="text-gray-700 font-body text-xl italic leading-relaxed">
                Contact our official support team via email or look for members with the <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">"Official"</span> badge in any frequency.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-between rounded-[2.5rem] border-2 border-primary/20 bg-white/80 p-8 hover:bg-white transition-all shadow-2xl group/btn gap-6">
                  <div className="flex items-center gap-6">
                      <div className="h-20 w-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transition-all duration-500 group-hover/btn:rotate-12 group-hover/btn:scale-110">
                          <Mail className="h-10 w-10 text-white" />
                      </div>
                      <div>
                          <h3 className="font-black text-3xl uppercase tracking-tighter text-gray-900 italic">Ummy Support</h3>
                          <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">
                              Response in 24 Hours Protocol
                          </p>
                      </div>
                  </div>
                  <button className="w-full md:w-auto bg-primary text-white font-black uppercase italic tracking-widest text-lg px-12 py-5 rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 hover:bg-accent">
                      Email Us Now
                  </button>
              </div>
            </CardContent>
            <div className="absolute -bottom-20 -right-20 opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
               <LifeBuoy className="h-96 w-64 text-primary" />
            </div>
          </Card>

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-4">
               <div className="bg-accent/10 p-2 rounded-xl">
                  <Sparkles className="h-6 w-6 text-accent animate-pulse" />
               </div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-800">
                 Frequently Asked Questions
               </h2>
            </div>
            
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white/90 backdrop-blur-xl overflow-hidden border border-white/40">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="border-gray-50/50 px-6">
                      <AccordionTrigger className="text-left font-black uppercase italic text-lg py-8 hover:text-primary transition-all hover:no-underline gap-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 font-body text-xl pb-8 italic leading-relaxed opacity-90">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
