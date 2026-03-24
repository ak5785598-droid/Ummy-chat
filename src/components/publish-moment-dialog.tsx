'use client';

import { useState, useRef } from 'react';
import { useFirestore, useUser, useStorage, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Loader, Send, X, Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

/**
 * High-Fidelity Moment Publishing Dialog.
 * Allows tribe members to broadcast vibes to the social graph.
 */
export function PublishMomentDialog() {
 const [open, setOpen] = useState(false);
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
   addDoc(momentRef, {
    userId: user.uid,
    username: userProfile?.username || 'Tribe Member',
    avatarUrl: userProfile?.avatarUrl || '',
    content: content.trim(),
    imageUrl,
    likes: 0,
    createdAt: serverTimestamp()
   }).then(() => {
    toast({ title: 'Moment Broadcasted', description: 'Your vibe is now live on the social graph.' });
    setOpen(false);
    setContent('');
    setSelectedImage(null);
    setImagePreview(null);
   }).catch(err => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
     path: momentRef.path,
     operation: 'create',
     requestResourceData: { content: content.trim(), imageUrl }
    }));
   });

  } catch (e: any) {
   console.error("Publish Error:", e);
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <button className="bg-primary text-white p-1.5 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white">
     <Camera className="h-5 w-5 text-black" />
    </button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="p-8 pb-4">
     <DialogTitle className="text-center font-sans text-3xl uppercase tracking-tight">Share Vibe</DialogTitle>
     <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Broadcast Moment to Social Graph</DialogDescription>
    </DialogHeader>
    <div className="p-8 space-y-6">
     <div className="relative group">
      <Textarea 
       placeholder="What's your frequency right now?"
       value={content}
       onChange={(e) => setContent(e.target.value)}
       className="resize-none h-24 rounded-xl border-2 border-gray-100 focus:border-primary transition-all p-4 text-sm font-body "
       disabled={isSubmitting}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      </div>
     </div>

     <div className="flex flex-col items-center justify-center">
      {imagePreview ? (
       <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-primary shadow-xl">
        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
        <button 
         onClick={() => { setSelectedImage(null); setImagePreview(null); }}
         className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white backdrop-blur-md"
        >
         <X className="h-4 w-4" />
        </button>
       </div>
      ) : (
       <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-24 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors group"
       >
        <Camera className="h-6 w-6 text-gray-300 group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Add Visual Vibe</span>
       </button>
      )}
     </div>
    </div>
    <DialogFooter className="p-8 pt-0">
     <Button 
      onClick={handlePublish} 
      disabled={isSubmitting || !content.trim()} 
      className="w-full h-16 rounded-xl text-xl font-bold uppercase shadow-xl shadow-primary/20"
     >
      {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
      Publish Moment
     </Button>
    </DialogFooter>
    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
   </DialogContent>
  </Dialog>
 );
}