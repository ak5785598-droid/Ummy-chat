import { Crown } from 'lucide-react';
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';

interface TopContributorsCardProps {
 contributors: { user: User; amount: number }[];
}

export function TopContributorsCard({
 contributors,
}: TopContributorsCardProps) {
 const topThree = contributors.slice(0, 3);
 const others = contributors.slice(3);

 const getRankColor = (rank: number) => {
  if (rank === 0) return 'text-yellow-400';
  if (rank === 1) return 'text-gray-400';
  if (rank === 2) return 'text-amber-600';
  return 'text-muted-foreground';
 };

 return (
  <Card>
   <CardHeader>
    <CardTitle className="font-sans">Top Contributors</CardTitle>
    <CardDescription>Users who sent the most gifts.</CardDescription>
   </CardHeader>
   <CardContent className="space-y-4">
    <div className="flex justify-around items-end space-x-2">
     {topThree.map((c, i) => (
      <div
       key={c.user.id}
       className={`flex flex-col items-center ${
        i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'
       }`}
      >
       <div className="relative">
        <Avatar
         className={`h-20 w-20 border-4 ${
          i === 0
           ? 'border-yellow-400'
           : i === 1
           ? 'border-gray-400'
           : 'border-amber-600'
         } ${i === 0 ? 'h-24 w-24' : ''}`}
        >
         <AvatarImage
          src={c.user.avatarUrl}
          alt={c.user.name + "'s Contributor Avatar"}
          data-ai-hint="person portrait"
         />
          <AvatarFallback>{(c.user.name || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        {i === 0 && (
         <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-400 transform -rotate-12" />
        )}
       </div>
       <p className="font-bold mt-2 truncate max-w-[6rem]">{c.user.name}</p>
       <p className="text-xs text-muted-foreground">
        {c.amount.toLocaleString()}
       </p>
      </div>
     ))}
    </div>

    <div className="space-y-2 pt-4">
     {others.map((c, i) => (
      <div key={c.user.id} className="flex items-center gap-4 text-sm">
       <span className={`w-6 text-center font-bold ${getRankColor(i + 3)}`}>{i + 4}</span>
       <Avatar className="h-10 w-10">
        <AvatarImage src={c.user.avatarUrl} alt={c.user.name + "'s Ranking Avatar"} data-ai-hint="person portrait" />
        <AvatarFallback>{(c.user.name || 'U').charAt(0)}</AvatarFallback>
       </Avatar>
       <div className="flex-1">
        <p className="font-semibold">{c.user.name}</p>
        <p className="text-xs text-muted-foreground">
         ID: {c.user.accountNumber || c.user.id}
        </p>
       </div>
       <p className="font-mono text-xs text-muted-foreground">
        {c.amount.toLocaleString()}
       </p>
      </div>
     ))}
    </div>
   </CardContent>
  </Card>
 );
}
