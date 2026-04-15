'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle, 
 DialogTrigger,
 DialogDescription
} from '@/components/ui/dialog';
import { 
 ShieldCheck, 
 ChevronRight, 
 Crown, 
 ShoppingBag, 
 Target, 
 ClipboardList, 
 CreditCard, 
 Trophy 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfficialCenterDialogProps {
 isAuthorized: boolean;
}

export function OfficialCenterDialog({ isAuthorized }: OfficialCenterDialogProps) {
 const [open, setOpen] = useState(false);
 const router = useRouter();

 if (!isAuthorized) return null;

 const AdminLink = ({ icon: Icon, label, colorClass, onClick }: any) => (
  <button 
   onClick={onClick}
   className="w-full flex items-center justify-between py-4 border-b border-white/5 px-2 hover:bg-white/5 active:bg-white/10 transition-all text-left group"
  >
   <div className="flex items-center gap-3">
    <div className={cn("p-2 rounded-xl shadow-inner transition-transform group-hover:scale-110", colorClass)}>
     <Icon className="h-5 w-5" />
    </div>
    <span className="font-bold text-sm tracking-tight text-white/90">{label}</span>
   </div>
   <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
  </button>
 );

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <button 
     type="button"
     className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0 text-left"
    >
     <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-indigo-100 text-indigo-600">
       <ShieldCheck className="h-5 w-5" />
      </div>
      <span className="font-bold text-[13px] uppercase text-gray-800 tracking-tight">Official centre</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-indigo-500 uppercase">Supreme Authority</span>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
     </div>
    </button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white p-0 rounded-t-[2.5rem] md:rounded-3xl overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500 font-sans">
    <div className="relative">
     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
     
     <DialogHeader className="p-8 pb-4 text-center border-b border-white/5 relative z-10">
      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl mb-4 animate-in zoom-in duration-500">
       <ShieldCheck className="h-8 w-8 text-white" />
      </div>
      <DialogTitle className="font-sans text-2xl uppercase tracking-[0.2em] text-white">Supreme Authority</DialogTitle>
      <DialogDescription className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mt-2">
       Tribal Command & Control Center
      </DialogDescription>
     </DialogHeader>

     <div className="p-6 pt-2 space-y-1 relative z-10">
      <AdminLink 
       icon={ShieldCheck} 
       label="Admin Portal" 
       colorClass="bg-red-500/20 text-red-400" 
       onClick={() => { router.push('/admin'); setOpen(false); }} 
      />
      <AdminLink 
       icon={Crown} 
       label="Broadcast & Banning" 
       colorClass="bg-amber-500/20 text-amber-400" 
       onClick={() => { router.push('/admin'); setOpen(false); }} 
      />
      <AdminLink 
       icon={ShoppingBag} 
       label="Store Management" 
       colorClass="bg-purple-500/20 text-purple-400" 
       onClick={() => { router.push('/store'); setOpen(false); }} 
      />
      <AdminLink 
       icon={Target} 
       label="Game Controls" 
       colorClass="bg-green-500/20 text-green-400" 
       onClick={() => { router.push('/games'); setOpen(false); }} 
      />
      <AdminLink 
       icon={ClipboardList} 
       label="Task Management" 
       colorClass="bg-blue-500/20 text-blue-400" 
       onClick={() => { router.push('/tasks'); setOpen(false); }} 
      />
      <AdminLink 
       icon={CreditCard} 
       label="Coin Dispatch" 
       colorClass="bg-cyan-500/20 text-cyan-400" 
       onClick={() => { router.push('/wallet'); setOpen(false); }} 
      />
      <AdminLink 
       icon={Trophy} 
       label="Leaderboard" 
       colorClass="bg-orange-500/20 text-orange-400" 
       onClick={() => { router.push('/leaderboard'); setOpen(false); }} 
      />
     </div>
     
     <div className="p-8 border-t border-white/5 bg-white/5 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
       <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Authorization Active</span>
      </div>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
