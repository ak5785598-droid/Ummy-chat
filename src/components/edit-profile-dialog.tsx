
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Pen, Loader, Camera, Upload } from 'lucide-react';
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
import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { ImageCropDialog } from '@/components/image-crop-dialog';

interface EditProfileDialogProps {
  profile: any;
}

/**
 * Production Persona Editor.
 * Includes High-Fidelity real-time mobile camera and precision cropping dimension.
 */
export function EditProfileDialog({ profile }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

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
    
    const userSummaryRef = doc(firestore, 'users', user.uid);
    const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    
    const updateData = {
      username: name,
      bio: bio,
      updatedAt: serverTimestamp()
    };

    try {
      updateDocumentNonBlocking(userSummaryRef, {
        username: name,
        updatedAt: serverTimestamp()
      });

      updateDocumentNonBlocking(userProfileRef, updateData);
      toast({ title: 'Persona Saved', description: 'Your updates are now live.' });
      setOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    await uploadProfilePicture(croppedFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 text-white h-10 w-10 shadow-xl backdrop-blur-md">
            <Pen className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl font-headline">
          <form onSubmit={handleSave}>
            <DialogHeader className="p-8 pb-0 text-center">
              <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Modify Persona</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                Changes are reflected across the tribal graph instantly.
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                    <AvatarImage key={profile?.avatarUrl} src={profile?.avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="text-4xl font-black bg-slate-50">{(name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
                      <Loader className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm" 
                     onClick={() => fileInputRef.current?.click()}
                     className="rounded-full h-10 px-6 text-[10px] font-black uppercase italic border-2"
                   >
                     <Upload className="h-3 w-3 mr-2" /> Upload
                   </Button>
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm" 
                     onClick={() => setIsCameraOpen(true)}
                     className="rounded-full h-10 px-6 text-[10px] font-black uppercase italic border-2 bg-primary/5 border-primary/20 text-primary"
                   >
                     <Camera className="h-3 w-3 mr-2" /> Camera
                   </Button>
                </div>
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

      <CameraCaptureDialog 
        open={isCameraOpen} 
        onOpenChange={setIsCameraOpen} 
        onCapture={uploadProfilePicture}
        title="Sync Persona Photo"
      />

      <ImageCropDialog 
        image={cropImage} 
        open={isCropOpen} 
        onOpenChange={setIsCropOpen} 
        onCropComplete={handleCropComplete} 
        aspect={1/1} 
      />
    </>
  );
}
