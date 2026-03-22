import { AppLayout } from '@/components/layout/app-layout';

export default function PrivacyPolicy() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 font-body text-white/80 space-y-6 pt-32 pb-32">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">Privacy Policy</h1>
        <p className="text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, such as your basic profile data from Facebook, Google, or your phone number.</p>
          
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic mt-6">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including user authentication, game synchronization, and personalized experiences.</p>
          
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic mt-6">3. Data Deletion</h2>
          <p>You can request the deletion of your account and associated data at any time by contacting our support team or navigating to your account settings within the app.</p>
        </section>
      </div>
    </AppLayout>
  );
}
