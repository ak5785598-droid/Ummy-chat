'use client';

import { format } from 'date-fns';
import { Ban, X, Headphones, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bannedUntil: any;
  reason?: string;
  accountNumber?: string;
}

/**
 * Premium "Tips" Ban Dialog - Ummy Aesthetic
 * Inspired by WePlay's banned user feedback UI.
 */
export function BanDialog({ 
  isOpen, 
  onClose, 
  bannedUntil, 
  reason = 'Terms of Service Violation', 
  accountNumber 
}: BanDialogProps) {
  if (!isOpen) return null;

  const untilDate = bannedUntil?.toDate?.() || (bannedUntil instanceof Date ? bannedUntil : null);
  const formattedDate = untilDate ? format(untilDate, 'yyyy/MM/dd HH:mm') : 'Permanent Exclusion';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" />
      
      {/* Dialog Content */}
      <div className="relative w-full max-w-[340px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header Style (Subtle Gradient) */}
        <div className="pt-8 pb-4 flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#140028] tracking-tight">Tips</h2>
        </div>

        {/* Content Body */}
        <div className="px-8 pb-8 space-y-5">
          <p className="text-[14px] leading-relaxed text-[#140028]/80 text-center font-medium">
            【2011】 Your recent actions or posts in the Ummy community went against our Community Guidelines. 
            And Account has been blocked for 48 hours. 
            <br /><br />
            Unlock time is expected to be <span className="font-bold text-[#140028]">{formattedDate} UTC+5</span>. 
            We ask that you follow the guidelines to help us keep our community safe and respectful.
            <br />
            {accountNumber && <span className="text-[13px] text-[#140028]/40 mt-2 block font-bold tracking-wider">【{accountNumber}】</span>}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-3">
              <button
                onClick={() => window.open('/help-center', '_blank')}
                className="flex-1 h-12 rounded-full border-2 border-[#00E5FF] text-[#00E5FF] font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
              >
                Customer Service
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-full bg-[#00E5FF] text-white font-bold text-sm shadow-[0_4px_15px_rgba(0,229,255,0.3)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements to match screenshot style */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent" />
      </div>
    </div>
  );
}
