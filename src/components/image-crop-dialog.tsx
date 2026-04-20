'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader, Check, X } from 'lucide-react';

interface ImageCropDialogProps {
 image: string | null;
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onCropComplete: (croppedImage: File) => void;
 aspect?: number;
}

/**
 * High-Fidelity Precision Cropping Dimension.
 * Optimized for high-speed uploads by utilizing a 0.8 quality compression signature.
 */
export function ImageCropDialog({ image, open, onOpenChange, onCropComplete, aspect = 4 / 5 }: ImageCropDialogProps) {
 const [crop, setCrop] = useState({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(1);
 const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
 const [isProcessing, setIsProcessing] = useState(false);

 const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
  setCroppedAreaPixels(croppedAreaPixels);
 }, []);

 const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
   const img = new Image();
   img.addEventListener('load', () => resolve(img));
   img.addEventListener('error', (err) => {
    console.error('[Visual Sync] Image Load Error:', err);
    reject(new Error('Failed to load visual frequency for cropping.'));
   });
   
   if (!url.startsWith('blob:')) {
    img.setAttribute('crossOrigin', 'anonymous');
   }
   
   img.src = url;
  });

 const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File | null> => {
  if (!pixelCrop || pixelCrop.width === 0 || pixelCrop.height === 0) {
   throw new Error('Invalid visual dimensions selected for sync.');
  }

  const imageElement = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
   imageElement,
   pixelCrop.x,
   pixelCrop.y,
   pixelCrop.width,
   pixelCrop.height,
   0,
   0,
   pixelCrop.width,
   pixelCrop.height
  );

  return new Promise((resolve) => {
   // QUALITY OPTIMIZATION: 0.8 provides elite mobile fidelity with significantly reduced upload time.
   canvas.toBlob((blob) => {
    if (!blob) return resolve(null);
    const file = new File([blob], `sync_${Date.now()}.jpg`, { type: 'image/jpeg' });
    resolve(file);
   }, 'image/jpeg', 0.8);
  });
 };

 const handleConfirm = async () => {
  if (!image || !croppedAreaPixels) return;
  setIsProcessing(true);
  try {
   const croppedFile = await getCroppedImg(image, croppedAreaPixels);
   if (croppedFile) {
    onCropComplete(croppedFile);
    onOpenChange(false);
   }
  } catch (e: any) {
   console.error('[Visual Sync] Crop Error:', e?.message || e);
  } finally {
   setIsProcessing(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={(val) => !isProcessing && onOpenChange(val)}>
   <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-t-[2.5rem] md:rounded-3xl bg-white text-black border-none shadow-2xl font-sans z-[10001]">
    <DialogHeader className="pt-6 pb-2 border-none">
     <DialogTitle className="text-xl font-black uppercase tracking-tighter text-center">Adjust Visual Vibe</DialogTitle>
    </DialogHeader>
    
    <div className="relative h-[240px] w-full bg-slate-50">
     {image && (
      <Cropper
       image={image}
       crop={crop}
       zoom={zoom}
       aspect={aspect}
       onCropChange={setCrop}
       onCropComplete={onCropCompleteInternal}
       onZoomChange={setZoom}
      />
     )}
    </div>

    <div className="px-6 py-4 space-y-4 bg-white">
     <div className="space-y-1">
      <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
       <span>Zoom Sync</span>
       <span>{Math.round(zoom * 100)}%</span>
      </div>
      <Slider
       value={[zoom]}
       min={1}
       max={3}
       step={0.1}
       onValueChange={(vals) => setZoom(vals[0])}
       className="py-1 mt-0.5"
      />
     </div>
 
     <div className="flex gap-4 pt-2">
      <Button 
       variant="ghost" 
       onClick={() => onOpenChange(false)} 
       disabled={isProcessing}
       className="flex-1 h-11 rounded-xl font-bold uppercase text-[9px] bg-slate-100 text-slate-500"
      >
       <X className="mr-2 h-3 w-3" /> Cancel
      </Button>
      <Button 
       onClick={handleConfirm} 
       disabled={isProcessing}
       className="flex-1 h-11 rounded-xl font-black uppercase text-[9px] shadow-lg shadow-primary/20 bg-primary text-white"
      >
       {isProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
       Save Changes
      </Button>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
