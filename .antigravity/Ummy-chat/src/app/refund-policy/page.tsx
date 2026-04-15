import { AppLayout } from '@/components/layout/app-layout';

export default function RefundPolicy() {
	return (
		<AppLayout>
			<div className="min-h-full bg-[#f1f8e9] font-sans flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
				<div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

				<div className="relative z-10 space-y-8 p-6 max-w-4xl mx-auto pb-32 pt-10">
					<header className="space-y-3">
						<h1 className="font-sans text-5xl font-bold tracking-tight text-green-900 uppercase leading-none">
							Refund & Cancellation
						</h1>
						<p className="text-xl text-green-700/70 font-body">
							Last updated: {new Date().toLocaleDateString('en-IN')}
						</p>
					</header>

					<div className="space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 text-slate-800 font-body leading-relaxed">
						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">1. Virtual Items Policy</h2>
							<p>All purchases of virtual currency ("Coins") and virtual gifts within Ummy Chat are final and non-refundable. Once a transaction is successful and coins are credited to your account, they cannot be exchanged for real-world currency.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">2. Cancellation Policy</h2>
							<p>Users can stop using the services at any time. However, any active subscriptions or one-time purchases made prior to the cessation of use are non-refundable.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">3. Technical Errors</h2>
							<p>In case of a technical failure where a payment is successful but coins are not credited, please contact us with your transaction ID. We will resolve the issue within 2-3 business days after verification.</p>
						</section>

						<section className="space-y-4">
							<h2 className="text-2xl font-bold text-green-800 uppercase">4. Refund Disputes</h2>
							<p>For any disputes related to payments, please reach out to our support team. We aim to respond and provide a resolution sync within 48-72 hours.</p>
						</section>

						<section className="space-y-4 pt-10 border-t border-green-100 font-sans">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Legal Entity</p>
									<p className="text-2xl font-bold text-green-900">Ummy Chat</p>
									<p className="text-green-700/60 mt-1">Merchant of Record</p>
								</div>
								<div>
									<p className="text-green-800 font-bold uppercase tracking-wider text-sm mb-2">Billing Support</p>
									<p className="text-xl font-bold text-green-900">support@ummy.chat</p>
									<p className="text-green-700/60 mt-1">Resolution in 72h Sync</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
