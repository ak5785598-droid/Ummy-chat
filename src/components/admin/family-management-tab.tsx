'use client';

import { useState, useRef, useMemo } from 'react';
import { useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Users, 
  Search, 
  Upload, 
  Trash2, 
  Loader, 
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function FamilyManagementTab() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFamilyId, setUploadingFamilyId] = useState<string | null>(null);

  // Fetch all families
  const familiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'families'));
  }, [firestore]);

  const { data: families, isLoading } = useCollection<any>(familiesQuery);

  // Filtered families list based on search
  const filteredFamilies = useMemo(() => {
    if (!families) return [];
    return families.filter((f: any) => 
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [families, searchQuery]);

  // Handle uploading banner for a specific family
  const handleBannerUpload = async (familyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !firestore) return;

    setUploadingFamilyId(familyId);
    try {
      const storagePath = `families/${familyId}/banner_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const result = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      // Directly update the family's bannerUrl in Firestore
      const familyDocRef = doc(firestore, 'families', familyId);
      await updateDoc(familyDocRef, {
        bannerUrl: downloadURL,
        updatedAt: new Date()
      });

      toast({
        title: 'Family Banner Updated! 🏡',
        description: 'The custom image/video banner has been successfully uploaded and updated.'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err.message || 'Failed to upload banner media.'
      });
    } finally {
      setUploadingFamilyId(null);
    }
  };

  const handleClearBanner = async (familyId: string) => {
    if (!firestore) return;
    try {
      const familyDocRef = doc(firestore, 'families', familyId);
      await updateDoc(familyDocRef, {
        bannerUrl: '',
        updatedAt: new Date()
      });
      toast({
        title: 'Banner Cleared',
        description: 'Family banner has been reset to fallback.'
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to clear banner',
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
        <CardTitle className="text-2xl uppercase flex items-center gap-2 text-emerald-600">
          <Users className="h-6 w-6 text-emerald-500 fill-current animate-pulse" />
          Family Registry Management
        </CardTitle>
        <CardDescription>
          Search and manage all user families. Upload or replace custom image or video cover banners for families.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search families by name or founder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-semibold"
          />
        </div>

        {/* Families List */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {filteredFamilies.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-xs font-bold uppercase tracking-wider">No families found</p>
            </div>
          ) : (
            filteredFamilies.map((family: any) => {
              const isUploading = uploadingFamilyId === family.id;
              const hasVideoBanner = family.bannerUrl && (
                family.bannerUrl.includes('.mp4') || 
                family.bannerUrl.includes('.webm') || 
                family.bannerUrl.includes('video')
              );

              return (
                <div 
                  key={family.id} 
                  className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/80 transition-colors shadow-sm"
                >
                  {/* Family Meta */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={family.logoUrl} className="object-cover" />
                      <AvatarFallback className="bg-emerald-100 text-emerald-600 font-black text-sm">
                        {family.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 leading-tight truncate">{family.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Founder: {family.ownerName || 'Unknown'} • Members: {family.memberCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Banner Preview & Upload Actions */}
                  <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                    
                    {/* Media Preview */}
                    <div className="h-16 w-32 rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 shrink-0 shadow-inner relative group flex items-center justify-center">
                      {family.bannerUrl ? (
                        hasVideoBanner ? (
                          <video src={family.bannerUrl} className="h-full w-full object-cover" muted autoPlay loop />
                        ) : (
                          <img src={family.bannerUrl} className="h-full w-full object-cover" alt="Banner" />
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[8px] font-black text-slate-500 gap-1 uppercase tracking-tighter">
                          <ImageIcon className="h-4 w-4 opacity-50" />
                          <span>Placeholder</span>
                        </div>
                      )}
                      
                      {family.bannerUrl && (
                        <div 
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          onClick={() => handleClearBanner(family.id)}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Upload button wrapper */}
                    <div className="relative h-10 w-36">
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={(e) => handleBannerUpload(family.id, e)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        disabled={isUploading}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        disabled={isUploading}
                        className="h-10 w-full rounded-xl border border-slate-200 hover:border-emerald-500 bg-white inline-flex items-center justify-center text-xs font-bold text-slate-600 transition-colors shadow-sm pointer-events-none"
                      >
                        {isUploading ? (
                          <Loader className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {family.bannerUrl ? 'Replace Banner' : 'Upload Banner'}
                          </>
                        )}
                      </Button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </CardContent>
    </Card>
  );
}
