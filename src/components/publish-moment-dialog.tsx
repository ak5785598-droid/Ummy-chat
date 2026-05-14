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
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

export interface PublishMomentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishMomentDialog({ open, onOpenChange }: PublishMomentDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (file) {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024; // 15MB for video, 5MB for image
    
    if (file.size > maxSize) {
     toast({ 
       variant: 'destructive', 
       title: 'File Too Large', 
       description: `Limit is ${isVideo ? '15MB' : '5MB'} for ${isVideo ? 'reels' : 'visual vibes'}.` 
     });
     return;
    }
    
    setSelectedFile(file);
    setFileType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
   }
  };

  const handlePublish = async () => {
   if (!user || !firestore || !content.trim()) return;
   setIsSubmitting(true);

   try {
    let mediaUrl = '';
    if (selectedFile && storage) {
     const timestamp = Date.now();
     const folder = fileType === 'video' ? 'videos' : 'images';
     const storagePath = `moments/${user.uid}/${folder}/${timestamp}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
     const sRef = ref(storage, storagePath);
     const result = await uploadBytes(sRef, selectedFile);
     mediaUrl = await getDownloadURL(result.ref);
    }

    const momentRef = collection(firestore, 'moments');
    await addDoc(momentRef, {
     userId: user.uid,
     username: userProfile?.username || 'Tribe Member',
     avatarUrl: userProfile?.avatarUrl || '',
     userLevel: userProfile?.level?.rich || 1,
     userCountry: userProfile?.country || 'IN',
     content: content.trim(),
     [fileType === 'video' ? 'videoUrl' : 'imageUrl']: mediaUrl,
     type: fileType || 'image',
     likes: 0,
     views: 0,
     commentsCount: 0,
     createdAt: serverTimestamp()
    });

    toast({ title: 'Moment Broadcasted', description: 'Your vibe is now live on the social galaxy.' });
    onOpenChange(false);
    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);

   } catch (e: any) {
    console.error("Publish Error:", e);
    toast({ variant: 'destructive', title: 'Publish Failed', description: e.message || 'Could not broadcast vibe.' });
   } finally {
    setIsSubmitting(false);
   }
  };

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent hideClose={true} className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto">
      <DialogHeader className="p-6 pb-2">
        <DialogTitle className="text-center font-headline text-xl uppercase tracking-tighter">Share Moment</DialogTitle>
        <DialogDescription className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Broadcast Vibe to Social Galaxy</DialogDescription>
      </DialogHeader>
      
      <div className="p-6 pt-0 space-y-4">
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
          {previewUrl ? (
            <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-2 border-dashed border-purple-500 shadow-xl bg-gray-50">
              {fileType === 'video' ? (
                <video 
                  src={previewUrl} 
                  controls={false} 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              )}
              <button 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileType(null); }}
                className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white backdrop-blur-md z-10"
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
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Add Galaxy Vibe</span>
                <span className="text-[8px] font-bold text-gray-300 mt-1 uppercase">Image or Video (max 15MB)</span>
              </div>
            </button>
          )}
        </div>

        <div className="pt-2">
          <Button 
            onClick={handlePublish} 
            disabled={isSubmitting || !content.trim()} 
            className="w-full h-12 rounded-2xl text-sm font-headline font-black uppercase shadow-lg bg-gradient-to-r from-purple-600 to-pink-500 border-none"
          >
            {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Broadcast {fileType === 'video' ? 'Reel' : 'Post'}
          </Button>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
    </DialogContent>
   </Dialog>
  );
}