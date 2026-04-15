import { AppLayout } from '@/components/layout/app-layout';

export default function TermsOfService() {
	return (
		<AppLayout>
			<div className="min-h-full bg-[#f1f8e9] font-sans flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
				<div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

				<div className="relative z-10 space-y-8 p-6 max-w-4xl mx-auto pb-32 pt-10">
					<header className="space-y-3">
						<h1 className="font-sans text-5xl font-bold tracking-tight text-green-900 uppercase leading-none">
							Terms & Conditions
						</h1>
						<p className="text-xl text-green-700/70 font-body">
							Last updated: {new Date().toLocaleDateString('en-IN')}
						</p>
					</header>

					<div className="space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 text-slate-800 font-body leading-relaxed">
						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">1. Introduction</h2>
							<p>Welcome to Ummy Chat. By accessing our platform, you agree to be bound by these Terms and Conditions. These terms govern your use of our services, including our website and mobile application.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">2. Use of Services</h2>
							<p>You must be at least 18 years old to use Ummy Chat. You agree to use the services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the services.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">3. Virtual Currency (Coins)</h2>
							<p>Ummy Chat provides virtual currency ("Coins") for use within the platform. These coins are for entertainment purposes only and hold no real-world monetary value. Coins are non-transferable and can only be used for gifting and premium assets within the app.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">4. User Account & Security</h2>
							<p>You are responsible for maintaining the confidentiality of your account details and for all activities that occur under your account. We reserve the right to terminate accounts that violate our community guidelines.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">5. Intellectual Property</h2>
							<p>All content included on the platform, such as text, graphics, logos, and software, is the property of Ummy Chat or its content suppliers and is protected by international copyright laws.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">6. Governing Law</h2>
							<p>These terms are governed by and construed in accordance with the laws of India. Any disputes relating to these terms shall be subject to the exclusive jurisdiction of the courts of India.</p>
						</section>

						<section className="space-y-4 pt-10 border-t border-green-100 font-sans">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Legal Entity</p>
									<p className="text-2xl font-bold text-green-900">Ummy Chat</p>
									<p className="text-green-700/60 mt-1">Official Platform</p>
								</div>
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Contact Us</p>
									<p className="text-xl font-bold text-green-900">support@ummy.chat</p>
									<p className="text-green-700/60 mt-1">Response in 24h Sync</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
