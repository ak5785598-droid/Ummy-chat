'use client';

import { useState, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Loader, 
  Camera,
  Check,
  UserCheck,
  UserX
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
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, query, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRoomImageUpload } from '@/hooks/use-room-image-upload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ImageCropDialog } from '@/components/image-crop-dialog';

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
 * High-Fidelity Room Settings Portal.
 * Designed to mirror the elite tribal settings roster.
 * Includes real-time image cropping, upload sync, and administrator management.
 */
export function RoomSettingsDialog({ room, trigger }: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [newName, setNewName] = useState(room.title || room.name);
  const [newAnnouncement, setNewAnnouncement] = useState(room.announcement || '');
  
  // Precision Visual Sync State
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();
  const { isUploading, uploadRoomImage } = useRoomImageUpload(room.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time participant roster for Admin management
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id]);

  const { data: participants } = useCollection(participantsQuery);

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
             <DialogDescription className="sr-only">Manage room settings and visual identity.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[600px]">
             <div className="pb-10">
                {/* Visual Identity Section */}
                <SettingItem label="Profile" onClick={() => !isUploading && fileInputRef.current?.click()} className="py-8">
                   <div className="relative">
                      <Avatar className="h-16 w-16 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-50">
                         <AvatarImage key={room.coverUrl} src={room.coverUrl} className="object-cover" />
                         <AvatarFallback className="bg-slate-200">{(room.title || 'R').charAt(0)}</AvatarFallback>
                      </Avatar>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm z-50">
                           <Loader className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}
                      {!isUploading && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-gray-100">
                           <Camera className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300 ml-2" />
                </SettingItem>

                {/* Identity Identifier */}
                <SettingItem 
                  label="Room Name" 
                  value={room.title || room.name} 
                  onClick={() => {
                    setNewName(room.title || room.name);
                    setIsEditingName(true);
                  }} 
                />

                {/* Tribal Broadcast */}
                <SettingItem 
                  label="Announcement" 
                  value={room.announcement} 
                  onClick={() => {
                    setNewAnnouncement(room.announcement || '');
                    setIsEditingAnnouncement(true);
                  }} 
                />

                {/* Frequency Capacity */}
                <SettingItem 
                  label="Number of Mic" 
                  extra={`${room.maxActiveMics || 9} people`} 
                  onClick={() => {
                    const nextMics = (room.maxActiveMics || 9) === 9 ? 13 : 9;
                    handleUpdate('maxActiveMics', nextMics);
                    toast({ title: 'Capacity Adjusted', description: `Room frequency synchronized to ${nextMics} slots.` });
                  }}
                />

                {/* Locked Access */}
                <SettingItem label="Room Password" />

                {/* Elite Power Toggle */}
                <SettingItem label="Super Mic" showChevron={false}>
                   <Switch 
                     checked={room.isSuperMic || false} 
                     onCheckedChange={(val) => handleUpdate('isSuperMic', val)} 
                   />
                </SettingItem>

                {/* Visual Dimensions */}
                <SettingItem label="Room Theme" />

                {/* Authority Handshake: Real-time Admin Management */}
                <SettingItem label="Administrators" onClick={() => setIsManagingAdmins(true)} />

                <div className="h-4 bg-gray-50" />

                {/* Governance Rows */}
                <SettingItem label="Blocked List" extra="0" />
                <SettingItem label="Kick History" />
             </div>
          </ScrollArea>

          {/* Real-time Text Edit Overlays */}
          {isEditingName && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingName(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                     <ChevronLeft className="h-6 w-6 text-gray-600" />
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
                  <p className="mt-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center opacity-40 italic">
                    Broadcast a new name to the global tribe.
                  </p>
               </div>
            </div>
          )}

          {isEditingAnnouncement && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsEditingAnnouncement(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                     <ChevronLeft className="h-6 w-6 text-gray-600" />
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
                  <p className="mt-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center opacity-40 italic">
                    Visible to all tribe members upon entry sync.
                  </p>
               </div>
            </div>
          )}

          {/* Real-time Administrator Management Portal */}
          {isManagingAdmins && (
            <div className="absolute inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col font-headline">
               <header className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <button onClick={() => setIsManagingAdmins(false)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                     <ChevronLeft className="h-6 w-6 text-gray-600" />
                  </button>
                  <h3 className="font-black uppercase italic text-lg tracking-tighter">Assign Administrators</h3>
                  <div className="w-10" />
               </header>
               <ScrollArea className="flex-1 p-4">
                  {participants?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all border-b border-gray-50 last:border-0">
                       <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
                             <AvatarImage src={p.avatarUrl} />
                             <AvatarFallback className="bg-slate-100">U</AvatarFallback>
                          </Avatar>
                          <div>
                             <div className="flex items-center gap-2">
                               <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                               {p.uid === room.ownerId && <Badge className="bg-yellow-500 text-black text-[8px] font-black h-4">OWNER</Badge>}
                             </div>
                             <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Identity: {p.id.slice(0, 8)}</p>
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
                  {(!participants || participants.length === 0) && (
                    <div className="py-20 text-center opacity-20 italic">No tribe members detected in frequency.</div>
                  )}
               </ScrollArea>
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </DialogContent>
      </Dialog>

      {/* High-Fidelity Precision Crop Dimension */}
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
