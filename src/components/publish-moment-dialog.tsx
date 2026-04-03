'use client';

import { useState, useRef } from 'react';
import { useFirestore, useUser, useStorage } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Loader, Send, X } from 'lucide-react';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

/**
 * High-Fidelity Moment Publishing Dialog (Controllable).
 */
export interface PublishMomentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishMomentDialog({ open, onOpenChange }: PublishMomentDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (file) {
    if (file.size > 5 * 1024 * 1024) {
     toast({ variant: 'destructive', title: 'File Too Large', description: 'Limit is 5MB for visual vibes.' });
     return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
   }
  };

  const handlePublish = async () => {
   if (!user || !firestore || !content.trim()) return;
   setIsSubmitting(true);

   try {
    let imageUrl = '';
    if (selectedImage && storage) {
     const timestamp = Date.now();
     const storagePath = `moments/${user.uid}/${timestamp}_${selectedImage.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
     const sRef = ref(storage, storagePath);
     const result = await uploadBytes(sRef, selectedImage);
     imageUrl = await getDownloadURL(result.ref);
    }

    const momentRef = collection(firestore, 'moments');
    await addDoc(momentRef, {
     userId: user.uid,
     username: userProfile?.username || 'Tribe Member',
     avatarUrl: userProfile?.avatarUrl || '',
     content: content.trim(),
     imageUrl,
     likes: 0,
     createdAt: serverTimestamp()
    });

    toast({ title: 'Moment Broadcasted', description: 'Your vibe is now live on the social galaxy.' });
    onOpenChange(false);
    setContent('');
    setSelectedImage(null);
    setImagePreview(null);

   } catch (e: any) {
    console.error("Publish Error:", e);
    toast({ variant: 'destructive', title: 'Publish Failed', description: 'Could not broadcast vibe.' });
   } finally {
    setIsSubmitting(false);
   }
  };

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto">
     <DialogHeader className="p-8 pb-4">
      <DialogTitle className="text-center font-headline text-3xl uppercase tracking-tighter">Share Moment</DialogTitle>
      <DialogDescription className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Broadcast Vibe to Social Galaxy</DialogDescription>
     </DialogHeader>
     <div className="p-8 space-y-6">
      <div className="relative group">
       <Textarea 
        placeholder="What's happening in your galaxy?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="resize-none h-32 rounded-3xl border-2 border-gray-100 focus:border-purple-500 transition-all p-4 text-sm font-sans font-medium"
        disabled={isSubmitting}
       />
      </div>

      <div className="flex flex-col items-center justify-center">
       {imagePreview ? (
        <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-2 border-dashed border-purple-500 shadow-xl bg-gray-50">
         <Image src={imagePreview} alt="Preview" fill className="object-cover" />
         <button 
          onClick={() => { setSelectedImage(null); setImagePreview(null); }}
          className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white backdrop-blur-md"
         >
          <X className="h-5 w-5" />
         </button>
        </div>
       ) : (
        <button 
         onClick={() => fileInputRef.current?.click()}
         className="w-full h-32 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-all group"
        >
         <Camera className="h-8 w-8 text-gray-300 group-hover:text-purple-500 transition-colors" />
         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Add Galaxy Vibe</span>
        </button>
       )}
      </div>
     </div>
     <DialogFooter className="p-8 pt-0">
      <Button 
       onClick={handlePublish} 
       disabled={isSubmitting || !content.trim()} 
       className="w-full h-16 rounded-[1.5rem] text-lg font-headline font-black uppercase shadow-xl shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-pink-500 hover:brightness-110 border-none"
      >
       {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
       Broadcast Post
      </Button>
     </DialogFooter>
     <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
    </DialogContent>
   </Dialog>
  );
}