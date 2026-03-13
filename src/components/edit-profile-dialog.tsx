'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Pen, Loader, Camera, Upload, Globe, Info } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditProfileDialogProps {
  profile: any;
  trigger?: React.ReactNode;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
];

/**
 * Production Persona Editor.
 * Re-engineered to support one-time set for Gender and Country.
 * Name and DP remain editable at any time.
 */
export function EditProfileDialog({ profile, trigger }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setName(profile.username || profile.name || '');
      setBio(profile.bio || '');
      setGender(profile.gender || undefined);
      setCountry(profile.country || undefined);
    }
  }, [profile, open]);

  const isGenderFixed = !!profile?.gender;
  const isCountryFixed = !!profile?.country;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);
    
    const userSummaryRef = doc(firestore, 'users', user.uid);
    const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    
    // Core data that can be updated multiple times
    const updateData: any = {
      username: name,
      bio: bio,
      updatedAt: serverTimestamp()
    };

    // Only allow setting gender/country if they aren't already set
    if (!isGenderFixed && gender) updateData.gender = gender;
    if (!isCountryFixed && country) updateData.country = country;

    try {
      updateDocumentNonBlocking(userSummaryRef, {
        username: name,
        updatedAt: serverTimestamp()
      });

      updateDocumentNonBlocking(userProfileRef, updateData);
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
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl font-headline">
          <form onSubmit={handleSave}>
            <DialogHeader className="p-8 pb-0 text-center">
              <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Modify Persona</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                Identity frequency updates instantly.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                      <AvatarImage key={profile?.avatarUrl} src={profile?.avatarUrl || undefined} alt={name} />
                      <AvatarFallback className="text-4xl font-black bg-slate-50">{(name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                     <Button 
                       type="button" 
                       variant="outline" 
                       size="sm" 
                       onClick={() => fileInputRef.current?.click()}
                       className="rounded-full h-10 px-6 text-[10px] font-black uppercase italic border-2 bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 hover:border-yellow-500"
                     >
                       <Upload className="h-3 w-3 mr-2" /> Upload
                     </Button>
                     <Button 
                       type="button" 
                       variant="outline" 
                       size="sm" 
                       onClick={() => setIsCameraOpen(true)}
                       className="rounded-full h-10 px-6 text-[10px] font-black uppercase italic border-2 bg-primary/5 border-primary/20 text-primary"
                     >
                       <Camera className="h-3 w-3 mr-2" /> Camera
                     </Button>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="grid gap-2">
                     <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tribe Display Name</Label>
                     <Input
                       id="edit-name"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       required
                       disabled={isSubmitting}
                       placeholder="Enter your name"
                       className="rounded-2xl h-14 text-lg border-2 border-yellow-200 bg-yellow-50 focus:border-primary transition-all italic font-bold text-yellow-900 placeholder:text-yellow-600/40"
                     />
                   </div>

                   {/* Gender Selection - One Time Set */}
                   <div className="grid gap-2">
                     <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gender</Label>
                        {isGenderFixed && <span className="text-[8px] font-black uppercase text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Locked</span>}
                     </div>
                     <Select value={gender} onValueChange={setGender} disabled={isGenderFixed || isSubmitting}>
                        <SelectTrigger className="rounded-2xl h-14 border-2 border-yellow-200 bg-yellow-50 focus:ring-primary font-bold italic text-yellow-900">
                           <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 rounded-2xl">
                           <SelectItem value="Male" className="font-bold">Male</SelectItem>
                           <SelectItem value="Female" className="font-bold">Female</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>

                   {/* Country Selection - One Time Set */}
                   <div className="grid gap-2">
                     <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Region Frequency</Label>
                        {isCountryFixed && <span className="text-[8px] font-black uppercase text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Locked</span>}
                     </div>
                     <Select value={country} onValueChange={setCountry} disabled={isCountryFixed || isSubmitting}>
                        <SelectTrigger className="rounded-2xl h-14 border-2 border-yellow-200 bg-yellow-50 focus:ring-primary font-bold italic text-yellow-900">
                           <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 rounded-2xl max-h-[300px]">
                           {COUNTRIES.map((c) => (
                             <SelectItem key={c.code} value={c.code} className="font-bold">
                               <span className="mr-2">{c.flag}</span> {c.name}
                             </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                   </div>

                   <div className="grid gap-2">
                     <Label htmlFor="edit-bio" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Personality Signature (Bio)</Label>
                     <Textarea
                       id="edit-bio"
                       value={bio}
                       onChange={(e) => setBio(e.target.value)}
                       placeholder="Tell your tribe about yourself..."
                       className="resize-none h-28 rounded-2xl border-2 border-yellow-200 bg-yellow-50 focus:border-primary transition-all font-body italic text-yellow-900 placeholder:text-yellow-600/40"
                       disabled={isSubmitting}
                     />
                   </div>
                </div>

                {(!isGenderFixed || !isCountryFixed) && (
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex gap-3">
                     <Info className="h-5 w-5 text-orange-500 shrink-0" />
                     <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase">
                        Gender and Country can only be synchronized once. Please ensure accuracy before committing changes.
                     </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="p-8 pt-4">
              <Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting || isUploading}>
                {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : null}
                Commit Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
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
