
'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader, Zap, ArrowRight, UserCheck, Heart } from 'lucide-react';
import { findVibeMatchAction } from '@/actions/find-vibe-match';
import { useUser, useUserProfile } from '@/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * AI Vibe Match Page.
 * Uses Genkit to find the perfect user or room based on the user's interests.
 */
export default function MatchPage() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const handleStartMatching = async () => {
    if (!userProfile) return;
    setIsMatching(true);
    setMatchResult(null);

    try {
      const result = await findVibeMatchAction({
        interests: userProfile.bio || 'Connecting with new people',
        mood: 'Excited and curious',
      });
      if (result.success) {
        setMatchResult(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary border border-primary/20">
              <Zap className="h-4 w-4" /> AI Powered
           </div>
           <h1 className="font-headline text-5xl font-black italic uppercase tracking-tighter text-foreground drop-shadow-sm">
             Vibe Matcher
           </h1>
           <p className="text-muted-foreground text-lg font-body max-w-lg mx-auto">
             Our neural engine analyzes your tribe's interests to find your perfect frequency. No more scrolling, just vibing.
           </p>
        </header>

        {!matchResult ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
             <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all animate-pulse" />
                <Button 
                   onClick={handleStartMatching} 
                   disabled={isMatching}
                   className="relative h-48 w-48 rounded-full text-2xl font-black uppercase italic shadow-[0_0_50px_rgba(255,107,107,0.3)] hover:scale-105 transition-transform"
                >
                  {isMatching ? <Loader className="h-12 w-12 animate-spin" /> : 'Match Now'}
                </Button>
             </div>
             <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold">Press to initiate scan</p>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <Card className="border-none shadow-2xl bg-gradient-to-br from-[#1a1a2e] to-black overflow-hidden">
               <CardHeader className="text-center border-b border-white/5 pb-8">
                  <div className="flex justify-center mb-4">
                     <Badge className="bg-green-500 text-white shadow-lg animate-bounce">100% MATCH FOUND</Badge>
                  </div>
                  <CardTitle className="text-4xl font-black font-headline text-white uppercase italic tracking-tighter">
                    {matchResult.type === 'Room' ? matchResult.roomName : matchResult.userName}
                  </CardTitle>
                  <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">
                     Tribe: {matchResult.vibeTag}
                  </CardDescription>
               </CardHeader>
               <CardContent className="p-12">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                     <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                        <Avatar className="h-40 w-40 border-4 border-primary shadow-2xl relative z-10">
                           <AvatarImage src={`https://picsum.photos/seed/${matchResult.id}/400`} />
                           <AvatarFallback>UM</AvatarFallback>
                        </Avatar>
                     </div>
                     <div className="flex-1 space-y-6 text-center md:text-left text-white">
                        <p className="text-xl font-body italic text-white/80 leading-relaxed">
                          "{matchResult.reasoning}"
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                           {matchResult.commonInterests.map((interest: string) => (
                              <Badge key={interest} variant="secondary" className="bg-white/5 text-white/60 border-white/10">
                                 # {interest}
                              </Badge>
                           ))}
                        </div>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                           <Button asChild size="lg" className="rounded-full px-12 font-black uppercase italic shadow-xl shadow-primary/20 group">
                              <Link href={matchResult.type === 'Room' ? `/rooms/${matchResult.id}` : `/profile/${matchResult.id}`}>
                                 {matchResult.type === 'Room' ? 'Join the Vibe' : 'Visit Profile'}
                                 <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                              </Link>
                           </Button>
                           <Button onClick={() => setMatchResult(null)} variant="outline" size="lg" className="rounded-full border-white/10 text-white/40 hover:text-white hover:bg-white/5">
                              Keep Searching
                           </Button>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
           <div className="p-6 bg-secondary/20 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Neural Match</h3>
              <p className="text-xs text-muted-foreground">Matches based on interests, bio keywords, and historical vibe interaction.</p>
           </div>
           <div className="p-6 bg-secondary/20 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Real-Time Safe</h3>
              <p className="text-xs text-muted-foreground">Only matches you with users who are currently online and verified by the official hub.</p>
           </div>
           <div className="p-6 bg-secondary/20 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Dynamic Pulse</h3>
              <p className="text-xs text-muted-foreground">The matching engine learns your preferences over time to improve accuracy.</p>
           </div>
        </section>
      </div>
    </AppLayout>
  );
}
