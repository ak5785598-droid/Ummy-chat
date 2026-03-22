import { AppLayout } from '@/components/layout/app-layout';

export default function TermsOfService() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 font-body text-white/80 space-y-6 pt-32 pb-32">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">Terms of Service</h1>
        <p className="text-sm opacity-50">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic">1. Acceptance of Terms</h2>
          <p>By accessing and using our application, you accept and agree to be bound by the terms and provisions of this agreement.</p>
          
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic mt-6">2. Rules of Conduct</h2>
          <p>Users must respectfully engage with others in rooms and games. Any violation of conversational rules or cheating in games will result in immediate termination of your account.</p>
          
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic mt-6">3. Disclaimer</h2>
          <p>The virtual currency ("Coins") within Ummy is for entertainment purposes only and holds no real-world monetary value.</p>
        </section>
      </div>
    </AppLayout>
  );
}
