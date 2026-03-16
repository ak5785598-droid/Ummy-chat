'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Loader,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserX,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  useAuth, 
  useUser, 
  useFirestore
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { signOut } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिंदी' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা' },
  { id: 'ar', name: 'Arabic', native: 'العربية' },
  { id: 'ur', name: 'Urdu', native: 'اردو' },
];

const TRANSLATIONS: Record<string, any> = {
  en: {
    title: 'Settings',
    identity: 'TRIBAL IDENTITY',
    language: 'LANGUAGE',
    logout: 'EXIT FREQUENCY (SIGN OUT)',
    delete: 'DELETE ACCOUNT',
    footer: 'Ummy Secure Protocol v1.4.2 • India Official',
    langSelect: 'Select Language'
  },
  hi: {
    title: 'सेटिंग्स',
    identity: 'जनजातीय पहचान',
    language: 'भाषा',
    logout: 'फ्रीक्वेंसी से बाहर निकलें (साइन आउट)',
    delete: 'खाता हटाएं',
    footer: 'उम्मी सुरक्षित प्रोटोकॉल v1.4.2 • भारत आधिकारिक',
    langSelect: 'भाषा चुनें'
  },
  bn: {
    title: 'সেটিংস',
    identity: 'উপজাতীয় পরিচয়',
    language: 'ভাষা',
    logout: 'ফ্রিকোয়েন্সি প্রস্থান করুন (সাইন আউট)',
    delete: 'অ্যাকাউন্ট মুছুন',
    footer: 'উম্মি সুরক্ষিত প্রোটোকল v1.4.2 • ভারত অফিসিয়াল',
    langSelect: 'ভাষা নির্বাচন করুন'
  },
  ar: {
    title: 'الإعدادات',
    identity: 'الهوية القبلية',
    language: 'اللغة',
    logout: 'الخروج من التردد (تسجيل الخروج)',
    delete: 'حذف الحساب',
    footer: 'بروتوكول أومي الآمن v1.4.2 • الهند الرسمية',
    langSelect: 'اختر اللغة'
  },
  ur: {
    title: 'ترتیبات',
    identity: 'قبائلی شناخت',
    language: 'زبان',
    logout: 'فریکوئنسی سے باہر نکلیں (سائن آؤٹ)',
    delete: 'اکاؤنٹ حذف کریں',
    footer: 'امی محفوظ پروٹوکول v1.4.2 • انڈیا آفیشل',
    langSelect: 'زبان منتخب کریں'
  }
};

const MenuItem = ({ icon: Icon, label, href, extra, onClick }: any) => {
  return (
    <div 
      className="flex items-center justify-between py-5 px-6 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all" 
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-full bg-purple-50 text-purple-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-black text-gray-800 text-sm uppercase italic tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && <span className="text-[10px] font-black text-muted-foreground italic uppercase">{extra}</span>}
        <ChevronRight className="h-4 w-4 text-gray-200" />
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const { toast } = useToast();

  const [view, setView] = useState<'main' | 'language'>('main');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('ummy_lang');
    if (savedLang) setSelectedLanguage(savedLang);
  }, []);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  const handleLanguageSelect = (langId: string) => {
    setSelectedLanguage(langId);
    localStorage.setItem('ummy_lang', langId);
    toast({ title: 'Language Updated' });
    setTimeout(() => setView('main'), 300);
  };

  const handleLogout = async () => {
    if (!auth || !user || !firestore) return;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const userSnap = await getDoc(userRef);
      const currentRoomId = userSnap.data()?.currentRoomId;

      const batch = writeBatch(firestore);
      
      batch.update(userRef, { 
        isOnline: false, 
        currentRoomId: null, 
        updatedAt: serverTimestamp() 
      });
      batch.update(profileRef, { 
        isOnline: false, 
        currentRoomId: null, 
        updatedAt: serverTimestamp() 
      });

      if (currentRoomId) {
        const roomRef = doc(firestore, 'chatRooms', currentRoomId);
        const participantRef = doc(firestore, 'chatRooms', currentRoomId, 'participants', user.uid);
        batch.delete(participantRef);
        batch.update(roomRef, { 
          participantCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      await signOut(auth);
      window.location.href = '/login';
    } catch (e: any) {
      await signOut(auth);
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to PERMANENTLY DELETE your account? This action cannot be undone.")) {
      toast({ variant: 'destructive', title: 'Action Restricted', description: 'Account deletion requires manual tribal authority review.' });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout hideSidebarOnMobile>
        <div className="flex h-screen items-center justify-center bg-white">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav>
      <div className="min-h-full bg-white font-headline flex flex-col animate-in fade-in duration-700">
        
        {view === 'main' ? (
          <>
            <header className="px-6 pt-10 pb-10">
               <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow-sm">
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
               </button>
               <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-slate-900">{t.title}</h1>
            </header>

            <div className="px-6 space-y-10">
               <section className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">{t.identity}</p>
                  <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white">
                     <MenuItem 
                       icon={Globe} 
                       label={t.language} 
                       extra={LANGUAGES.find(l => l.id === selectedLanguage)?.name} 
                       onClick={() => setView('language')} 
                     />
                  </Card>
               </section>

               <section className="space-y-6 flex flex-col items-center">
                  <button 
                    onClick={handleLogout}
                    className="w-full h-20 rounded-[2rem] bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 shadow-none font-black uppercase italic text-xl flex items-center justify-center gap-4 transition-all active:scale-95"
                  >
                    <LogOut className="h-6 w-6" />
                    {t.logout}
                  </button>

                  <button 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 text-red-400 font-black uppercase italic text-xs hover:text-red-500 transition-colors py-4"
                  >
                    <UserX className="h-4 w-4" />
                    {t.delete}
                  </button>
               </section>

               <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 mt-4 italic">
                 {t.footer}
               </p>
            </div>
          </>
        ) : (
          <div className="animate-in slide-in-from-right duration-300 flex flex-col h-full">
            <header className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
               <button onClick={() => setView('main')} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
               </button>
               <h1 className="text-xl font-black uppercase italic tracking-tighter">{t.langSelect}</h1>
               <div className="w-10" />
            </header>

            <div className="p-6">
               <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white divide-y divide-gray-50">
                  {LANGUAGES.map((lang) => (
                    <button 
                      key={lang.id} 
                      onClick={() => handleLanguageSelect(lang.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:bg-gray-100 transition-all"
                    >
                       <div className="flex flex-col items-start">
                          <span className="font-black text-gray-800 text-lg uppercase italic tracking-tight">{lang.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang.native}</span>
                       </div>
                       {selectedLanguage === lang.id && (
                         <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Check className="h-5 w-5 text-white" strokeWidth={4} />
                         </div>
                       )}
                    </button>
                  ))}
               </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
