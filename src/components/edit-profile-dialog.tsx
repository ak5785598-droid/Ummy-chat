'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Pencil, Loader, Camera, Globe, User2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';

interface EditProfileDialogProps {
  profile: any;
}

/**
 * Unified Identity Synchronization Dialog.
 * Hardened to ensure name and bio changes reflect on global leaderboards instantly.
 */
export function EditProfileDialog({ profile }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile && open) {
      setName(profile.username || profile.name || '');
      setBio(profile.bio || '');
    }
  }, [profile, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);
    
    // Identity Sync Logic: Root Document + Detailed Profile
    const userSummaryRef = doc(firestore, 'users', user.uid);
    const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    
    const updateData = {
      username: name,
      bio: bio,
      updatedAt: serverTimestamp()
    };

    try {
      // Sync to leaderboard source
      updateDocumentNonBlocking(userSummaryRef, {
        username: name,
        updatedAt: serverTimestamp()
      });

      // Sync to detailed profile
      updateDocumentNonBlocking(userProfileRef, updateData);

      toast({
        title: 'Identity Synced!',
        description: 'Your new persona is now live across the frequency.',
      });
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Sync Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit is 5MB." });
        return;
      }
      uploadProfilePicture(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 text-white h-10 w-10 shadow-xl backdrop-blur-md">
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSave}>
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Modify Persona</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              Changes are reflected on the global rankings instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                  <AvatarImage src={profile?.avatarUrl} alt={name} />
                  <AvatarFallback className="text-4xl font-black">{(name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                >
                  {isUploading ? <Loader className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Tap photo to change DP</span>
            </div>

            <div className="space-y-4">
               <div className="grid gap-2">
                 <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tribe Display Name</Label>
                 <Input
                   id="edit-name"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   required
                   disabled={isSubmitting}
                   placeholder="Enter your name"
                   className="rounded-2xl h-14 text-lg border-2 focus:border-primary transition-all"
                 />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="edit-bio" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Personality Signature (Bio)</Label>
                 <Textarea
                   id="edit-bio"
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                   placeholder="Tell your tribe about yourself..."
                   className="resize-none h-28 rounded-2xl border-2 focus:border-primary transition-all"
                   disabled={isSubmitting}
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 opacity-50">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-gray-400 ml-1">
                  <Globe className="h-3 w-3" /> Region
                </Label>
                <Input value={profile?.details?.hometown || 'India'} disabled className="bg-secondary/50 h-10 text-xs rounded-xl cursor-not-allowed border-none" />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-gray-400 ml-1">
                  <User2 className="h-3 w-3" /> Gender
                </Label>
                <Input value={profile?.details?.gender || 'Secret'} disabled className="bg-secondary/50 h-10 text-xs rounded-xl cursor-not-allowed border-none" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : null}
              Commit Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </Dialog>
  );
}
