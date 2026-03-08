'use client';

import { useState, useRef, useMemo } from 'react';
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
  ShieldCheck
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
import Image from 'next/image';

interface RoomSettingsDialogProps {
  room: any;
  trigger: React.ReactNode;
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
      <span className="font-black text-[14px] text-gray-800 uppercase tracking-tight">{label}</span>
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
 * Now synchronizes with dynamic themes uploaded via the Admin Theme Hub.
 */
export function RoomSettingsDialog({ room, trigger }: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  
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
  const isOfficialHelpRoom = room.id === 'ummy-help-center';
  const userIsOfficial = userProfile?.tags?.some(t => ['Admin', 'Official', 'Super Admin'].includes(t));
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

  // Filter themes based on official/help requirements and merge custom ones
  const filteredThemes = useMemo(() => {
    const baseline = ROOM_THEMES.filter(theme => {
      if (isOfficialHelpRoom) {
        return theme.category === 'help' || theme.category === 'general';
      }
      if (userIsOfficial || isOwner) {
        if (theme.category === 'help') return false;
        return true;
      }
      return theme.category === 'general';
    });

    const dynamic = (customThemes || []).filter(theme => {
      if (isOfficialHelpRoom) {
        return theme.category === 'help' || theme.category === 'general';
      }
      if (userIsOfficial || isOwner) {
        if (theme.category === 'help') return false;
        return true;
      }
      return theme.category === 'general';
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
    toast({ title: 'Privacy Sync Complete', description: newPassword ? 'Room frequency locked.' : 'Room frequency unlocked.' });
  };

  const handleSelectTheme = (theme: RoomTheme) => {
    if (theme.isOfficial && !canUseOfficialThemes) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Official themes are restricted to system authorities.' });
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
    toast({ title: 'Theme Synchronized', description: `${theme.name} is now live.` });
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
        <DialogContent className="sm:max-w-[450px] h-[90vh] md:h-auto overflow-hidden bg-white p-0 rounded-t-[3rem] md:rounded-[2.5rem] border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500 font-headline">
          <DialogHeader className="p-6 border-b border-gray-50 flex flex-row items-center justify-between space-y-0 shrink-0">
             <button onClick={() => setOpen(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft className="h-6 w-6 text-gray-600" />
             </button>
             <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Settings</DialogTitle>
             <div className="w-10" />
             <DialogDescription className="sr-only">Manage room identity and privacy frequency.</DialogDescription>
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

                <SettingItem 
                  label="Room Name" 
                  value={room.title || room.name} 
                  onClick={() => {
                    setNewName(room.title || room.name);
                    setIsEditingName(true);
                  }} 
                />

                <SettingItem 
                  label="Announcement" 
                  value={room.announcement} 
                  onClick={() => {
                    setNewAnnouncement(room.announcement || '');
                    setIsEditingAnnouncement(true);
                  }} 
                />

                <SettingItem 
                  label="Number of Mic" 
                  extra={`${room.maxActiveMics || 9} people`} 
                  onClick={() => {
                    const nextMics = (room.maxActiveMics || 9) === 9 ? 13 : 9;
                    handleUpdate('maxActiveMics', nextMics);
                    toast({ title: 'Capacity Adjusted', description: `Room frequency synchronized to ${nextMics} slots.` });
                  }}
                />

                <SettingItem 
                  label="Room Password" 
                  value={room.password ? 'Active' : 'Off'} 
                  onClick={() => {
                    if (!isOwner) {
                      toast({ variant: 'destructive', title: 'Restricted Access', description: 'Only the room owner can manage the privacy code.' });
                      return;
                    }
                    setNewPassword(room.password || '');
                    setIsEditingPassword(true);
                  }}
                />

                <SettingItem label="Room Theme" value={currentTheme.name} onClick={() => setIsEditingTheme(true)} />

                <SettingItem label="Administrators" onClick={() => setIsManagingAdmins(true)} />
             </div>
          </ScrollArea>

          {isEditingPassword && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingPassword(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
                     <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Privacy Code</h3>
                  <button onClick={handleSavePassword} className="text-primary font-black uppercase text-sm tracking-widest px-2">Save</button>
               </header>
               <div className="p-8 space-y-8">
                  <div className="text-center space-y-2 mb-4">
                     <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                     </div>
                     <h4 className="text-xl font-black uppercase italic">Room Password</h4>
                     <p className="text-xs text-muted-foreground font-body italic">Enter a 4-digit code to lock this frequency.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">4-Digit Sync Code (Leave empty to unlock)</Label>
                    <Input 
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="0000"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))} 
                      className="h-20 rounded-[1.5rem] border-2 text-4xl font-black tracking-[1em] text-center focus:border-primary transition-all" 
                      autoFocus 
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex gap-3">
                     <ShieldCheck className="h-5 w-5 text-orange-500 shrink-0" />
                     <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase">
                        When active, only you (the owner) can enter without verification. All others must provide the sync code.
                     </p>
                  </div>
               </div>
            </div>
          )}

          {isEditingTheme && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingTheme(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
                     <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Room Themes</h3>
                  <div className="w-10" />
               </header>
               <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-4 p-6 pb-20">
                     {filteredThemes.map((theme) => {
                       const isLocked = theme.isOfficial && !canUseOfficialThemes;
                       return (
                         <button 
                           key={theme.id}
                           onClick={() => handleSelectTheme(theme)}
                           className={cn(
                             "relative flex flex-col items-center gap-2 group transition-all",
                             isLocked && "opacity-60 grayscale"
                           )}
                         >
                            <div className={cn(
                              "relative aspect-square w-full rounded-2xl overflow-hidden border-4 transition-all",
                              room.roomThemeId === theme.id ? "border-primary scale-105 shadow-lg" : "border-transparent group-hover:border-gray-100"
                            )}>
                               <Image src={theme.url} alt={theme.name} fill className="object-cover" sizes="200px" unoptimized />
                               {isLocked && (
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Lock className="h-8 w-8 text-white/80" />
                                 </div>
                               )}
                               {room.roomThemeId === theme.id && (
                                 <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-md">
                                    <Check className="h-3 w-3 text-white" />
                                 </div>
                               )}
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tight text-center px-1",
                              room.roomThemeId === theme.id ? "text-primary" : "text-gray-500"
                            )}>{theme.name}</span>
                         </button>
                       );
                     })}
                  </div>
               </ScrollArea>
            </div>
          )}

          {isEditingName && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingName(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
                     <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Edit Room Name</h3>
                  <button onClick={handleSaveName} className="text-primary font-black uppercase text-sm tracking-widest px-2">Save</button>
               </header>
               <div className="p-8">
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="h-16 rounded-2xl border-2 text-xl font-black italic focus:border-primary transition-all" 
                    autoFocus 
                  />
               </div>
            </div>
          )}

          {isEditingAnnouncement && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingAnnouncement(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
                     <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Edit Announcement</h3>
                  <button onClick={handleSaveAnnouncement} className="text-primary font-black uppercase text-sm tracking-widest px-2">Save</button>
               </header>
               <div className="p-8">
                  <Textarea 
                    value={newAnnouncement} 
                    onChange={(e) => setNewAnnouncement(e.target.value)} 
                    className="h-40 rounded-2xl border-2 text-lg font-body italic focus:border-primary transition-all p-6" 
                    placeholder="Broadcast your vibe..."
                    autoFocus 
                  />
               </div>
            </div>
          )}

          {isManagingAdmins && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsManagingAdmins(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all">
                     <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Assign Administrators</h3>
                  <div className="w-10" />
               </header>
               <ScrollArea className="flex-1 p-4">
                  {participants?.map((p: any) => (
                    <div key={p.uid} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all border-b border-gray-50 last:border-0">
                       <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
                             <AvatarImage src={p.avatarUrl || undefined} />
                             <AvatarFallback className="bg-slate-100">U</AvatarFallback>
                          </Avatar>
                          <div>
                             <div className="flex items-center gap-2">
                               <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                               {p.uid === room.ownerId && <Badge className="bg-yellow-500 text-black text-[8px] font-black h-4">OWNER</Badge>}
                             </div>
                             <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Identity: {p.uid.slice(0, 8)}</p>
                          </div>
                       </div>
                       {p.uid !== room.ownerId && (
                         <Switch 
                           checked={room.moderatorIds?.includes(p.uid)} 
                           onCheckedChange={() => handleToggleMod(p.uid)}
                         />
                       )}
                    </div>
                  ))}
               </ScrollArea>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileChange(e)} 
            className="hidden" 
            accept="image/*" 
          />
        </DialogContent>
      </Dialog>

      <ImageCropDialog 
        image={cropImage} 
        open={isCropOpen} 
        onOpenChange={setIsCropOpen} 
        onCropComplete={handleCropComplete} 
        aspect={4/5} 
      />
    </>
  );
}
