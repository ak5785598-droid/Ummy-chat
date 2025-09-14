
import Image from "next/image";
import Link from "next/link";
import { getFreeGames, getPremiumGames } from "@/lib/mock-data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameControllerIcon } from "@/components/icons";
import { Gem } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";

export default function GamesPage() {
  const freeGames = getFreeGames();
  const premiumGames = getPremiumGames();

  const getGameLink = (gameId: string) => {
    switch (gameId) {
      case 'g1':
        return '/games/ludo';
      case 'g2':
        return '/games/carrom';
      default:
        return '#';
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <GameControllerIcon className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Game Center
          </h1>
        </header>
        
        <section className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold">Free to Play</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {freeGames.map((game) => (
              <div key={game.id} className="group block">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                  <Link href={getGameLink(game.id)} className="block">
                    <CardHeader className="p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={game.coverUrl}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          data-ai-hint={game.imageHint}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="font-headline text-lg truncate">{game.title}</CardTitle>
                    </CardContent>
                  </Link>
                  <CardFooter className="p-4 pt-0">
                     <Button asChild className="w-full">
                        <Link href={getGameLink(game.id)}>Play</Link>
                     </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </section>

         <section className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold">Premium Games</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {premiumGames.map((game) => (
              <div key={game.id} className="group block">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                   <Link href="#" className="block">
                    <CardHeader className="p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={game.coverUrl}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          data-ai-hint={game.imageHint}
                        />
                         <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                            <Gem className="h-3 w-3" />
                            <span>{game.cost}</span>
                          </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="font-headline text-lg truncate">{game.title}</CardTitle>
                    </CardContent>
                  </Link>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full">Play Now</Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
