'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore, useStorage } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  Sparkles,
  Save
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
  
  const globalBgInputRef = useRef<HTMLInputElement>(null);
  const badgeInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const videoInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const imageUrlInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
  const [uploadingBg, setUploadingBg] = useState<Record<number, boolean>>({});
  const [uploadingImage, setUploadingImage] = useState<Record<number, boolean>>({});

  // Load settings from Firestore once on mount to prevent real-time overwrite while editing
  useEffect(() => {
    if (!firestore) return;
    
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const docRef = doc(firestore, 'settings', 'svipConfig');
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setConfig({
            bgType: data.bgType || 'dynamic',
            bgUrl: data.bgUrl || '',
            levels: data.levels || {}
          });
        }
      } catch (err) {
        console.error("Error loading SVIP Config:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [firestore]);

  // Handle uploading global background image/video (local cache only)
  const handleGlobalBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !firestore) return;

    setUploadingGlobalBg(true);
    try {
      const storagePath = `settings/vip_bg_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      setConfig((prev: any) => ({ ...prev, bgUrl: downloadURL }));

      toast({
        title: 'Background Media Uploaded (Unsaved)',
        description: 'Click "Save VIP Settings" at the bottom to publish this change live!'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || 'Failed to upload background'
      });
    } finally {
      setUploadingGlobalBg(false);
    }
  };

  // Handle Level assets upload (local cache only)
  const handleLevelAssetUpload = async (level: number, type: 'badge' | 'video' | 'bg' | 'imageUrl', file: File) => {
    if (!storage || !firestore) return;

    if (type === 'badge') {
      setUploadingBadge(prev => ({ ...prev, [level]: true }));
    } else if (type === 'video') {
      setUploadingVideo(prev => ({ ...prev, [level]: true }));
    } else if (type === 'bg') {
      setUploadingBg(prev => ({ ...prev, [level]: true }));
    } else if (type === 'imageUrl') {
      setUploadingImage(prev => ({ ...prev, [level]: true }));
    }

    try {
      const storagePath = `settings/svip_level_${level}_${type}_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      setConfig((prev: any) => {
        const levels = { ...prev.levels };
        levels[level] = {
          ...levels[level],
          [`${type}Url`]: downloadURL
        };
        return { ...prev, levels };
      });

      toast({
        title: `${type === 'badge' ? 'Badge icon' : type === 'video' ? 'Animation video' : type === 'imageUrl' ? 'Level image URL' : 'Level background'} uploaded (Unsaved)`,
        description: `Successfully loaded for SVIP ${level}! Click "Save VIP Settings" to make it live.`
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || 'Failed to upload file'
      });
    } finally {
      if (type === 'badge') {
        setUploadingBadge(prev => ({ ...prev, [level]: false }));
      } else if (type === 'video') {
        setUploadingVideo(prev => ({ ...prev, [level]: false }));
      } else if (type === 'bg') {
        setUploadingBg(prev => ({ ...prev, [level]: false }));
      } else if (type === 'imageUrl') {
        setUploadingImage(prev => ({ ...prev, [level]: false }));
      }
    }
  };

  // Handle saving background type (local cache only)
  const handleBgTypeChange = (value: string) => {
    setConfig((prev: any) => ({ ...prev, bgType: value }));
    toast({
      title: 'Theme Switched (Unsaved)',
      description: `Background theme switched to ${value}. Click "Save VIP Settings" to save changes!`
    });
  };

  // Save changes to Firestore
  const handleSaveVipConfig = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'settings', 'svipConfig');
      await setDoc(docRef, config, { merge: true });
      toast({
        title: 'VIP Settings Saved',
        description: 'All VIP page custom themes, badges, and animations are now live!'
      });
    } catch (err: any) {
      console.error("VIP Save error: ", err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'Firestore write permission denied!'
      });
    } finally {
      setIsSaving(false);
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
          Configure the 18-level SVIP Club experience. Upload custom badge graphics, 3D animated video loops, level images, and override page background themes.
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
                  <div className="relative flex-1 h-12">
                    <input 
                      type="file" 
                      accept={config.bgType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleGlobalBgUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      disabled={uploadingGlobalBg}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={uploadingGlobalBg}
                      className="h-12 w-full rounded-2xl border border-dashed border-slate-300 hover:border-primary bg-white inline-flex items-center justify-center text-sm font-semibold text-slate-600 transition-colors shadow-sm pointer-events-none"
                    >
                      {uploadingGlobalBg ? (
                        <Loader className="h-5 w-5 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 text-slate-400" />
                          {config.bgUrl ? 'Update Media' : 'Upload File'}
                        </>
                      )}
                    </Button>
                  </div>
                  {config.bgUrl && (
                    <div className="h-12 w-12 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-inner relative group flex items-center justify-center">
                      {config.bgType === 'image' ? (
                        <img src={config.bgUrl} className="h-full w-full object-cover" alt="Background" />
                      ) : (
                        <video src={config.bgUrl} className="h-full w-full object-cover" muted autoPlay loop />
                      )}
                      {/* Clear indicator */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        onClick={() => {
                          setConfig((prev: any) => ({ ...prev, bgUrl: '' }));
                          toast({ title: 'Global background cleared locally (Unsaved)' });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </div>
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
              const isBgUploading = !!uploadingBg[level];
              const isImageUploading = !!uploadingImage[level];

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
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    {/* Badge Image Upload */}
                    <div className="space-y-1">
                      <Label htmlFor={`badge-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Badge Icon</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 h-10">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLevelAssetUpload(level, 'badge', file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            disabled={isBadgeUploading}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            disabled={isBadgeUploading}
                            className="h-10 w-full rounded-xl border border-slate-200 hover:border-yellow-400 bg-white inline-flex items-center justify-center text-xs font-bold text-slate-600 transition-colors shadow-sm pointer-events-none"
                          >
                            {isBadgeUploading ? (
                              <Loader className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {lvlConfig.badgeUrl ? 'Replace' : 'Upload'}
                              </>
                            )}
                          </Button>
                        </div>
                        {lvlConfig.badgeUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 p-1 shrink-0 flex items-center justify-center shadow-inner relative group">
                            <img src={lvlConfig.badgeUrl} className="h-full w-full object-contain" alt={`Badge ${level}`} />
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={() => {
                                setConfig((prev: any) => {
                                  const levels = { ...prev.levels };
                                  if (levels[level]) {
                                    const updatedLevel = { ...levels[level] };
                                    delete updatedLevel.badgeUrl;
                                    levels[level] = updatedLevel;
                                  }
                                  return { ...prev, levels };
                                });
                                toast({ title: 'Badge cleared locally (Unsaved)' });
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
                      <Label htmlFor={`video-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Animation Video</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 h-10">
                          <input 
                            type="file" 
                            accept="video/mp4,video/x-m4v,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLevelAssetUpload(level, 'video', file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            disabled={isVideoUploading}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            disabled={isVideoUploading}
                            className="h-10 w-full rounded-xl border border-slate-200 hover:border-yellow-400 bg-white inline-flex items-center justify-center text-xs font-bold text-slate-600 transition-colors shadow-sm pointer-events-none"
                          >
                            {isVideoUploading ? (
                              <Loader className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {lvlConfig.videoUrl ? 'Replace' : 'Upload'}
                              </>
                            )}
                          </Button>
                        </div>
                        {lvlConfig.videoUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shrink-0 shadow-inner relative group">
                            <video src={lvlConfig.videoUrl} className="h-full w-full object-cover" muted autoPlay loop />
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={() => {
                                setConfig((prev: any) => {
                                  const levels = { ...prev.levels };
                                  if (levels[level]) {
                                    const updatedLevel = { ...levels[level] };
                                    delete updatedLevel.videoUrl;
                                    levels[level] = updatedLevel;
                                  }
                                  return { ...prev, levels };
                                });
                                toast({ title: 'Video cleared locally (Unsaved)' });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Level Image URL Upload */}
                    <div className="space-y-1">
                      <Label htmlFor={`image-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Level Image</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 h-10">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLevelAssetUpload(level, 'imageUrl', file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            disabled={isImageUploading}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            disabled={isImageUploading}
                            className="h-10 w-full rounded-xl border border-slate-200 hover:border-yellow-400 bg-white inline-flex items-center justify-center text-xs font-bold text-slate-600 transition-colors shadow-sm pointer-events-none"
                          >
                            {isImageUploading ? (
                              <Loader className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {lvlConfig.imageUrlUrl ? 'Replace' : 'Upload'}
                              </>
                            )}
                          </Button>
                        </div>
                        {lvlConfig.imageUrlUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 p-1 shrink-0 flex items-center justify-center shadow-inner relative group">
                            <img src={lvlConfig.imageUrlUrl} className="h-full w-full object-cover" alt={`Image ${level}`} />
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={() => {
                                setConfig((prev: any) => {
                                  const levels = { ...prev.levels };
                                  if (levels[level]) {
                                    const updatedLevel = { ...levels[level] };
                                    delete updatedLevel.imageUrlUrl;
                                    levels[level] = updatedLevel;
                                  }
                                  return { ...prev, levels };
                                });
                                toast({ title: 'Level image cleared locally (Unsaved)' });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Background Upload */}
                    <div className="space-y-1">
                      <Label htmlFor={`bg-file-${level}`} className="text-[8px] font-black uppercase text-slate-400 ml-1">Background</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 h-10">
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLevelAssetUpload(level, 'bg', file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            disabled={isBgUploading}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            disabled={isBgUploading}
                            className="h-10 w-full rounded-xl border border-slate-200 hover:border-yellow-400 bg-white inline-flex items-center justify-center text-xs font-bold text-slate-600 transition-colors shadow-sm pointer-events-none"
                          >
                            {isBgUploading ? (
                              <Loader className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {lvlConfig.bgUrl ? 'Replace' : 'Upload'}
                              </>
                            )}
                          </Button>
                        </div>
                        {lvlConfig.bgUrl && (
                          <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shrink-0 shadow-inner relative group flex items-center justify-center">
                            {lvlConfig.bgUrl.includes('.mp4') || lvlConfig.bgUrl.includes('video') ? (
                              <video src={lvlConfig.bgUrl} className="h-full w-full object-cover" muted autoPlay loop />
                            ) : (
                              <img src={lvlConfig.bgUrl} className="h-full w-full object-cover" alt={`Bg ${level}`} />
                            )}
                            {/* Clear indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              onClick={() => {
                                setConfig((prev: any) => {
                                  const levels = { ...prev.levels };
                                  if (levels[level]) {
                                    const updatedLevel = { ...levels[level] };
                                    delete updatedLevel.bgUrl;
                                    levels[level] = updatedLevel;
                                  }
                                  return { ...prev, levels };
                                });
                                toast({ title: 'Background cleared locally (Unsaved)' });
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

        {/* SAVE BUTTON */}
        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <Button
            onClick={handleSaveVipConfig}
            disabled={isSaving}
            className="h-16 px-8 rounded-2xl bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase text-base shadow-xl shadow-yellow-600/10 active:scale-95 transition-all flex items-center gap-3"
          >
            {isSaving ? (
              <>
                <Loader className="animate-spin h-5 w-5" />
                <span>Saving VIP Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save VIP Settings</span>
              </>
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
