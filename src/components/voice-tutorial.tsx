'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Users, Gift, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceTutorialProps {
  onComplete: () => void;
}

/**
 * Interactive Onboarding Tutorial.
 * High-fidelity guide for first-time voice chat users.
 */
export function VoiceTutorial({ onComplete }: VoiceTutorialProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Voice Sync",
      description: "Tap the microphone icon to toggle your voice frequency. Green means you are live and the tribe can hear you!",
      icon: Mic,
      color: "text-green-500",
    },
    {
      id: 2,
      title: "Tribe Seats",
      description: "Click any available slot to take a seat. You must be in a seat to broadcast your voice to the room.",
      icon: Users,
      color: "text-blue-400",
    },
    {
      id: 3,
      title: "Send Vibe",
      description: "Use the Boutique to send gifts. High-tier gifts trigger full-screen cinematic animations for everyone!",
      icon: Gift,
      color: "text-pink-500",
    }
  ];

  const currentStep = steps.find(s => s.id === step)!;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500 p-6">
      <div className="bg-[#fffdf0] rounded-[3rem] w-full max-w-sm overflow-hidden border-4 border-white shadow-2xl relative animate-in zoom-in duration-500">
        
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        <div className="p-8 pt-12 flex flex-col items-center text-center space-y-6">
          <div className={cn("h-24 w-24 rounded-[2rem] flex items-center justify-center shadow-xl bg-white", currentStep.color)}>
            <currentStep.icon className="h-12 w-12" />
          </div>

          <div className="space-y-2">
            <h3 className="font-headline text-3xl font-black uppercase tracking-tighter text-gray-900">
              {currentStep.title}
            </h3>
            <p className="text-muted-foreground font-body text-lg leading-relaxed px-4">
              {currentStep.description}
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            {steps.map(s => (
              <div key={s.id} className={cn("h-1.5 rounded-full transition-all duration-500", s.id === step ? "bg-primary w-10" : "bg-gray-200 w-2")} />
            ))}
          </div>

          <Button 
            onClick={() => {
              if (step < steps.length) setStep(step + 1);
              else onComplete();
            }}
            className="w-full h-16 rounded-[1.5rem] text-xl font-black uppercase shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-95 transition-transform"
          >
            {step < steps.length ? 'Next Step' : 'Enter Frequency'}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-400">
             <ShieldCheck className="h-3 w-3 text-green-500" />
             <span>Secure Voice Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
