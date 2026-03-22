'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
  Loader,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserX,
  Check,
  Link as LinkIcon,
  ShieldCheck,
  Smartphone
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
import { 
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  linkWithPopup,
  unlink,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageCode } from '@/lib/translations';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिंदी' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা' },
  { id: 'ar', name: 'Arabic', native: 'العربية' },
  { id: 'ur', name: 'Urdu', native: 'اردو' },
];

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
  const { t, language, setLanguage } = useTranslation();

  const [view, setView] = useState<'main' | 'language' | 'account'>('main');

  // Account Linking State
  const [isLinking, setIsLinking] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<'number' | 'code'>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const providerData = auth?.currentUser?.providerData || [];
  const linkedProviders = providerData.map(p => p.providerId);

  const handleLanguageSelect = (langId: LanguageCode) => {
    setLanguage(langId);
    toast({ title: 'Language Updated' });
    setTimeout(() => setView('main'), 300);
  };

  const handleLinkGoogle = async () => {
    if (!auth?.currentUser) return;
    setIsLinking(true);
    try {
      await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
      toast({ title: 'Success', description: 'Google account linked successfully.' });
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
         toast({ variant: 'destructive', title: 'Already Linked', description: 'This Google account is already linked to another Ummy profile.' });
      } else if (error.code !== 'auth/popup-closed-by-user') {
         toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkFacebook = async () => {
    if (!auth?.currentUser) return;
    setIsLinking(true);
    try {
      await linkWithPopup(auth.currentUser, new FacebookAuthProvider());
      toast({ title: 'Success', description: 'Facebook account linked successfully.' });
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
         toast({ variant: 'destructive', title: 'Already Linked', description: 'This Facebook account is already linked to another Ummy profile.' });
      } else if (error.code !== 'auth/popup-closed-by-user') {
         toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkPhone = async () => {
    if (!auth?.currentUser) return;
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      toast({ variant: 'destructive', title: 'Invalid Number', description: 'Include your country code.' });
      return;
    }
    setIsLinking(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'settings-recaptcha', { size: 'invisible' });
      }
      const verifier = (window as any).recaptchaVerifier;
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await linkWithPhoneNumber(auth.currentUser, formattedNumber, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
      toast({ title: 'Code Sent', description: 'Verification dispatched via SMS.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!confirmationResult) return;
    setIsLinking(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: 'Success', description: 'Phone number linked successfully.' });
      setPhoneLoginStep('number'); // reset
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Incorrect verification code.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (providerId: string) => {
    if (!auth?.currentUser) return;
    if (linkedProviders.length <= 1) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot unlink your only login method.' });
      return;
    }
    if (confirm(`Are you sure you want to unlink your ${providerId} account?`)) {
      setIsLinking(true);
      try {
        await unlink(auth.currentUser, providerId);
        toast({ title: 'Unlinked', description: 'Account connection removed.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setIsLinking(false);
      }
    }
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
      <AppLayout hideSidebarOnMobile hideBottomNav>
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
        <div id="settings-recaptcha" />
        
        {view === 'main' ? (
          <>
            <header className="px-6 pt-10 pb-10">
               <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow-sm">
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
               </button>
               <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-slate-900">{t.settings.title}</h1>
            </header>

            <div className="px-6 space-y-10">
               <section className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">{t.settings.identity}</p>
                  <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white divide-y divide-gray-50">
                     <MenuItem 
                       icon={LinkIcon} 
                       label="Account Connections" 
                       extra={linkedProviders.length + " Linked"} 
                       onClick={() => setView('account')} 
                     />
                     <MenuItem 
                       icon={Globe} 
                       label={t.settings.language} 
                       extra={LANGUAGES.find(l => l.id === language)?.name} 
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
                    {t.settings.logout}
                  </button>

                  <button 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 text-red-400 font-black uppercase italic text-xs hover:text-red-500 transition-colors py-4"
                  >
                    <UserX className="h-4 w-4" />
                    {t.settings.delete}
                  </button>
               </section>

               <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 mt-4 italic">
                 {t.settings.footer}
               </p>
            </div>
          </>
        ) : view === 'account' ? (
          <div className="animate-in slide-in-from-right duration-300 flex flex-col h-[100dvh]">
             <header className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
                <button onClick={() => setView('main')} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
                   <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Connections</h1>
                <div className="w-10" />
             </header>

             <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-32">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                  Bind multiple sign-in methods to your profile. You can log in with any linked method.
                </p>

                <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white p-6 space-y-6 divide-y divide-gray-50">
                   {/* Google */}
                   <div className="flex items-center justify-between pt-2 pb-2">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-gray-50 rounded-2xl"><FcGoogle className="h-6 w-6" /></div>
                       <div className="flex flex-col">
                         <span className="font-black text-gray-800 uppercase italic">Google</span>
                         {linkedProviders.includes('google.com') ? (
                           <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Connected</span>
                         ) : (
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Not Connected</span>
                         )}
                       </div>
                     </div>
                     {linkedProviders.includes('google.com') ? (
                       <Button variant="ghost" size="sm" onClick={() => handleUnlink('google.com')} disabled={isLinking || linkedProviders.length <= 1} className="text-red-500 font-bold text-[10px] uppercase">Unlink</Button>
                     ) : (
                       <Button size="sm" onClick={handleLinkGoogle} disabled={isLinking} className="rounded-full font-black uppercase italic text-[10px]">Connect</Button>
                     )}
                   </div>

                   {/* Facebook */}
                   <div className="flex items-center justify-between pt-6 pb-2">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-50 rounded-2xl"><FaFacebook className="h-6 w-6 text-blue-600" /></div>
                       <div className="flex flex-col">
                         <span className="font-black text-gray-800 uppercase italic">Facebook</span>
                         {linkedProviders.includes('facebook.com') ? (
                           <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Connected</span>
                         ) : (
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Not Connected</span>
                         )}
                       </div>
                     </div>
                     {linkedProviders.includes('facebook.com') ? (
                       <Button variant="ghost" size="sm" onClick={() => handleUnlink('facebook.com')} disabled={isLinking || linkedProviders.length <= 1} className="text-red-500 font-bold text-[10px] uppercase">Unlink</Button>
                     ) : (
                       <Button size="sm" onClick={handleLinkFacebook} disabled={isLinking} className="bg-blue-600 hover:bg-blue-700 rounded-full font-black uppercase italic text-[10px]">Connect</Button>
                     )}
                   </div>

                   {/* Phone */}
                   <div className="flex items-center justify-between pt-6 pb-2">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-green-50 rounded-2xl"><Smartphone className="h-6 w-6 text-green-600" /></div>
                       <div className="flex flex-col">
                         <span className="font-black text-gray-800 uppercase italic">Phone</span>
                         {linkedProviders.includes('phone') ? (
                           <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Connected</span>
                         ) : (
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Not Connected</span>
                         )}
                       </div>
                     </div>
                     {linkedProviders.includes('phone') ? (
                       <Button variant="ghost" size="sm" onClick={() => handleUnlink('phone')} disabled={isLinking || linkedProviders.length <= 1} className="text-red-500 font-bold text-[10px] uppercase">Unlink</Button>
                     ) : null}
                   </div>

                   {!linkedProviders.includes('phone') && (
                     <div className="pt-6 flex flex-col gap-3">
                       {phoneLoginStep === 'number' ? (
                         <>
                           <Input type="tel" placeholder="Phone Number (+91...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLinking} className="h-12 rounded-xl text-center font-bold bg-white border-2 border-gray-100" />
                           <Button onClick={handleLinkPhone} disabled={isLinking || !phoneNumber} className="h-12 w-full rounded-xl bg-green-600 hover:bg-green-700 font-black uppercase italic text-xs">Connect Phone</Button>
                         </>
                       ) : (
                         <>
                           <p className="text-[10px] text-center text-gray-500 uppercase font-black">Code sent to {phoneNumber}</p>
                           <Input type="text" maxLength={6} placeholder="000000" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} disabled={isLinking} className="h-12 rounded-xl text-center font-black tracking-[0.2em] text-lg bg-white border-2 border-gray-100" />
                           <Button onClick={handleVerifyPhoneCode} disabled={isLinking || verificationCode.length < 6} className="h-12 w-full rounded-xl bg-green-600 hover:bg-green-700 font-black uppercase italic text-xs">Verify Code</Button>
                           <Button variant="ghost" size="sm" onClick={() => setPhoneLoginStep('number')} className="text-[10px] uppercase font-bold text-gray-400">Cancel</Button>
                         </>
                       )}
                     </div>
                   )}
                </Card>
             </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300 flex flex-col h-full">
            <header className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
               <button onClick={() => setView('main')} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
               </button>
               <h1 className="text-xl font-black uppercase italic tracking-tighter">{t.settings.langSelect}</h1>
               <div className="w-10" />
            </header>

            <div className="p-6">
               <Card className="rounded-[2.5rem] border-2 border-gray-50 shadow-sm overflow-hidden bg-white divide-y divide-gray-50">
                  {LANGUAGES.map((lang) => (
                    <button 
                      key={lang.id} 
                      onClick={() => handleLanguageSelect(lang.id as LanguageCode)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:bg-gray-100 transition-all"
                    >
                       <div className="flex flex-col items-start">
                          <span className="font-black text-gray-800 text-lg uppercase italic tracking-tight">{lang.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang.native}</span>
                       </div>
                       {language === lang.id && (
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
