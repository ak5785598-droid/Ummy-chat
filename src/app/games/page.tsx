import Image from "next/image";
import Link from "next/link";
import { getFreeGames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { GameControllerIcon } from "@/components/icons";
import { Play, Sparkles, Construction, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";

export default function GamesPage() {
  const games = getFreeGames();
  
  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto p-4 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
               <GameControllerIcon className="h-8 w-8 text-white" />
            </div>
            <div>
               <h1 className="font-headline text-4xl font-bold tracking-tighter uppercase italic">
                 Tribe Game Zone
               </h1>
               <p className="text-muted-foreground font-body">Play with your frequency members in real-time.</p>
            </div>
          </div>
        </header>
        
        {games.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Fruit Party Feature */}
             <Link href="/games/fruit-party" className="block group">
                <div className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                   <Image 
                     src="https://picsum.photos/seed/fruit-party/1200/600" 
                     alt="Fruit Party" 
                     fill 
                     className="object-cover group-hover:scale-105 transition-transform duration-1000"
                     data-ai-hint="vibrant fruits"
                   />
                   <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 via-transparent to-transparent flex flex-col justify-center px-12 space-y-2">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/30">
                         <Zap className="h-4 w-4 text-white" />
                         <span className="text-xs font-black uppercase text-white italic">Coin Party</span>
                      </div>
                      <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Fruit Party</h2>
                      <p className="text-white/80 max-w-xs font-body text-sm">Bet on the luck of the fruit wheel. 10s rapid rounds!</p>
                      <div className="pt-2">
                         <Button size="lg" className="rounded-full px-10 font-black uppercase italic bg-white text-orange-600 hover:bg-white/90">
                            <Play className="mr-2 h-5 w-5 fill-current" /> Join Party
                         </Button>
                      </div>
                   </div>
                </div>
             </Link>

             {/* Ludo Masters Feature */}
             <Link href="/games/ludo" className="block group">
                <div className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                   <Image 
                     src="https://picsum.photos/seed/ludo-pro/1200/600" 
                     alt="Ludo Masters" 
                     fill 
                     className="object-cover group-hover:scale-105 transition-transform duration-1000"
                     data-ai-hint="ludo board"
                   />
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-transparent to-transparent flex flex-col justify-center px-12 space-y-2">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/30">
                         <Sparkles className="h-4 w-4 text-white" />
                         <span className="text-xs font-black uppercase text-white italic">Live Multiplayer</span>
                      </div>
                      <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Ludo Master</h2>
                      <p className="text-white/80 max-w-xs font-body text-sm">Classic tribe board game with full voice sync.</p>
                      <div className="pt-2">
                         <Button size="lg" className="rounded-full px-10 font-black uppercase italic bg-white text-blue-600 hover:bg-white/90">
                            <Play className="mr-2 h-5 w-5 fill-current" /> Launch Ludo
                         </Button>
                      </div>
                   </div>
                </div>
             </Link>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-4 opacity-40">
             <Construction className="h-16 w-16" />
             <p className="font-black uppercase italic text-xl">New Frequencies Loading...</p>
          </div>
        )}

        <section className="pt-12 border-t">
           <div className="bg-secondary/20 p-8 rounded-[2rem] border border-dashed border-gray-200">
              <h3 className="font-black uppercase italic text-gray-400 text-sm tracking-widest mb-2">Notice</h3>
              <p className="text-xs text-muted-foreground font-body">Only commanded real-time games are available in this production zone. All prototype placeholders have been removed for system integrity.</p>
           </div>
        </section>
      </div>
    </AppLayout>
  );
}
