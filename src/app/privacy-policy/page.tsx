import { AppLayout } from '@/components/layout/app-layout';

export default function PrivacyPolicy() {
 return (
  <AppLayout>
   <div className="max-w-4xl mx-auto p-8 font-body text-white/80 space-y-6 pt-32 pb-32">
    <h1 className="text-4xl font-bold text-white uppercase tracking-tight drop-shadow-lg">Privacy Policy</h1>
    <p className="text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
    
    <section className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
     <h2 className="text-2xl font-bold text-yellow-400 uppercase ">1. Information We Collect</h2>
     <p>We collect information you provide directly to us when you create an account, such as your basic profile data from Facebook, Google, or your phone number.</p>
     
     <h2 className="text-2xl font-bold text-yellow-400 uppercase mt-6">2. How We Use Your Information</h2>
     <p>We use the information we collect to provide, maintain, and improve our services, including user authentication, game synchronization, and personalized experiences.</p>
     
     <h2 className="text-2xl font-bold text-yellow-400 uppercase mt-6">3. Data Deletion</h2>
     <p>You can request the deletion of your account and associated data at any time by contacting our support team or navigating to your account settings within the app.</p>
    </section>
   </div>
  </AppLayout>
 );
}
