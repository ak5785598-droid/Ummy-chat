import { AppLayout } from '@/components/layout/app-layout';

export default function PrivacyPolicy() {
	return (
		<AppLayout>
			<div className="min-h-full bg-[#f1f8e9] font-sans flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
				<div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

				<div className="relative z-10 space-y-8 p-6 max-w-4xl mx-auto pb-32 pt-10">
					<header className="space-y-3">
						<h1 className="font-sans text-5xl font-bold tracking-tight text-green-900 uppercase leading-none">
							Privacy Policy
						</h1>
						<p className="text-xl text-green-700/70 font-body">
							Last updated: {new Date().toLocaleDateString('en-IN')}
						</p>
					</header>

					<div className="space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 text-slate-800 font-body leading-relaxed">
						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">1. Information Collection</h2>
							<p>We collect information you provide directly to us when you create an account, such as your basic profile data (Facebook, Google, or phone number) and any other information you choose to provide.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">2. Use of Information</h2>
							<p>We use the information we collect to provide, maintain, and improve our services, including user authentication, game synchronization, and personalized experiences.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">3. Data Sharing</h2>
							<p>We do not sell your personal data. We may share information with third-party service providers (like payment processors) to facilitate our services. These providers are obligated to protect your information.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">4. Data Security</h2>
							<p>We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. However, no internet transmission is 100% secure.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">5. Your Rights</h2>
							<p>You have the right to access, update, or delete your personal information. You can request account deletion at any time through the app settings or by contacting our support team.</p>
						</section>

						<section className="space-y-4 pt-10 border-t border-green-100 font-sans">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Legal Entity</p>
									<p className="text-2xl font-bold text-green-900">Ummy Chat</p>
									<p className="text-green-700/60 mt-1">Official Platform</p>
								</div>
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Privacy Contact</p>
									<p className="text-xl font-bold text-green-900">support@ummy.chat</p>
									<p className="text-green-700/60 mt-1">Global Data Protocol</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
