'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  X, 
  Trophy, 
  Users, 
  Coins, 
  TrendingUp, 
  Plus, 
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoomSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomStats?: {
    weeklyGifts: number;
    totalGifts: number;
  };
  visitorCount?: number;
  levelPoints?: number;
}

const GOALS_REWARDS = [
  { level: 17, visitors: '≥130', roomCoins: '2600M', totalCoins: '250,960,000', hostCoins: '152,200,000', partnerCoins: '8,230,000', partners: 13 },
  { level: 16, visitors: '≥120', roomCoins: '1900M', totalCoins: '187,150,000', hostCoins: '100,750,000', partnerCoins: '7,200,000', partners: 12 },
  { level: 15, visitors: '≥110', roomCoins: '1300M', totalCoins: '131,580,000', hostCoins: '77,350,000', partnerCoins: '4,930,000', partners: 11 },
  { level: 14, visitors: '≥100', roomCoins: '800M', totalCoins: '82,250,000', hostCoins: '45,250,000', partnerCoins: '3,700,000', partners: 10 },
  { level: 13, visitors: '≥90', roomCoins: '600M', totalCoins: '61,670,000', hostCoins: '33,950,000', partnerCoins: '3,080,000', partners: 9 },
  { level: 12, visitors: '≥70', roomCoins: '400M', totalCoins: '41,160,000', hostCoins: '21,400,000', partnerCoins: '2,470,000', partners: 8 },
  { level: 11, visitors: '≥50', roomCoins: '300M', totalCoins: '19,750,000', hostCoins: '17,900,000', partnerCoins: '1,850,000', partners: 7 },
  { level: 10, visitors: '≥45', roomCoins: '200M', totalCoins: '20,530,000', hostCoins: '13,150,000', partnerCoins: '1,230,000', partners: 6 },
  { level: 9, visitors: '≥40', roomCoins: '150M', totalCoins: '15,650,000', hostCoins: '10,300,000', partnerCoins: '1,070,000', partners: 5 },
  { level: 8, visitors: '≥35', roomCoins: '100M', totalCoins: '12,500,000', hostCoins: '9,200,000', partnerCoins: '550,000', partners: 5 },
  { level: 7, visitors: '≥30', roomCoins: '75M', totalCoins: '9,543,750', hostCoins: '7,012,500', partnerCoins: '506,250', partners: 5 },
  { level: 6, visitors: '≥25', roomCoins: '50M', totalCoins: '6,750,000', hostCoins: '4,750,000', partnerCoins: '400,000', partners: 5 },
  { level: 5, visitors: '≥20', roomCoins: '22.5M', totalCoins: '3,225,000', hostCoins: '2,325,000', partnerCoins: '225,000', partners: 4 },
  { level: 4, visitors: '≥15', roomCoins: '15M', totalCoins: '2,200,000', hostCoins: '1,600,000', partnerCoins: '200,000', partners: 3 },
  { level: 3, visitors: '≥10', roomCoins: '10M', totalCoins: '1,488,350', hostCoins: '1,353,350', partnerCoins: '135,000', partners: 3 },
  { level: 2, visitors: '≥5', roomCoins: '5M', totalCoins: '600,000', hostCoins: '450,000', partnerCoins: '150,000', partners: 1 },
  { level: 1, visitors: '≥2', roomCoins: '2.5M', totalCoins: '350,000', hostCoins: '275,000', partnerCoins: '75,000', partners: 1 },
];

