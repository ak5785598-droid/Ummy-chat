'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking, useStorage } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Pen, Loader, Camera, Upload, Info, ChevronLeft, Calendar as CalendarIcon, Globe, Phone, X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarFrame } from '@/components/avatar-frame';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Other', code: 'OT', flag: '🌍' },
];

interface EditProfileDialogProps {
  profile: any;
  trigger?: React.ReactNode;
}

export function EditProfileDialog({ profile, trigger }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spaceInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  // Main Fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [birthday, setBirthday] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Privacy Controls
  const [showBirthday, setShowBirthday] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(true);

  // Space Background (8 Slots)
  const [spaceImages, setSpaceImages] = useState<(string | null)[]>(Array(8).fill(null));
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // DP Cropping
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setName(profile.username || profile.name || '');
      setBio(profile.bio || '');
      setGender(profile.gender || undefined);
      setCountry(profile.country || undefined);
      setBirthday(profile.birthday || '');
      setWhatsapp(profile.whatsapp || '');
      setShowBirthday(profile.showBirthday !== false);
      setShowWhatsapp(profile.showWhatsapp !== false);
      
      // Handle spaceImages (Ensure we have 8 slots)
      const images = profile.spaceImages || [];
      setSpaceImages([...images, ...Array(8 - images.length).fill(null)].slice(0, 8));
    }
  }, [profile, open]);

  const isGenderFixed = !!profile?.gender;

  const handleSave = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);
    
    const userSummaryRef = doc(firestore, 'users', user.uid);
    const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    
    const updateData: any = {
      username: name,
      bio: bio,
      birthday: birthday,
      whatsapp: whatsapp,
      country: country,
      showBirthday: showBirthday,
      showWhatsapp: showWhatsapp,
      spaceImages: spaceImages.filter(img => img !== null),
      updatedAt: serverTimestamp()
    };

    if (!isGenderFixed && gender) updateData.gender = gender;

    try {
      // Update Summary (Critical for quick access)
      await setDocumentNonBlocking(userSummaryRef, {
        username: name,
        whatsapp: whatsapp,
        showWhatsapp: showWhatsapp,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update Detailed Profile
      await setDocumentNonBlocking(userProfileRef, updateData, { merge: true });
      
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

  const handleSpaceUpload = async (slotIndex: number) => {
      setUploadingSlot(slotIndex);
      spaceInputRef.current?.click();
  };

  const handleSpaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || uploadingSlot === null || !user || !storage) {
          setUploadingSlot(null);
          return;
      }

      try {
          const timestamp = Date.now();
          const storagePath = `users/${user.uid}/space/img_${uploadingSlot}_${timestamp}.jpg`;
          const storageRef = ref(storage, storagePath);
          
          const result = await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
          const downloadURL = await getDownloadURL(result.ref);

          const newImages = [...spaceImages];
          newImages[uploadingSlot] = downloadURL;
          setSpaceImages(newImages);
          
          toast({ title: 'Slot Updated', description: `Position ${uploadingSlot + 1} synchronized.` });
      } catch (err: any) {
          toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
      } finally {
          setUploadingSlot(null);
          if (spaceInputRef.current) spaceInputRef.current.value = '';
      }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ? trigger : (
            <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 text-white h-10 w-10 shadow-xl backdrop-blur-md">
              <Pen className="h-5 w-5" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-white text-black p-0 border-none m-0 rounded-none z-[100] flex flex-col font-sans data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0">
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden bg-white">
            <header className="px-5 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-[110] border-b border-gray-50 pt-safe shrink-0">
              <button type="button" onClick={() => setOpen(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              
              <h1 className="text-[13px] font-black uppercase tracking-tight text-gray-900 absolute left-1/2 -translate-x-1/2">Modify Persona</h1>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="h-10 px-6 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold uppercase text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader className="h-4 w-4 animate-spin text-white" /> : 'Save'}
              </Button>
            </header>

            <ScrollArea className="flex-1">
              <div className="px-6 pt-0 pb-10 space-y-4 focus-visible:outline-none">
                
                <div className="flex flex-col items-center gap-2 -mt-4">
                  <div className="relative group">
                    <AvatarFrame frameId={profile?.inventory?.activeFrame} size="xl" className="h-44 w-44 translate-y-2 translate-x-2">
                      <Avatar className="h-36 w-36 border-4 border-primary/20 shadow-2xl">
                        <AvatarImage key={profile?.avatarUrl} src={profile?.avatarUrl || undefined} alt={name} />
                        <AvatarFallback className="text-4xl font-bold bg-slate-50">{(name || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                    </AvatarFrame>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-2xl h-10 px-6 text-[10px] font-bold uppercase border-2 bg-yellow-400 text-black border-yellow-400 shadow-md">
                      <Upload className="h-3 w-3 mr-2" /> Change photo
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraOpen(true)} className="rounded-2xl h-10 px-6 text-[10px] font-bold uppercase border-2 bg-primary/5 border-primary/20 text-primary shadow-sm">
                      <Camera className="h-3 w-3 mr-2" /> Camera
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-1 border-b border-slate-100 pb-1">
                    <div className="flex justify-between items-center ml-1">
                      <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Tribe Display Name</Label>
                      <span className={cn("text-[8px] font-bold", name.length >= 24 ? "text-red-500" : "text-slate-300")}>{name.length}/24</span>
                    </div>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 24))}
                      required
                      placeholder="Enter your name"
                      className="h-10 text-base border-none bg-transparent focus-visible:ring-0 px-1 font-bold text-slate-900 placeholder:text-slate-200"
                    />
                  </div>

                  <div className="grid gap-1 border-b border-slate-100 pb-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Gender</Label>
                    <Select value={gender} onValueChange={setGender} disabled={isGenderFixed || isSubmitting}>
                      <SelectTrigger className="h-10 border-none bg-transparent shadow-none focus:ring-0 px-1 font-bold text-slate-900">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-2xl rounded-2xl">
                        <SelectItem value="Male" className="font-bold">Male</SelectItem>
                        <SelectItem value="Female" className="font-bold">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1 border-b border-slate-100 pb-1">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Birthday</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Public View</span>
                        <Switch checked={showBirthday} onCheckedChange={setShowBirthday} className="scale-75 data-[state=checked]:bg-primary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-slate-300 ml-1" />
                      <input 
                        type="date" 
                        value={birthday} 
                        onChange={(e) => setBirthday(e.target.value)} 
                        className="flex-1 h-10 bg-transparent border-none focus:outline-none font-bold text-slate-900 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1 border-b border-slate-100 pb-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Country / Region</Label>
                    <Select value={country} onValueChange={setCountry} disabled={isSubmitting}>
                      <SelectTrigger className="h-10 border-none bg-transparent shadow-none focus:ring-0 px-1 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-slate-300" />
                          <SelectValue placeholder="Select Country" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none shadow-2xl rounded-2xl max-h-60">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name} className="font-bold">
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1 border-b border-slate-100 pb-1">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">WhatsApp ID</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Public View</span>
                        <Switch checked={showWhatsapp} onCheckedChange={setShowWhatsapp} className="scale-75 data-[state=checked]:bg-primary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-300 ml-1" />
                      <Input 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)} 
                        placeholder="Enter WhatsApp Number" 
                        className="h-10 text-base border-none bg-transparent focus-visible:ring-0 px-1 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1 border-b border-slate-100 pb-0">
                    <Label htmlFor="edit-bio" className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Personality Signature (Bio)</Label>
                    <Textarea
                      id="edit-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your tribe about yourself..."
                      className="resize-none min-h-[30px] h-fit border-none bg-transparent focus-visible:ring-0 px-1 font-medium text-slate-900 placeholder:text-slate-200"
                    />
                  </div>

                  <div className="pt-4 pb-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-500">
                          Space Background ({spaceImages.filter(img => img !== null).length}/8)
                        </Label>
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3 text-slate-300" />
                          <span className="text-[8px] font-bold text-slate-300 uppercase">Auto-scrolling in profile</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {spaceImages.filter(img => img !== null).map((url, i) => (
                          <div key={i} className="relative h-20 w-20 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden group">
                              <img src={url!} alt={`Space ${i}`} className="h-full w-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => {
                                    const newImages = [...spaceImages.filter(img => img !== null)];
                                    newImages.splice(i, 1);
                                    setSpaceImages([...newImages, ...Array(8 - newImages.length).fill(null)]);
                                    toast({ title: 'Image Removed' });
                                }}
                                className="absolute top-1 right-1 h-5 w-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                          </div>
                        ))}

                        {spaceImages.filter(img => img !== null).length < 8 && (
                          <button 
                            type="button" 
                            disabled={uploadingSlot !== null}
                            onClick={() => handleSpaceUpload(spaceImages.filter(img => img !== null).length)} 
                            className="h-20 w-20 rounded-2xl border-2 border-dashed border-cyan-100 bg-cyan-50/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-50 transition-all active:scale-95"
                          >
                              {uploadingSlot !== null ? <Loader className="h-5 w-5 animate-spin" /> : <Plus className="h-8 w-8" strokeWidth={2.5} />}
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </form>
        </DialogContent>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <input type="file" ref={spaceInputRef} onChange={handleSpaceFileChange} className="hidden" accept="image/*" />
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
