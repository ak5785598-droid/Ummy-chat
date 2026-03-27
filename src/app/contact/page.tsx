import { AppLayout } from '@/components/layout/app-layout';
import { Mail, Clock, MapPin } from 'lucide-react';

export default function ContactUs() {
	return (
		<AppLayout>
			<div className="min-h-full bg-[#f1f8e9] font-sans flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
				<div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

				<div className="relative z-10 space-y-8 p-6 max-w-4xl mx-auto pb-32 pt-10">
					<header className="space-y-3">
						<h1 className="font-sans text-5xl font-bold tracking-tight text-green-900 uppercase leading-none">
							Contact Us
						</h1>
						<p className="text-xl text-green-700/70 font-body">
							Get in touch with the Ummy Chat team.
						</p>
					</header>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50">
							<div className="flex items-center gap-6">
								<div className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10">
									<Mail className="h-6 w-6 text-white" />
								</div>
								<div>
									<h2 className="font-bold text-xl uppercase tracking-tight text-green-900">Email Support</h2>
									<p className="text-sm text-green-600 font-bold uppercase tracking-wider">support@ummy.chat</p>
								</div>
							</div>
							<p className="text-gray-600 font-body leading-relaxed">
								Send us an email for any technical issues, account queries, or feedback. We usually respond within 24 hours.
							</p>
						</div>

						<div className="space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50">
							<div className="flex items-center gap-6">
								<div className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10">
									<Clock className="h-6 w-6 text-white" />
								</div>
								<div>
									<h2 className="font-bold text-xl uppercase tracking-tight text-green-900">Operational Hours</h2>
									<p className="text-sm text-green-600 font-bold uppercase tracking-wider">10 AM - 7 PM IST</p>
								</div>
							</div>
							<p className="text-gray-600 font-body leading-relaxed">
								Our support team is active Monday to Saturday. Sunday responses may be delayed.
							</p>
						</div>

						<div className="md:col-span-2 space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50">
							<div className="flex items-center gap-6">
								<div className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10">
									<MapPin className="h-6 w-6 text-white" />
								</div>
								<div>
									<h2 className="font-bold text-xl uppercase tracking-tight text-green-900">Our Location</h2>
									<p className="text-sm text-green-600 font-bold uppercase tracking-wider">Online First Service</p>
								</div>
							</div>
							<p className="text-gray-600 font-body leading-relaxed">
								Ummy Chat is a digital platform serving users globally. For official correspondence, please contact us via email.
							</p>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
