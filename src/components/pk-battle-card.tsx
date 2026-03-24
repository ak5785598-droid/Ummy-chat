import Link from 'next/link';
import { Swords, Zap } from 'lucide-react';
import type { PkBattle } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from './ui/button';

interface PkBattleCardProps {
 battle: PkBattle;
}

export function PkBattleCard({ battle }: PkBattleCardProps) {
 const { room1, room2, score1, score2 } = battle;
 const totalScore = (score1 + score2) || 1;
 const progress1 = (score1 / totalScore) * 100;
 
 const host1 = room1.participants[0];
 const host2 = room2.participants[0];

 return (
  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <CardContent className="p-4 relative">
      <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
        <Zap className="h-3 w-3" />
        LIVE PK
      </div>
      <div className="flex justify-between items-center gap-2">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <Link href={`/profile/${host1.uid}`}>
            <Avatar className="h-16 w-16 border-2 border-blue-500">
              <AvatarImage src={host1.avatarUrl} alt={host1.name + "'s PK Avatar"} />
              <AvatarFallback>{host1.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/rooms/${room1.slug}`}>
            <span className="font-semibold text-sm truncate text-center block hover:underline">{room1.title}</span>
          </Link>
        </div>

        <div className="flex-shrink-0">
          <Swords className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="flex flex-col items-center gap-2 w-1/3">
          <Link href={`/profile/${host2.uid}`}>
            <Avatar className="h-16 w-16 border-2 border-red-500">
              <AvatarImage src={host2.avatarUrl} alt={host2.name + "'s Opponent PK Avatar"} />
              <AvatarFallback>{host2.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/rooms/${room2.slug}`}>
             <span className="font-semibold text-sm truncate text-center block hover:underline">{room2.title}</span>
          </Link>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>{score1.toLocaleString()}</span>
          <span>{score2.toLocaleString()}</span>
        </div>
        <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
          <Progress value={progress1} className="h-2 [&>div]:bg-blue-500" />
          <div className="absolute top-0 right-0 h-full bg-red-500" style={{width: `${100-progress1}%`}}></div>
        </div>
      </div>
       <Button className="w-full mt-4" variant="secondary">Watch Battle</Button>
    </CardContent>
  </Card>
 );
}
