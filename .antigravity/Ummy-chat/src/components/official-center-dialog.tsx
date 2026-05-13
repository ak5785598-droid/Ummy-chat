'use client';

import { useState, useEffect } from 'react';
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
 Trophy,
 Rocket,
 ArrowLeft,
 Save,
 Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface OfficialCenterDialogProps {
 isAuthorized: boolean;
}

export function OfficialCenterDialog({ isAuthorized }: OfficialCenterDialogProps) {
 const [open, setOpen] = useState(false);
 const [view, setView] = useState<'menu' | 'rocket'>('menu');
 const [imageUrl, setImageUrl] = useState('');
 const [animationUrl, setAnimationUrl] = useState('');
 const [isSaving, setIsSaving] = useState(false);

 const router = useRouter();
 const firestore = useFirestore();
 const { toast } = useToast();

 // GLOBAL ROCKET CONFIG SYNC
 const rocketConfigRef = useMemoFirebase(() => {
  if (!firestore) return null;
  return doc(firestore, 'appConfig', 'rocket');
 }, [firestore]);
 const { data: globalRocket } = useDoc(rocketConfigRef);

 // Sync local state when entering management view
 useEffect(() => {
  if (globalRocket && view === 'rocket') {
   setImageUrl(globalRocket.imageUrl || '');
   setAnimationUrl(globalRocket.animationUrl || '');
  }
 }, [globalRocket, view]);

 const handleSaveRocket = async () => {
  if (!firestore) return;
  setIsSaving(true);
  try {
   await setDocumentNonBlocking(doc(firestore, 'appConfig', 'rocket'), {
    imageUrl,
    animationUrl,
    updatedAt: serverTimestamp()
   }, { merge: true });
   toast({ title: 'Rocket Protocol Updated', description: 'Changes deployed to all frequencies.' });
   setView('menu');
  } catch (e) {
   toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not sync with central database.' });
  } finally {
   setIsSaving(false);
  }
 };

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

 const handleOpenChange = (val: boolean) => {
  setOpen(val);
  if (!val) setView('menu'); // Always reset to menu when closing
 };

 return (
  <Dialog open={open} onOpenChange={handleOpenChange}>
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
    {view === 'menu' ? (
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
        icon={Rocket} 
        label="Rocket Management" 
        colorClass="bg-blue-500/20 text-blue-400" 
        onClick={() => setView('rocket')} 
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
    ) : (
     <div className="p-8 animate-in slide-in-from-right duration-300">
       <header className="flex items-center gap-4 mb-8">
         <button onClick={() => setView('menu')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
           <ArrowLeft className="h-5 w-5" />
         </button>
         <div>
           <h3 className="text-xl font-bold uppercase tracking-tight">Rocket Protocol</h3>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Asset Configuration</p>
         </div>
       </header>

       <div className="space-y-6">
         <div className="space-y-2">
           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Display Image (URL)</Label>
           <Input 
             placeholder="https://.../rocket.png" 
             className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono text-xs text-white" 
             value={imageUrl}
             onChange={(e) => setImageUrl(e.target.value)}
           />
         </div>

         <div className="space-y-2">
           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Animation Video (URL)</Label>
           <Input 
             placeholder="https://.../rocket-launch.mp4" 
             className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono text-xs text-white" 
             value={animationUrl}
             onChange={(e) => setAnimationUrl(e.target.value)}
           />
         </div>

         <Button 
           onClick={handleSaveRocket}
           disabled={isSaving}
           className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase shadow-xl shadow-blue-500/20 mt-4"
         >
           {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
           Deploy Protocol
         </Button>
       </div>
     </div>
    )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
