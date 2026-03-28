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
 * Premium "Tips" Ban Dialog - Global WePlay Aesthetic
 * Matches the requested screenshot with high-fidelity cyan accents.
 */
export function BanDialog({ 
  isOpen, 
  onClose, 
  bannedUntil, 
  reason = 'behavior went against our Community Guidelines', 
  accountNumber 
}: BanDialogProps) {
  if (!isOpen) return null;

  const untilDate = bannedUntil?.toDate?.() || (bannedUntil instanceof Date ? bannedUntil : null);
  const formattedDate = untilDate ? format(untilDate, 'yyyy/MM/dd HH:mm') : 'Permanent Block';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {/* Dialog Frame */}
      <div className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 fade-in duration-500 font-sans">
        
        {/* Header Section */}
        <div className="pt-10 pb-4 text-center">
          <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Tips</h2>
        </div>

        {/* Content Body */}
        <div className="px-9 pb-10">
          <p className="text-[14px] leading-relaxed text-slate-600 font-medium text-center">
            【2011】 Your recent actions or posts in the Ummy community {reason}. And account has been blocked for 48 hours.
            <br /><br />
            Unlock time is expected to be <span className="font-bold text-slate-900">{formattedDate} UTC+5</span>.
            We ask that you follow the guidelines to help us keep our community safe and respectful.
            <br />
            {accountNumber && <span className="text-[13px] text-slate-400 mt-2 block font-bold tracking-widest text-center uppercase">【{accountNumber}】</span>}
          </p>

          {/* Action Buttons Interface */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank')}
              className="flex-1 h-14 rounded-full border-2 border-[#00CDFF] text-[#00CDFF] font-black text-[14px] uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center hover:bg-[#00CDFF]/5 shadow-sm"
            >
              Customer Service
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 h-14 rounded-full bg-[#00CDFF] text-white font-black text-[14px] uppercase tracking-wide shadow-[0_10px_25px_rgba(0,205,255,0.4)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Top Aesthetic Line */}
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-transparent via-[#00CDFF]/10 to-transparent" />
      </div>
    </div>
  );
}
