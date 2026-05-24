'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useStorage, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Crown, 
  Upload, 
  Trash2, 
  Loader, 
  Check, 
  FileText, 
  Video, 
  Image as ImageIcon,
  Palette,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function VipManagementTab() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    bgType: 'dynamic', // 'dynamic' | 'image' | 'video'
    bgUrl: '',
    levels: {}
  });

  // Upload progress states
  const [uploadingGlobalBg, setUploadingGlobalBg] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState<Record<number, boolean>>({});
  const [uploadingVideo, setUploadingVideo] = useState<Record<number, boolean>>({});

  // Sync settings from Firestore in real time
  useEffect(() => {
    if (!firestore) return;
    const docRef = doc(firestore, 'settings', 'svipConfig');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          bgType: data.bgType || 'dynamic',
          bgUrl: data.bgUrl || '',
          levels: data.levels || {}
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  // Handle uploading global background image/video
  const handleGlobalBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !firestore) return;

    setUploadingGlobalBg(true);
    try {
      const storagePath = `settings/vip_bg_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      const newConfig = { ...config, bgUrl: downloadURL };
      setConfig(newConfig);

      const docRef = doc(firestore, 'settings', 'svipConfig');
      await setDocumentNonBlocking(docRef, newConfig, { merge: true });

      toast({
        title: 'Background Uploaded',
        description: 'New VIP page background is now configured.'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message
      });
    } finally {
      setUploadingGlobalBg(false);
    }
  };

  // Handle Level assets upload
  const handleLevelAssetUpload = async (level: number, type: 'badge' | 'video', file: File) => {
    if (!storage || !firestore) return;

    if (type === 'badge') {
      setUploadingBadge(prev => ({ ...prev, [level]: true }));
    } else {
      setUploadingVideo(prev => ({ ...prev, [level]: true }));
    }

    try {
      const storagePath = `settings/svip_level_${level}_${type}_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      const levels = { ...config.levels };
      levels[level] = {
        ...levels[level],
        [`${type}Url`]: downloadURL
      };

      const newConfig = { ...config, levels };
      setConfig(newConfig);

      const docRef = doc(firestore, 'settings', 'svipConfig');
      await setDocumentNonBlocking(docRef, newConfig, { merge: true });

      toast({
        title: `${type === 'badge' ? 'Badge image' : 'Animation video'} uploaded`,
        description: `Successfully configured for SVIP ${level}!`
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message
      });
    } finally {
      if (type === 'badge') {
        setUploadingBadge(prev => ({ ...prev, [level]: false }));
      } else {
        setUploadingVideo(prev => ({ ...prev, [level]: false }));
      }
    }
  };

  // Handle saving background type
  const handleBgTypeChange = async (value: string) => {
    if (!firestore) return;
    const newConfig = { ...config, bgType: value };
    setConfig(newConfig);

    try {
      const docRef = doc(firestore, 'settings', 'svipConfig');
      await setDocumentNonBlocking(docRef, newConfig, { merge: true });
      toast({
        title: 'Branding Saved',
        description: `Background theme changed to ${value}!`
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl uppercase flex items-center gap-2 text-yellow-600">
          <Crown className="h-6 w-6 text-yellow-500 fill-current animate-pulse" />
          VIP Management
        </CardTitle>
        <CardDescription>
          Configure the 18-level SVIP Club experience. Upload custom badge graphics, 3D animated video loops, and override page background themes.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 space-y-8">
        
        {/* GLOBAL VIP PAGE THEMING CONFIG */}
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
            <Palette className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Global VIP Branding</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BG Type Select */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Background Theme Type</Label>
              <Select value={config.bgType} onValueChange={handleBgTypeChange}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-xl rounded-2xl">
                  <SelectItem value="dynamic" className="font-bold">Dynamic Cosmic Space (Animated)</SelectItem>
                  <SelectItem value="image" className="font-bold">Custom Image Background</SelectItem>
                  <SelectItem value="video" className="font-bold">Custom Video Background (MP4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom file upload for BG */}
            {config.bgType !== 'dynamic' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  {config.bgType === 'image' ? 'Upload Background Image' : 'Upload Background Video'}
                </Label>
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    id="global-vip-bg-file"
                    accept={config.bgType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleGlobalBgUpload}
                    className="hidden"
                  />
                  <label 
                    htmlFor="global-vip-bg-file"
                    className="h-12 rounded-2xl border border-dashed border-slate-300 hover:border-primary bg-white flex-1 inline-flex items-center justify-center text-sm font-semibold text-slate-600 cursor-pointer transition-colors shadow-sm"
                  >
                    {uploadingGlobalBg ? (
                      <Loader className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="h-4.5 w-4.5 mr-2 text-slate-400" />
                        {config.bgUrl ? 'Update Media' : 'Upload File'}
                      </>
                    )}
                  </label>
                  {config.bgUrl && (
                    <div className="h-12 w-12 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                      {config.bgType === 'image' ? (
                        <img src={config.bgUrl} className="h-full w-full object-cover" alt="Background" />
                      ) : (
                        <video src={config.bgUrl} className="h-full w-full object-cover" muted autoPlay loop />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 18-LEVEL MANAGEMENT ROW */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Level Asset Synchronizers</h3>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 18 }).map((_, index) => {
              const level = index + 1;
              const lvlConfig = config.levels[level] || {};
              const isBadgeUploading = !!uploadingBadge[level];
              const isVideoUploading = !!uploadingVideo[level];

              return (
                <div 
                  key={level} 
                  className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {/* Level details */}
                  <div className="flex items-center gap-4 min-w-[120px]">
                    <div className="h-12 w-12 bg-yellow-50 rounded-2xl flex items-center justify-center border border-yellow-100 shadow-sm shrink-0">
                      <span className="text-sm font-black text-yellow-600">Lv.{level}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">SVIP {level}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Configurations</p>
                    </div>
                  </div>

                  {/* Upload Columns */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Badge Image Upload */}
                    <div className="space-y-1">
                      <Label htmlFor={`badge-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Badge Icon (.png/.jpg)</Label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          id={`badge-file-${level}`}
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLevelAssetUpload(level, 'badge', file);
                          }}
                          className="hidden"
                        />
                        <label 
                          htmlFor={`badge-file-${level}`}
                          className="h-10 rounded-xl border border-slate-200 hover:border-yellow-400 bg-white flex-1 inline-flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer transition-colors shadow-sm"
                        >
                          {isBadgeUploading ? (
                            <Loader className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                              {lvlConfig.badgeUrl ? 'Replace' : 'Upload'}
                            </>
                          )}
                        </label>
                        {lvlConfig.badgeUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 p-1 shrink-0 flex items-center justify-center shadow-inner relative group">
                            <img src={lvlConfig.badgeUrl} className="h-full w-full object-contain" alt={`Badge ${level}`} />
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={async () => {
                                const levels = { ...config.levels };
                                delete levels[level].badgeUrl;
                                const newConfig = { ...config, levels };
                                setConfig(newConfig);
                                await setDocumentNonBlocking(doc(firestore!, 'settings', 'svipConfig'), newConfig, { merge: true });
                                toast({ title: 'Badge cleared' });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animation Video Upload */}
                    <div className="space-y-1">
                      <Label htmlFor={`video-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Podium Animation Video (.mp4)</Label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          id={`video-file-${level}`}
                          accept="video/mp4,video/x-m4v,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLevelAssetUpload(level, 'video', file);
                          }}
                          className="hidden"
                        />
                        <label 
                          htmlFor={`video-file-${level}`}
                          className="h-10 rounded-xl border border-slate-200 hover:border-yellow-400 bg-white flex-1 inline-flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer transition-colors shadow-sm"
                        >
                          {isVideoUploading ? (
                            <Loader className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                              {lvlConfig.videoUrl ? 'Replace' : 'Upload'}
                            </>
                          )}
                        </label>
                        {lvlConfig.videoUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shrink-0 shadow-inner relative group">
                            <video src={lvlConfig.videoUrl} className="h-full w-full object-cover" muted autoPlay loop />
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={async () => {
                                const levels = { ...config.levels };
                                delete levels[level].videoUrl;
                                const newConfig = { ...config, levels };
                                setConfig(newConfig);
                                await setDocumentNonBlocking(doc(firestore!, 'settings', 'svipConfig'), newConfig, { merge: true });
                                toast({ title: 'Video cleared' });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
