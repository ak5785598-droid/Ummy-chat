'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
 trigger?: React.ReactNode;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
}

const SettingItem = ({ label, value, extra, onClick, showChevron = true, children, className }: any) => (
 <div 
  onClick={onClick}
  className={cn(
   "flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer border-b border-gray-50 last:border-0",
   className
  )}
 >
  <div className="flex items-center gap-4">
   <span className="font-bold text-[14px] text-gray-800 uppercase tracking-tight">{label}</span>
  </div>
  <div className="flex items-center gap-3">
   {children ? children : (
    <>
     {value && <span className="text-xs font-bold text-gray-400 truncate max-w-[120px]">{value}</span>}
     {extra && <span className="text-xs font-bold text-gray-400">{extra}</span>}
     {showChevron && <ChevronRight className="h-4 w-4 text-gray-300" />}
    </>
   )}
  </div>
 </div>
);

/**
 * Room Settings Portal - Sovereign Control Dimension.
 * Re-engineered to filter themes based on room identity.
 */
export function RoomSettingsDialog({ room, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: RoomSettingsDialogProps) {
 const router = useRouter();
 const [internalOpen, setInternalOpen] = useState(false);

 const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
 const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
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
 const isModerator = room.moderatorIds?.includes(user?.uid || '') || false;
 const canManage = isOwner || isModerator;
 const isOfficialHelpRoom = room.id === 'ummy-help';
 const userIsOfficial = userProfile?.tags?.some((t: string) => ['Admin', 'Official', 'Super Admin'].includes(t));
 const canUseOfficialThemes = isOfficialHelpRoom || (userIsOfficial && isOwner) || isOwner;

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
  if (!firestore || !canManage) return;
  updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
   [field]: value,
   updatedAt: serverTimestamp()
  });
 };

 const handleToggleMod = (uid: string) => {
  if (!firestore || !room.id || !isOwner) return;
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
    <DialogContent hideClose={true} className="sm:max-w-[450px] h-full sm:h-[90vh] overflow-hidden bg-white p-0 rounded-none sm:rounded-3xl border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500 font-sans text-black z-[9999]">
     <DialogHeader className="p-6 border-b border-gray-50 flex flex-row items-center justify-between space-y-0 shrink-0 bg-white sticky top-0 z-10">
       <button onClick={() => setOpen(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
        <ChevronLeft className="h-6 w-6 text-gray-600" />
       </button>
       <DialogTitle className="text-xl font-bold uppercase tracking-tight">Settings</DialogTitle>
       <div className="w-10" />
       <DialogDescription className="sr-only">Manage room identity.</DialogDescription>
     </DialogHeader>

     <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[600px]">
       <div className="pb-10">
        <SettingItem label="Profile" onClick={() => !isUploadingProfile && fileInputRef.current?.click()} className="py-8">
          <div className="relative">
           <Avatar className="h-16 w-16 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-50">
             <AvatarImage key={room.coverUrl} src={room.coverUrl || undefined} className="object-cover" />
             <AvatarFallback className="bg-slate-200">{(room.title || 'R').charAt(0)}</AvatarFallback>
           </Avatar>
           {isUploadingProfile && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm z-50">
              <Loader className="h-5 w-5 animate-spin text-white" />
            </div>
           )}
           {!isUploadingProfile && (
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-gray-100">
              <Camera className="h-3 w-3 text-gray-400" />
            </div>
           )}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 ml-2" />
        </SettingItem>

        <SettingItem label="Room Name" value={room.title || room.name} onClick={() => setIsEditingName(true)} />
        <SettingItem label="Announcement" value={room.announcement} onClick={() => setIsEditingAnnouncement(true)} />
        
        {/* Microphone Test */}
        <SettingItem label="Microphone Test" onClick={() => setIsTestingMic(true)}>
          <Mic className="h-4 w-4 text-gray-400" />
        </SettingItem>
        
        {/* Re-engineered Mic Selection Portal */}
        <div className="flex items-center justify-between p-5 border-b border-gray-50 last:border-0">
         <span className="font-bold text-[14px] text-gray-800 uppercase tracking-tight">Number of Mic</span>
         <div className="flex items-center gap-2">
          <Select 
           value={String(room.maxActiveMics || 9)} 
           onValueChange={(val) => {
            handleUpdate('maxActiveMics', parseInt(val));
            toast({ title: 'Capacity Synchronized', description: `Room now supports ${val} active frequencies.` });
           }}
          >
           <SelectTrigger className="w-24 h-9 rounded-full bg-slate-50 border-gray-200 text-[10px] font-bold uppercase shadow-sm">
            <SelectValue />
           </SelectTrigger>
           <SelectContent className="bg-white border-2 rounded-xl">
            <SelectItem value="5" className="font-bold">5 Seats</SelectItem>
            <SelectItem value="9" className="font-bold">9 Seats</SelectItem>
            <SelectItem value="13" className="font-bold">13 Seats</SelectItem>
           </SelectContent>
          </Select>
          <ChevronRight className="h-4 w-4 text-gray-300" />
         </div>
        </div>

        <SettingItem label="Room Password" value={room.password ? 'Active' : 'Off'} onClick={() => isOwner && setIsEditingPassword(true)} />
        <SettingItem label="Room Theme" value={currentTheme.name} onClick={() => setIsEditingTheme(true)} />
        <SettingItem label="Administrators" onClick={() => setIsManagingAdmins(true)} />
       </div>
     </ScrollArea>

     {isEditingPassword && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsEditingPassword(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Privacy Code</h3>
         <button onClick={handleSavePassword} className="text-primary font-bold uppercase text-sm tracking-wider px-2">Save</button>
        </header>
        <div className="p-8 flex flex-col gap-4">
         <Input type="password" inputMode="numeric" maxLength={4} placeholder="0000" value={newPassword} onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))} className="h-20 rounded-xl border-2 text-4xl font-bold tracking-[1em] text-center focus:border-primary transition-all" autoFocus />
         
         {/* Remove Password Button */}
         {room.password && (
           <button
             onClick={() => {
               setNewPassword('');
               handleUpdate('password', null);
               setIsEditingPassword(false);
               toast({ title: 'Password Removed', description: 'Room is now open to everyone.' });
             }}
             className="mt-4 flex items-center justify-center gap-2 text-red-500 font-bold uppercase text-sm tracking-wider py-3 border-2 border-red-200 rounded-xl hover:bg-red-50 active:scale-95 transition-all"
           >
             <Trash2 className="h-4 w-4" />
             Remove Password
           </button>
         )}
        </div>
      </div>
     )}

     {isEditingTheme && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsEditingTheme(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Themes</h3>
         <div className="w-10" />
        </header>
        <ScrollArea className="flex-1">
         <div className="grid grid-cols-2 gap-4 p-6">
           {filteredThemes.map((theme) => (
            <button key={theme.id} onClick={() => handleSelectTheme(theme)} className={cn("relative flex flex-col items-center gap-2 group", theme.isOfficial && !canUseOfficialThemes && "opacity-60 grayscale")}>
             <div className={cn("relative aspect-square w-full rounded-2xl overflow-hidden border-4", room.roomThemeId === theme.id ? "border-primary scale-105 shadow-lg" : "border-transparent")}>
               <Image src={theme.url} alt={theme.name} fill className="object-cover" sizes="200px" unoptimized />
               {room.roomThemeId === theme.id && <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-md"><Check className="h-3 w-3 text-white" /></div>}
             </div>
             <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">{theme.name}</span>
            </button>
           ))}
         </div>
        </ScrollArea>
      </div>
     )}

     {isEditingName && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsEditingName(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Room Name</h3>
         <button onClick={handleSaveName} className="text-primary font-bold uppercase text-sm tracking-wider px-2">Save</button>
        </header>
        <div className="p-8">
         <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-16 rounded-2xl border-2 text-xl font-bold focus:border-primary transition-all" autoFocus />
        </div>
      </div>
     )}

     {isEditingAnnouncement && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsEditingAnnouncement(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Announcement</h3>
         <button onClick={handleSaveAnnouncement} className="text-primary font-bold uppercase text-sm tracking-wider px-2">Save</button>
        </header>
        <div className="p-8">
         <Textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} className="h-40 rounded-2xl border-2 text-lg font-body focus:border-primary transition-all p-6" autoFocus />
        </div>
      </div>
     )}

     {isTestingMic && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsTestingMic(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Microphone Test</h3>
         <div className="w-10" />
        </header>
        <div className="p-6">
         <MicrophonePermissionHelper />
        </div>
      </div>
     )}

     {isManagingAdmins && (
      <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
        <header className="p-6 border-b border-gray-50 flex items-center justify-between">
         <button onClick={() => setIsManagingAdmins(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
           <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         <h3 className="font-bold uppercase text-lg tracking-tight">Administrators</h3>
         <div className="w-10" />
        </header>
        <ScrollArea className="flex-1 p-4">
         {participants?.map((p: any) => (
          <div key={p.uid} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setOpen(false);
                router.push(`/profile/${p.uid}`);
              }}
            >
             <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm active:scale-95 transition-transform">
               <AvatarImage src={p.avatarUrl || undefined} />
               <AvatarFallback>U</AvatarFallback>
             </Avatar>
             <div><p className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{p.name}</p></div>
            </div>
            {p.uid !== room.ownerId && <Switch checked={room.moderatorIds?.includes(p.uid)} onCheckedChange={() => handleToggleMod(p.uid)} />}
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
