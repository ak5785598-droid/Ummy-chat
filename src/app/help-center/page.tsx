import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

const faqs = [
  {
    question: 'How do I create an account?',
    answer:
      'You can create an account using your phone number, Google account, or Facebook account directly from the login screen.',
  },
  {
    question: 'How do I buy coins?',
    answer:
      "You can buy coins by navigating to Settings > Billing. There you'll find various coin packages available for purchase.",
  },
  {
    question: 'What are coins used for?',
    answer:
      'Coins are used to send virtual gifts to other users in chat rooms and to play premium games in the Game Center.',
  },
  {
    question: 'What is a PK Battle?',
    answer:
      'A PK Battle is a live competition between two hosts in a chat room. Viewers can send gifts to support their favorite host, and the host with the highest gift value at the end of the timer wins.',
  },
  {
    question: 'How can I edit my profile?',
    answer:
      'You can edit your profile information, including your name, bio, and avatar, by going to Settings > Account.',
  },
  {
    question: 'How do I find the Official Help Room?',
    answer:
      'You can find the "Official Help Room" in the main "Explore" list. Our support team is available there to help you with any issues.',
  },
];

export default function HelpCenterPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary uppercase italic">
            Official Help Center
          </h1>
          <p className="text-lg text-muted-foreground font-body">
            Find answers to your questions and get the support you need.
          </p>
        </header>
        
        <Card className="border-none bg-gradient-to-r from-primary/10 to-accent/10 overflow-hidden relative group">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Need Live Support?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground font-body text-lg">
              Join our official help hub to chat with the Ummy Team and community leaders in real-time.
            </p>
            <Link href="/rooms/official-help-room">
               <div className="flex items-center justify-between rounded-2xl border-2 border-primary/20 bg-background/50 p-6 hover:bg-primary/10 transition-all shadow-xl group/btn">
                  <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                         <LifeBuoy className="h-8 w-8 text-white animate-spin-slow" />
                      </div>
                      <div>
                          <h3 className="font-bold text-xl uppercase tracking-tighter">Ummy Official Hub</h3>
                          <p className="text-sm text-muted-foreground font-body">
                              Live Voice & Chat Support • Meet the Team
                          </p>
                      </div>
                  </div>
                   <button className="bg-primary text-white font-black uppercase tracking-widest text-xs px-8 py-3 rounded-full shadow-lg transition-transform group-hover/btn:scale-105">
                      Join Room
                   </button>
              </div>
            </Link>
          </CardContent>
          <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
             <LifeBuoy className="h-64 w-64" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left font-bold">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground font-body text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
