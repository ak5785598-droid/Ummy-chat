'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 ChevronRight, 
 ChevronLeft, 
 Loader, 
 Camera,
 Check,
 UserCheck,
 UserX,
 Trash2,
 Lock,
 Palette,
 ShieldCheck,
 Mic,
 MicOff
} from 'lucide-react';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
 DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, query, collection, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { useRoomImageUpload } from '@/hooks/use-room-image-upload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import { Badge } from '@/components/ui/badge';
import { ROOM_THEMES, RoomTheme } from '@/lib/themes';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MicrophonePermissionHelper } from "@/components/microphone-permission-helper";
import Image from 'next/image';

interface RoomSettingsDialogProps {
 room: any;
 trigger: React.ReactNode;
}

const SettingItem = ({ label, value, extra, onClick, showChevron = true, children, className }: any) => (
 <div 
  onClick={onClick}
  className={cn(
   "flex items-center justify-between p-6 hover:bg-white/[0.03] active:bg-white/[0.05] transition-all cursor-pointer border-b border-white/[0.05] last:border-0 group",
   className
  )}
 >
  <div className="flex flex-col gap-1">
   <span className="font-black text-[12px] text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">{label}</span>
   {value && <span className="text-[10px] font-bold text-white/30 truncate max-w-[200px] uppercase tracking-widest">{value}</span>}
  </div>
  <div className="flex items-center gap-3">
   {children ? children : (
    <>
     {extra && <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">{extra}</span>}
     {showChevron && <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/40 transition-colors" />}
    </>
   )}
  </div>
 </div>
);

/**
 * Room Settings Portal - Sovereign Control Dimension.
 * Re-engineered to filter themes based on room identity.
 */
export function RoomSettingsDialog({ room, trigger }: RoomSettingsDialogProps) {
 const [open, setOpen] = useState(false);
 const [isEditingName, setIsEditingName] = useState(false);
 const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
 const [isEditingTheme, setIsEditingTheme] = useState(false);
 const [isEditingPassword, setIsEditingPassword] = useState(false);
 const [isManagingAdmins, setIsManagingAdmins] = useState(false);
 const [isTestingMic, setIsTestingMic] = useState(false);
 
 const [newName, setNewName] = useState(room.title || room.name);
 const [newAnnouncement, setNewAnnouncement] = useState(room.announcement || '');
 const [newPassword, setNewPassword] = useState(room.password || '');
 
 const [cropImage, setCropImage] = useState<string | null>(null);
 const [isCropOpen, setIsCropOpen] = useState(false);

 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();
 const { isUploading: isUploadingProfile, uploadRoomImage } = useRoomImageUpload(room.id);
 
 const fileInputRef = useRef<HTMLInputElement>(null);

 const isOwner = user?.uid === room.ownerId;
 const isOfficialHelpRoom = room.id === 'ummy-help';
 const userIsOfficial = userProfile?.tags?.some((t: string) => ['Admin', 'Official', 'Super Admin'].includes(t));
 const canUseOfficialThemes = isOfficialHelpRoom || userIsOfficial || isOwner;

 const participantsQuery = useMemoFirebase(() => {
  if (!firestore || !room.id) return null;
  return query(collection(firestore, 'chatRooms', room.id, 'participants'));
 }, [firestore, room.id]);

 const { data: participants } = useCollection(participantsQuery);

 const customThemesQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
 }, [firestore]);

 const { data: customThemes } = useCollection(customThemesQuery);

 const filteredThemes = useMemo(() => {
  const baseline = ROOM_THEMES.filter(theme => {
   if (isOfficialHelpRoom) return theme.category === 'help' || theme.category === 'general';
   if (userIsOfficial || isOwner) return true;
   return theme.category === 'entertainment' || theme.category === 'general';
  });

  const dynamic = (customThemes || []).filter(theme => {
   if (isOfficialHelpRoom) return theme.category === 'help' || theme.category === 'general';
   if (userIsOfficial || isOwner) return true;
   return theme.category === 'entertainment' || theme.category === 'general';
  });

  return [...baseline, ...dynamic];
 }, [isOfficialHelpRoom, userIsOfficial, isOwner, customThemes]);

 const handleUpdate = (field: string, value: any) => {
  if (!firestore) return;
  updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
   [field]: value,
   updatedAt: serverTimestamp()
  });
 };

 const handleToggleMod = (uid: string) => {
  if (!firestore || !room.id) return;
  const isCurrentlyMod = room.moderatorIds?.includes(uid);
  updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
   moderatorIds: isCurrentlyMod ? arrayRemove(uid) : arrayUnion(uid),
   updatedAt: serverTimestamp()
  });
  toast({ title: isCurrentlyMod ? 'Admin Revoked' : 'Admin Granted' });
 };

 const handleSaveName = () => {
  handleUpdate('name', newName);
  setIsEditingName(false);
 };

 const handleSaveAnnouncement = () => {
  handleUpdate('announcement', newAnnouncement);
  setIsEditingAnnouncement(false);
 };

 const handleSavePassword = () => {
  if (newPassword && newPassword.length !== 4) {
   toast({ variant: 'destructive', title: 'Invalid Sync', description: 'Password must be exactly 4 digits.' });
   return;
  }
  handleUpdate('password', newPassword || null);
  setIsEditingPassword(false);
  toast({ title: 'Privacy Sync Complete' });
 };

 const handleSelectTheme = (theme: RoomTheme) => {
  if (theme.isOfficial && !canUseOfficialThemes) {
   toast({ variant: 'destructive', title: 'Access Denied' });
   return;
  }
  if (firestore) {
   updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
    roomThemeId: theme.id,
    backgroundUrl: null,
    updatedAt: serverTimestamp()
   });
  }
  setIsEditingTheme(false);
  toast({ title: 'Theme Synchronized' });
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   const reader = new FileReader();
   reader.onload = () => {
    setCropImage(reader.result as string);
    setIsCropOpen(true);
   };
   reader.readAsDataURL(file);
  }
 };

 const handleCropComplete = async (croppedFile: File) => {
  await uploadRoomImage(croppedFile);
  if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const currentTheme = filteredThemes.find(t => t.id === room.roomThemeId) || ROOM_THEMES[0];

 return (
  <>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
     {trigger}
    </DialogTrigger>
    <DialogContent className="sm:max-w-[450px] h-[90vh] md:h-auto overflow-hidden bg-[#1a1a1a] p-0 rounded-t-[3.5rem] md:rounded-[3rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-700 font-sans text-white">
      <DialogHeader className="p-8 border-b border-white/[0.05] flex flex-row items-center justify-between space-y-0 shrink-0 bg-[#1a1a1a]/50 backdrop-blur-xl relative z-10">
        <button onClick={() => setOpen(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-colors">
         <ChevronLeft className="h-7 w-7" />
        </button>
        <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white/90 italic drop-shadow-md">Sovereign Control</DialogTitle>
        <div className="w-10 text-white/20 hover:text-red-500 transition-colors cursor-pointer flex justify-end">
          <Trash2 className="h-5 w-5" />
        </div>
        <DialogDescription className="sr-only">Manage room identity.</DialogDescription>
      </DialogHeader>

      <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[600px] relative z-0">
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_70%)] pointer-events-none" />
       
       <div className="pb-12 pt-4">
        <div className="px-6 py-4">
          <div 
            onClick={() => !isUploadingProfile && fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-[2.5rem] bg-white/[0.03] border-2 border-white/5 overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-all shadow-2xl shadow-black/40"
          >
            <Image 
              src={room.coverUrl || '/placeholder-room.jpg'} 
              alt="Room Profile" 
              fill 
              className={cn("object-cover transition-transform duration-700 group-hover:scale-105", isUploadingProfile && "blur-sm opacity-50")} 
              unoptimized
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Primary Visual</span>
                <span className="text-lg font-black text-white uppercase tracking-tighter">{room.title || room.name}</span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                {isUploadingProfile ? <Loader className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </div>

        <SettingItem label="Identity Profile" value={room.title || room.name} onClick={() => setIsEditingName(true)} />
        <SettingItem label="Manifesto" value={room.announcement || 'Establish your room vision...'} onClick={() => setIsEditingAnnouncement(true)} />
        
        <SettingItem label="Signal Audit" onClick={() => setIsTestingMic(true)}>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Mic className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
          </div>
        </SettingItem>
        
        <div className="flex items-center justify-between p-6 border-b border-white/[0.05] group">
         <div className="flex flex-col gap-1">
           <span className="font-black text-[12px] text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">Frequency Capacity</span>
           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{room.maxActiveMics || 9} Microwave Slots</span>
         </div>
         <div className="flex items-center gap-3">
          <Select 
           value={String(room.maxActiveMics || 9)} 
           onValueChange={(val) => {
            handleUpdate('maxActiveMics', parseInt(val));
            toast({ title: 'Capacity Synchronized', description: `Room now supports ${val} active frequencies.` });
           }}
          >
           <SelectTrigger className="w-28 h-10 rounded-2xl bg-white/[0.03] border-white/10 text-white font-black text-[10px] uppercase shadow-xl focus:ring-0">
            <SelectValue />
           </SelectTrigger>
           <SelectContent className="bg-[#1f2430] border-white/10 text-white rounded-2xl shadow-2xl">
            <SelectItem value="5" className="font-black italic">5 Slots</SelectItem>
            <SelectItem value="9" className="font-black italic">9 Slots</SelectItem>
            <SelectItem value="13" className="font-black italic">13 Slots</SelectItem>
           </SelectContent>
          </Select>
          <ChevronRight className="h-4 w-4 text-white/10" />
         </div>
        </div>

        <SettingItem label="Privacy Protocol" extra={room.password ? 'ENCRYPTED' : 'OPEN'} onClick={() => isOwner && setIsEditingPassword(true)} />
        <SettingItem label="Ambience Theme" value={currentTheme.name} onClick={() => setIsEditingTheme(true)} />
        <SettingItem label="Security Guard list" onClick={() => setIsManagingAdmins(true)} />
       </div>
     </ScrollArea>

     {isEditingPassword && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsEditingPassword(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Privacy Code</h3>
         <button onClick={handleSavePassword} className="text-cyan-400 font-black uppercase text-xs tracking-widest px-4 py-2 bg-cyan-400/10 rounded-full border border-cyan-400/20">Sync</button>
        </header>
        <div className="p-12 flex flex-col items-center gap-6">
         <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Enter 4-Digit Alpha-Key</span>
         <Input 
           type="password" 
           inputMode="numeric" 
           maxLength={4} 
           placeholder="0000" 
           value={newPassword} 
           onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))} 
           className="h-24 w-full rounded-[2rem] border-white/10 bg-white/5 text-5xl font-black tracking-[0.5em] text-center text-cyan-400 shadow-2xl focus:border-cyan-400/50 transition-all placeholder:text-white/5" 
           autoFocus 
         />
        </div>
      </div>
     )}

     {isEditingTheme && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsEditingTheme(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Ambience Vault</h3>
         <div className="w-10" />
        </header>
        <ScrollArea className="flex-1">
         <div className="grid grid-cols-2 gap-6 p-8 pb-12">
           {filteredThemes.map((theme) => (
            <button key={theme.id} onClick={() => handleSelectTheme(theme)} className={cn("relative flex flex-col gap-3 group active:scale-95 transition-all text-left", theme.isOfficial && !canUseOfficialThemes && "opacity-50 grayscale")}>
              <div className={cn(
                "relative aspect-[9/16] w-full rounded-[2rem] overflow-hidden border-2 transition-all duration-500", 
                room.roomThemeId === theme.id ? "border-cyan-400 shadow-[0_10px_40px_rgba(34,211,238,0.3)] scale-[1.02]" : "border-white/5 grayscale-[0.6] group-hover:grayscale-0 group-hover:border-white/20 shadow-2xl"
              )}>
                <Image src={theme.url} alt={theme.name} fill className="object-cover" sizes="200px" unoptimized />
                {room.roomThemeId === theme.id && (
                  <div className="absolute inset-0 bg-cyan-400/10 flex items-center justify-center">
                    <div className="bg-cyan-400 rounded-full p-2 shadow-2xl">
                      <Check className="h-5 w-5 text-black" strokeWidth={4} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-data-[active=true]:text-cyan-400 truncate block">{theme.name}</span>
                <span className="text-[8px] font-bold uppercase text-white/20 tracking-widest">{theme.category}</span>
              </div>
            </button>
           ))}
         </div>
        </ScrollArea>
      </div>
     )}

     {isEditingName && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsEditingName(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Room Name</h3>
         <button onClick={handleSaveName} className="text-cyan-400 font-black uppercase text-xs tracking-widest px-4 py-2 bg-cyan-400/10 rounded-full border border-cyan-400/20">Sync</button>
        </header>
        <div className="p-12">
         <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-20 rounded-[2rem] border-white/10 bg-white/5 text-2xl font-black text-white focus:border-cyan-400/50 transition-all" autoFocus />
        </div>
      </div>
     )}

     {isEditingAnnouncement && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsEditingAnnouncement(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Manifesto</h3>
         <button onClick={handleSaveAnnouncement} className="text-cyan-400 font-black uppercase text-xs tracking-widest px-4 py-2 bg-cyan-400/10 rounded-full border border-cyan-400/20">Sync</button>
        </header>
        <div className="p-12">
         <Textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} className="h-60 rounded-[2rem] border-white/10 bg-white/5 text-lg font-medium text-white focus:border-cyan-400/50 transition-all p-8" autoFocus />
        </div>
      </div>
     )}

     {isTestingMic && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsTestingMic(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Signal Audit</h3>
         <div className="w-10" />
        </header>
        <div className="p-8">
         <MicrophonePermissionHelper />
        </div>
      </div>
     )}

     {isManagingAdmins && (
      <div className="absolute inset-0 z-[100] bg-[#1a1a1a] animate-in slide-in-from-right duration-500 flex flex-col">
        <header className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
         <button onClick={() => setIsManagingAdmins(false)} className="p-2 -ml-2 text-white/20 hover:text-white transition-all">
           <ChevronLeft className="h-7 w-7" />
         </button>
         <h3 className="font-black uppercase text-xl tracking-tighter italic">Admins</h3>
         <div className="w-10" />
        </header>
        <ScrollArea className="flex-1 p-4">
         {participants?.map((p: any) => (
          <div key={p.uid} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] rounded-3xl transition-colors">
            <div className="flex items-center gap-4">
             <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/5 shadow-2xl transition-transform group-hover:scale-105">
               <AvatarImage src={p.avatarUrl || undefined} />
               <AvatarFallback className="bg-[#2a2a2a] text-white/40">{(p.name || 'U').charAt(0)}</AvatarFallback>
             </Avatar>
             <div className="flex flex-col gap-0.5">
               <p className="font-black text-sm uppercase tracking-tighter italic">{p.name}</p>
               <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{p.uid === room.ownerId ? 'Global Owner' : 'Participant'}</span>
             </div>
            </div>
            {p.uid !== room.ownerId && (
              <Switch 
                checked={room.moderatorIds?.includes(p.uid)} 
                onCheckedChange={() => handleToggleMod(p.uid)} 
                className="data-[state=checked]:bg-cyan-400"
              />
            )}
          </div>
         ))}
        </ScrollArea>
      </div>
     )}

     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </DialogContent>
   </Dialog>

   <ImageCropDialog image={cropImage} open={isCropOpen} onOpenChange={setIsCropOpen} onCropComplete={handleCropComplete} aspect={4/5} />
  </>
 );
}
