'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCcw, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  title?: string;
}

/**
 * High-Fidelity Camera Capture Dimension.
 * Handles hardware stream synchronization and visual capture for tribal identity.
 */
export function CameraCaptureDialog({ open, onOpenChange, onCapture, title = "Capture Vibe" }: CameraCaptureDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [open, capturedImage]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure canvas matches video aspect ratio for high-fidelity capture
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // High-quality JPEG snapshot
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = async () => {
    if (capturedImage) {
      try {
        // Robust Data URL to Blob conversion for tribal storage
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        
        onCapture(file);
        handleClose();
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Capture Failed',
          description: 'Could not process the visual vibe. Please try again.',
        });
      }
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    stopCamera();
    onOpenChange(false);
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] md:rounded-[2.5rem] bg-white text-black p-0 overflow-hidden font-headline border-none shadow-2xl">
        <DialogHeader className="p-6 border-b border-gray-50">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-black shadow-inner border-4 border-gray-100">
            <video 
              ref={videoRef} 
              className={cn("w-full h-full object-cover", capturedImage ? "hidden" : "block")}
              autoPlay 
              muted 
              playsInline
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover animate-in fade-in duration-300" />
            )}
            
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-gray-900">
                <Alert variant="destructive" className="border-none bg-red-500/10 text-red-500">
                  <AlertTitle className="font-black uppercase italic">Access Required</AlertTitle>
                  <AlertDescription className="text-xs font-body italic">
                    Camera permissions are restricted. Check browser settings.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-3">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={retake} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-xs border-2">
                <RefreshCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button onClick={handleConfirm} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-xs bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/20">
                <Check className="mr-2 h-4 w-4" /> Confirm
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-xs border-2">
                Cancel
              </Button>
              <Button 
                onClick={capturePhoto} 
                disabled={hasCameraPermission !== true}
                className="flex-[2] h-14 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/20 bg-primary text-white"
              >
                <Camera className="mr-2 h-6 w-6" /> Take Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
