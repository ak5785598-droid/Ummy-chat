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
      'You can find the "Official Help Room" in the main "Rooms" list. Our support team is available there to help you with any issues.',
  },
];

export default function HelpCenterPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Help Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to your questions and get the support you need.
          </p>
        </header>
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
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you can't find the answer you're looking for, join our official help room to chat with a support agent.
            </p>
            <Link href="/rooms/official-help-room">
               <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                      <LifeBuoy className="h-6 w-6 text-primary" />
                      <div>
                          <h3 className="font-semibold">Join Official Help Room</h3>
                          <p className="text-sm text-muted-foreground">
                              Get live support from our team.
                          </p>
                      </div>
                  </div>
                   <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                      Join Room
                   </button>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
