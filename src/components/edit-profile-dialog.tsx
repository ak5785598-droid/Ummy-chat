'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
 * Optimized Unified Profile Editing Dialog.
 * Uses non-blocking background updates for maximum speed.
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
    
    // Background sync - UI closes immediately after initiating write
    const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    updateDoc(userProfileRef, {
      username: name,
      bio: bio,
      updatedAt: serverTimestamp()
    }).catch(err => {
      console.warn("Silent background update failed:", err);
    });

    // Close and toast immediately for perceived performance
    setOpen(false);
    setIsSubmitting(false);
    toast({
      title: 'Updating Profile',
      description: 'Changes are being synced to your tribe in the background.',
    });
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
        <Button variant="outline" size="icon" className="rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary h-10 w-10 shadow-lg">
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your Name, Bio, and DP. Identity changes are instant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={profile?.avatarUrl} alt={name} />
                  <AvatarFallback className="text-3xl">{(name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Click photo to change DP</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Enter your real name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                className="resize-none h-24"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 opacity-60">
                <Label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                  <Globe className="h-3 w-3" /> Country (Fixed)
                </Label>
                <Input value={profile?.details?.hometown || 'India'} disabled className="bg-muted cursor-not-allowed h-9 text-xs" />
              </div>
              <div className="grid gap-2 opacity-60">
                <Label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                  <User2 className="h-3 w-3" /> Gender (Fixed)
                </Label>
                <Input value={profile?.details?.gender || 'Secret'} disabled className="bg-muted cursor-not-allowed h-9 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : null}
              Save All Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </Dialog>
  );
}