export function RoomSupportDialog({ 
  open, 
  onOpenChange, 
  roomStats, 
  visitorCount = 0,
  levelPoints = 0
}: RoomSupportDialogProps) {
  
  // Calculate Room Level based on points (simplistic mapping for now)
  const roomLevel = Math.floor(Math.sqrt(levelPoints / 1000)) || 0;
  const roomCoins = roomStats?.weeklyGifts || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose={true}
        className="w-full h-full max-w-none bg-[#0a0f1d] border-none text-white rounded-none p-0 overflow-hidden shadow-none z-[3000] font-headline"
      >
        <div className="absolute top-0 left-0 w-full h-[300px] z-0 overflow-hidden">
          <Image 
            src="/images/haza_style_room_support_lions_trophy_header_1776810688232.png" 
            alt="Support Header" 
            fill 
            className="object-cover opacity-90 contrast-[1.1] brightness-[0.9]"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1d]/40 to-[#0a0f1d]" />
        </div>

        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-10 left-4 z-[3100] h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <ScrollArea className="h-full w-full relative z-10 pt-16">
          <div className="px-4 pb-12 space-y-6">
            
            {/* PAGE TITLE */}
            <div className="text-center mb-10 pt-20">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full" />
                <h1 className="relative text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-200 to-blue-400 drop-shadow-[0_2px_10px_rgba(37,99,235,0.5)]">
                  Room Support
                </h1>
              </div>
            </div>

            {/* MY ROOM SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="px-6 py-1.5 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent border-y border-blue-500/30">
                  <h2 className="text-sm font-black uppercase tracking-widest text-blue-100">My Room</h2>
                </div>
              </div>

              <div className="bg-[#121b2d]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-[10px] font-bold">
                  <thead className="bg-blue-900/40 border-b border-blue-800/50">
                    <tr className="text-blue-300/70">
                      <th className="py-2 px-1 text-left font-black uppercase tracking-tighter">Period</th>
                      <th className="py-2 px-1 text-center font-black uppercase tracking-tighter">Level</th>
                      <th className="py-2 px-1 text-center font-black uppercase tracking-tighter">Rewards</th>
                      <th className="py-2 px-1 text-center font-black uppercase tracking-tighter">Visitors</th>
                      <th className="py-2 px-1 text-right font-black uppercase tracking-tighter">Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5 bg-blue-500/5">
                      <td className="py-2.5 px-1 text-blue-400">This Week</td>
                      <td className="py-2.5 px-1 text-center">{roomLevel}</td>
                      <td className="py-2.5 px-1 text-center text-yellow-400">0</td>
                      <td className="py-2.5 px-1 text-center">{visitorCount}</td>
                      <td className="py-2.5 px-1 text-right text-cyan-400">{roomCoins}</td>
                    </tr>
                    <tr className="bg-white/5 opacity-50">
                      <td className="py-2.5 px-1 text-white/40">Last Week</td>
                      <td className="py-2.5 px-1 text-center">0</td>
                      <td className="py-2.5 px-1 text-center italic">--</td>
                      <td className="py-2.5 px-1 text-center">0</td>
                      <td className="py-2.5 px-1 text-right">0</td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-3 bg-blue-950/40 border-t border-white/5 text-[9px] text-white/40 italic text-center">
                  This week's rewards will be delivered next Wednesday (UTC+0)
                </div>
              </div>
            </div>

            {/* PARTNERS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="px-6 py-1.5 bg-gradient-to-r from-transparent via-cyan-600/40 to-transparent border-y border-cyan-500/30">
                  <h2 className="text-sm font-black uppercase tracking-widest text-cyan-100">Partners</h2>
                </div>
              </div>

              <div className="bg-[#121b2d]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Users className="h-16 w-16 text-cyan-400" />
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/5 shadow-inner">
                    <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Add Time:</span>
                    <span className="text-[11px] font-black text-cyan-400">01h : 36m : 02s</span>
                  </div>
                  <p className="text-[10px] text-white/40 text-center leading-relaxed max-w-[80%]">
                    Partners can be added from Monday 00:00 to Tuesday 24:00 (UTC+0).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 h-24">
                  {[1, 2, 3].map(i => (
                    <button key={i} className="h-full rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group active:scale-95 transition-all hover:bg-white/10 hover:border-cyan-500/30">
                      <Plus className="h-6 w-6 text-white/20 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GOALS & REWARDS SECTION */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-center">
                <div className="px-6 py-1.5 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent border-y border-amber-500/30">
                  <h2 className="text-sm font-black uppercase tracking-widest text-amber-100">Goals & Rewards</h2>
                </div>
              </div>

              <div className="bg-[#121b2d]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-[8.5px] font-bold leading-tight table-fixed">
                    <thead className="bg-[#1a253a] border-b border-white/5 text-center">
                      <tr className="text-white/40">
                        <th className="py-2 px-0.5 w-[35px]" rowSpan={2}>Level</th>
                        <th className="py-1 px-0.5 border-b border-white/5" colSpan={2}>Goals</th>
                        <th className="py-1 px-0.5 border-b border-white/5" colSpan={4}>Rewards</th>
                      </tr>
                      <tr className="text-white/60">
                        <th className="py-1.5 px-0.5 border-r border-white/5">Room<br/>Visitors</th>
                        <th className="py-1.5 px-0.5 border-r border-white/5">Room<br/>Coins</th>
                        <th className="py-1.5 px-0.5 border-r border-white/5">Total<br/>Coins</th>
                        <th className="py-1.5 px-0.5 border-r border-white/5 text-yellow-400">Room Host<br/>Coins</th>
                        <th className="py-1.5 px-0.5 border-r border-white/5">Partners<br/>Coins</th>
                        <th className="py-1.5 px-0.5 w-[35px]">Partners</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GOALS_REWARDS.map((goal, idx) => (
                        <tr key={idx} className={cn("text-center border-b border-white/5", idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent")}>
                          <td className="py-2 font-black text-blue-400">{goal.level}</td>
                          <td className="py-2 px-0.5 border-r border-white/5">{goal.visitors}</td>
                          <td className="py-2 px-0.5 border-r border-white/5 text-cyan-400">{goal.roomCoins}</td>
                          <td className="py-2 px-0.5 border-r border-white/5 text-white/70 tabular-nums">{goal.totalCoins}</td>
                          <td className="py-2 px-0.5 border-r border-white/5 text-yellow-400 tabular-nums">{goal.hostCoins}</td>
                          <td className="py-2 px-0.5 border-r border-white/5 text-blue-300 tabular-nums">{goal.partnerCoins}</td>
                          <td className="py-2 px-0.5 font-black text-white/60">{goal.partners}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="bg-black/20 rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-white/40" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white/60">-Note-</span>
              </div>
              <ol className="text-[10px] text-white/40 space-y-3 pl-4 list-decimal leading-relaxed italic">
                <li>Weekly room visits and coin statistics are counted from Monday 00:00 to Sunday 23:59 (UTC+0).</li>
                <li>Room owners must submit the partner information before Wednesday; otherwise, the reward will be forfeited.</li>
                <li>The official team will send the reward to the room owner and partner on Wednesday.</li>
              </ol>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
