'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore, useStorage } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Heart, 
  Upload, 
  Trash2, 
  Loader, 
  Palette, 
  Save,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function CpManagementTab() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const cpBgInputRef = useRef<HTMLInputElement>(null);
  const friendBgInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCpBg, setUploadingCpBg] = useState(false);
  const [uploadingFriendBg, setUploadingFriendBg] = useState(false);
  
  const [config, setConfig] = useState<any>({
    cpBgType: 'dynamic', // 'dynamic' | 'image' | 'video'
    cpBgUrl: '',
    cpHeaderTheme: '#FF91B5',
    friendBgType: 'dynamic', // 'dynamic' | 'image' | 'video'
    friendBgUrl: '',
    friendHeaderTheme: '#60a5fa'
  });

  // Load settings from Firestore once on mount
  useEffect(() => {
    if (!firestore) return;
    
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const docRef = doc(firestore, 'appConfig', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setConfig({
            cpBgType: data.cpBgType || 'dynamic',
            cpBgUrl: data.cpBgUrl || '',
            cpHeaderTheme: data.cpHeaderTheme || '#FF91B5',
            friendBgType: data.friendBgType || 'dynamic',
            friendBgUrl: data.friendBgUrl || '',
            friendHeaderTheme: data.friendHeaderTheme || '#60a5fa'
          });
        }
      } catch (err) {
        console.error("Error loading CP/Friend Config:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [firestore]);

  // Handle uploading CP background image/video
  const handleCpBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !firestore) return;

    setUploadingCpBg(true);
    try {
      const storagePath = `settings/cp_bg_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      setConfig((prev: any) => ({ ...prev, cpBgUrl: downloadURL }));

      toast({
        title: 'CP Background Media Loaded (Unsaved)',
        description: 'Click "Save CP Settings" at the bottom to publish this change live!'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || 'Failed to upload background'
      });
    } finally {
      setUploadingCpBg(false);
    }
  };

  // Handle uploading Friend background image/video
  const handleFriendBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !firestore) return;

    setUploadingFriendBg(true);
    try {
      const storagePath = `settings/friend_bg_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      setConfig((prev: any) => ({ ...prev, friendBgUrl: downloadURL }));

      toast({
        title: 'Friend Background Media Loaded (Unsaved)',
        description: 'Click "Save CP Settings" at the bottom to publish this change live!'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || 'Failed to upload background'
      });
    } finally {
      setUploadingFriendBg(false);
    }
  };

  const handleCpBgTypeChange = (value: string) => {
    setConfig((prev: any) => ({ ...prev, cpBgType: value }));
    toast({
      title: 'CP Theme Switched (Unsaved)',
      description: `CP Background type switched to ${value}. Click "Save CP Settings" to save changes!`
    });
  };

  const handleFriendBgTypeChange = (value: string) => {
    setConfig((prev: any) => ({ ...prev, friendBgType: value }));
    toast({
      title: 'Friend Theme Switched (Unsaved)',
      description: `Friend Background type switched to ${value}. Click "Save CP Settings" to save changes!`
    });
  };

  const handleCpThemeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev: any) => ({ ...prev, cpHeaderTheme: e.target.value }));
  };

  const handleFriendThemeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev: any) => ({ ...prev, friendHeaderTheme: e.target.value }));
  };

  // Save changes to Firestore appConfig/global
  const handleSaveCpConfig = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'appConfig', 'global');
      await updateDoc(docRef, {
        cpBgType: config.cpBgType,
        cpBgUrl: config.cpBgUrl,
        cpHeaderTheme: config.cpHeaderTheme,
        friendBgType: config.friendBgType,
        friendBgUrl: config.friendBgUrl,
        friendHeaderTheme: config.friendHeaderTheme,
        updatedAt: new Date()
      });
      toast({
        title: 'CP & Friend Settings Saved! 💖',
        description: 'CP House background configurations are now live!'
      });
    } catch (err: any) {
      console.error("CP/Friend Save error: ", err);
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
        <CardTitle className="text-2xl uppercase flex items-center gap-2 text-pink-600">
          <Heart className="h-6 w-6 text-pink-500 fill-current animate-pulse" />
          CP / Friend Background Management
        </CardTitle>
        <CardDescription>
          Configure backgrounds, upload custom background images or video loops, and set fallback gradient colors for both the CP and Friend sub-tabs inside CP House.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 space-y-8">
        
        {/* CP SUB-TAB THEMING CONFIG */}
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">CP Tab Branding Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CP BG Type Select */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Background Type</Label>
              <Select value={config.cpBgType} onValueChange={handleCpBgTypeChange}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-xl rounded-2xl">
                  <SelectItem value="dynamic" className="font-bold">Dynamic Theme Color (Gradient)</SelectItem>
                  <SelectItem value="image" className="font-bold">Custom Image Background</SelectItem>
                  <SelectItem value="video" className="font-bold">Custom Video Background (MP4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fallback Theme Color Picker */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Fallback/Theme Color (Hex)</Label>
              <div className="flex gap-3">
                <Input 
                  type="text" 
                  value={config.cpHeaderTheme}
                  onChange={handleCpThemeColorChange}
                  className="h-12 rounded-2xl border-slate-200 bg-white"
                  placeholder="#FF91B5"
                />
                <input 
                  type="color" 
                  value={config.cpHeaderTheme}
                  onChange={handleCpThemeColorChange}
                  className="h-12 w-12 rounded-2xl border border-slate-200 overflow-hidden cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Custom file upload for CP BG */}
            {config.cpBgType !== 'dynamic' && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  {config.cpBgType === 'image' ? 'Upload Background Image' : 'Upload Background Video'}
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1 h-12">
                    <input 
                      type="file" 
                      accept={config.cpBgType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleCpBgUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      disabled={uploadingCpBg}
                      ref={cpBgInputRef}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={uploadingCpBg}
                      className="h-12 w-full rounded-2xl border border-dashed border-slate-300 hover:border-pink-500 bg-white inline-flex items-center justify-center text-sm font-semibold text-slate-600 transition-colors shadow-sm pointer-events-none"
                    >
                      {uploadingCpBg ? (
                        <Loader className="h-5 w-5 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 text-slate-400" />
                          {config.cpBgUrl ? 'Update Media' : 'Upload File'}
                        </>
                      )}
                    </Button>
                  </div>
                  {config.cpBgUrl && (
                    <div className="h-12 w-12 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-inner relative group flex items-center justify-center bg-slate-900">
                      {config.cpBgType === 'image' ? (
                        <img src={config.cpBgUrl} className="h-full w-full object-cover" alt="CP Background" />
                      ) : (
                        <video src={config.cpBgUrl} className="h-full w-full object-cover" muted autoPlay loop />
                      )}
                      {/* Clear indicator */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        onClick={() => {
                          setConfig((prev: any) => ({ ...prev, cpBgUrl: '' }));
                          toast({ title: 'CP background cleared locally (Unsaved)' });
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

        {/* FRIEND SUB-TAB THEMING CONFIG */}
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Friend Tab Branding Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Friend BG Type Select */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Background Type</Label>
              <Select value={config.friendBgType} onValueChange={handleFriendBgTypeChange}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-xl rounded-2xl">
                  <SelectItem value="dynamic" className="font-bold">Dynamic Theme Color (Gradient)</SelectItem>
                  <SelectItem value="image" className="font-bold">Custom Image Background</SelectItem>
                  <SelectItem value="video" className="font-bold">Custom Video Background (MP4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fallback Theme Color Picker */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Fallback/Theme Color (Hex)</Label>
              <div className="flex gap-3">
                <Input 
                  type="text" 
                  value={config.friendHeaderTheme}
                  onChange={handleFriendThemeColorChange}
                  className="h-12 rounded-2xl border-slate-200 bg-white"
                  placeholder="#60a5fa"
                />
                <input 
                  type="color" 
                  value={config.friendHeaderTheme}
                  onChange={handleFriendThemeColorChange}
                  className="h-12 w-12 rounded-2xl border border-slate-200 overflow-hidden cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Custom file upload for Friend BG */}
            {config.friendBgType !== 'dynamic' && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  {config.friendBgType === 'image' ? 'Upload Background Image' : 'Upload Background Video'}
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1 h-12">
                    <input 
                      type="file" 
                      accept={config.friendBgType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleFriendBgUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      disabled={uploadingFriendBg}
                      ref={friendBgInputRef}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={uploadingFriendBg}
                      className="h-12 w-full rounded-2xl border border-dashed border-slate-300 hover:border-blue-500 bg-white inline-flex items-center justify-center text-sm font-semibold text-slate-600 transition-colors shadow-sm pointer-events-none"
                    >
                      {uploadingFriendBg ? (
                        <Loader className="h-5 w-5 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 text-slate-400" />
                          {config.friendBgUrl ? 'Update Media' : 'Upload File'}
                        </>
                      )}
                    </Button>
                  </div>
                  {config.friendBgUrl && (
                    <div className="h-12 w-12 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-inner relative group flex items-center justify-center bg-slate-900">
                      {config.friendBgType === 'image' ? (
                        <img src={config.friendBgUrl} className="h-full w-full object-cover" alt="Friend Background" />
                      ) : (
                        <video src={config.friendBgUrl} className="h-full w-full object-cover" muted autoPlay loop />
                      )}
                      {/* Clear indicator */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        onClick={() => {
                          setConfig((prev: any) => ({ ...prev, friendBgUrl: '' }));
                          toast({ title: 'Friend background cleared locally (Unsaved)' });
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

        {/* SAVE BUTTON */}
        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <Button
            onClick={handleSaveCpConfig}
            disabled={isSaving}
            className="h-16 px-8 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black uppercase text-base shadow-xl shadow-pink-600/10 active:scale-95 transition-all flex items-center gap-3"
          >
            {isSaving ? (
              <>
                <Loader className="animate-spin h-5 w-5" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
