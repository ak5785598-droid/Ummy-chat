import Image from "next/image";
import Link from "next/link";
import { getFreeGames, getPremiumGames } from "@/lib/mock-data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameControllerIcon } from "@/components/icons";
import { Gem, Play, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";

export default function GamesPage() {
  const freeGames = getFreeGames();
  const premiumGames = getPremiumGames();
  
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
        
        {/* Featured Full-Screen Experience */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <Link href="/games/ludo" className="block group">
              <div className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                 <Image 
                   src="https://picsum.photos/seed/ludo-pro/1200/600" 
                   alt="Ludo Pro" 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-1000"
                   data-ai-hint="ludo board"
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-12 space-y-4">
                    <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-primary/30">
                       <Sparkles className="h-4 w-4 text-primary" />
                       <span className="text-xs font-black uppercase text-primary italic">Top Choice</span>
                    </div>
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Ludo Masters</h2>
                    <p className="text-white/60 max-w-md font-body text-lg">Full-screen immersive gameplay with live voice frequency enabled.</p>
                    <div className="pt-4">
                       <Button size="lg" className="rounded-full px-10 font-black uppercase italic shadow-xl shadow-primary/20">
                          <Play className="mr-2 h-5 w-5 fill-current" /> Play Now
                       </Button>
                    </div>
                 </div>
              </div>
           </Link>
        </section>

        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-black uppercase italic tracking-widest text-gray-400">Casual Classics</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {freeGames.map((game) => (
              <div key={game.id} className="group block">
                <Card className="overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 bg-white border-none rounded-[2rem] shadow-lg">
                  <Link href={`/games/${game.slug}`} className="block">
                    <CardHeader className="p-0">
                      <div className="relative aspect-square w-full">
                        <Image
                          src={game.coverUrl}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          data-ai-hint={game.imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                           <p className="text-white font-black uppercase italic text-sm">Launch Game</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <CardTitle className="font-headline text-lg uppercase italic font-black truncate">{game.title}</CardTitle>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Multiplayer Enabled</p>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
