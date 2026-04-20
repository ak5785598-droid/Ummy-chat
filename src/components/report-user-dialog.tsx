'use client';

import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Upload, 
  X, 
  Loader, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useStorage, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { serverTimestamp, collection, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const REPORT_REASONS = [
  { id: 'abuse', label: 'Abusive Language / Gali' },
  { id: 'harassment', label: 'Harassment / Bullying' },
  { id: 'spam', label: 'Spam / Advertising' },
  { id: 'fake', label: 'Fake Account / Impersonation' },
  { id: 'other', label: 'Inappropriate Behavior' },
];

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    uid: string;
    username: string;
    accountNumber?: string;
  };
}

export function ReportUserDialog({ open, onOpenChange, targetUser }: ReportUserDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Limit to 3 files max
      if (files.length + selectedFiles.length > 3) {
        toast({
          variant: 'destructive',
          title: 'Limit Exceeded',
          description: 'You can attach up to 3 evidence files.',
        });
        return;
      }
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({ variant: 'destructive', title: 'Reason Required', description: 'Please select a reason for reporting.' });
      return;
    }

    if (!firestore || !storage || !currentUser) return;

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const evidenceUrls: string[] = [];
      const reportId = doc(collection(firestore, 'reports')).id;

      // 1. Upload Evidence Files
      if (files.length > 0) {
        let completed = 0;
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const storageRef = ref(storage, `reports/${reportId}/${fileName}`);
          
          const result = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(result.ref);
          evidenceUrls.push(url);
          
          completed++;
          setUploadProgress(10 + (completed / files.length) * 60); // Use 60% for uploads
        }
      }

      // 2. Create Report in Firestore
      const reportData = {
        id: reportId,
        type: 'user_report',
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || 'Unknown Reporter',
        targetId: targetUser.uid,
        targetName: targetUser.username,
        targetAccount: targetUser.accountNumber || 'N/A',
        reason: REPORT_REASONS.find(r => r.id === reason)?.label || reason,
        description: description.trim(),
        evidenceUrls,
        status: 'pending',
        timestamp: serverTimestamp(),
      };

      setUploadProgress(90);
      await addDocumentNonBlocking(collection(firestore, 'reports'), reportData);

      setUploadProgress(100);
      toast({
        title: 'Report Submitted',
        description: 'Thank you. Our administration will investigate this matter.',
      });
      
      // Cleanup
      setReason('');
      setDescription('');
      setFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('[Safety] Report Failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not send the report. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-[32px] p-6 border-none shadow-2xl font-outfit">
        <DialogHeader className="space-y-2">
          <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Report User</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500">
            Tell us what happened with <span className="text-slate-900 font-bold">@{targetUser.username}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Reason Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Reason</label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-2xl font-medium focus:ring-red-500/20">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-xl z-[200]">
                {REPORT_REASONS.map(r => (
                  <SelectItem key={r.id} value={r.id} className="font-medium focus:bg-slate-50 rounded-xl m-1 cursor-pointer">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Details (Optional)</label>
            <Textarea 
              placeholder="Describe the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] bg-slate-50 border-slate-100 rounded-2xl font-medium resize-none focus-visible:ring-red-500/20"
            />
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Evidence (Proof)</label>
            <div className="grid grid-cols-4 gap-2">
              {files.map((file, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-xl relative group overflow-hidden border border-slate-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform">
                    {file.type.startsWith('image/') ? <ImageIcon className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 h-5 w-5 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {/* Local Preview for Images */}
                  {file.type.startsWith('image/') && (
                    <img 
                      src={URL.createObjectURL(file)} 
                      className="absolute inset-0 w-full h-full object-cover"
                      alt=""
                    />
                  )}
                </div>
              ))}
              
              {files.length < 3 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-slate-400 hover:border-red-200 hover:text-red-400"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[8px] font-black uppercase">Attach</span>
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleFileSelect}
            />
            <p className="text-[9px] text-slate-400 font-medium pl-1">Max 3 photos/videos. Admin will verify proof.</p>
          </div>

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl",
              "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
              isSubmitting && "opacity-80"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
