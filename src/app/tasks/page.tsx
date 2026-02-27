'use client';

import { useState, useEffect } from 'react';
import { getDailyTasks, getAchievementTasks } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  CheckCircle, 
  Sparkles, 
  Trophy, 
  Star, 
  CalendarCheck, 
  Loader,
  Award,
  Bike,
  Image as ImageIcon,
  Rocket
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    if (userProfile) {
      const lastSignIn = userProfile.lastSignInAt?.toDate();
      const today = new Date();
      const alreadySignedIn = lastSignIn && 
        lastSignIn.getDate() === today.getDate() && 
        lastSignIn.getMonth() === today.getMonth() && 
        lastSignIn.getFullYear() === today.getFullYear();
      setIsCheckedIn(!!alreadySignedIn);
    }
  }, [userProfile]);

  const handleSignIn = async () => {
    if (!user || !firestore || !userProfile || isCheckedIn) return;
    setIsSigningIn(true);

    try {
      const rewardAmount = 5000;
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      const updateData = {
        'wallet.coins': increment(rewardAmount),
        'lastSignInAt': serverTimestamp(),
        'updatedAt': serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);

      toast({
        title: 'Check-In Successful!',
        description: `Synced ${rewardAmount.toLocaleString()} Gold Coins to your vault.`,
      });
      setIsCheckedIn(true);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Check-In Failed', description: e.message });
    } finally {
      setIsSigningIn(false);
    }
  };

  const dailyTasks = getDailyTasks();
  const achievementTasks = getAchievementTasks();

  const completedDailyCount = dailyTasks.filter(t => t.isCompleted).length;
  const dailyProgress = (completedDailyCount / dailyTasks.length) * 100;

  const AttendanceCard = ({ day, amount, label, icon: Icon, isBig = false }: any) => (
    <div className={cn(
      "relative p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all bg-white shadow-sm",
      day === 1 && !isCheckedIn ? "border-primary bg-primary/5" : "border-gray-100",
      isBig ? "col-span-2 sm:col-span-1 bg-orange-50 border-orange-100" : ""
    )}>
      <span className="text-[8px] font-black uppercase text-muted-foreground">Day {day}</span>
      <div className="py-2">
        {Icon ? <Icon className={cn("h-6 w-6", isBig ? "text-orange-500" : "text-blue-400")} /> : <GoldCoinIcon className="h-6 w-6" />}
      </div>
      <div className="flex items-center gap-1">
        {!Icon && <GoldCoinIcon className="h-2.5 w-2.5" />}
        <span className="text-[10px] font-bold text-gray-700">{amount || label}</span>
      </div>
      {day === 1 && isCheckedIn && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl backdrop-blur-[1px]">
          <CheckCircle className="h-6 w-6 text-green-500 fill-white" />
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto p-4 animate-in fade-in duration-700">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter">
              Task Center
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-lg italic">Complete tribal duties to earn Gold and prestige.</p>
        </header>

        {/* Daily Attendance Grid */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <CalendarCheck className="h-6 w-6 text-orange-500" />
                  <CardTitle className="font-headline text-2xl uppercase italic">Daily Attendance</CardTitle>
               </div>
               <Badge variant="outline" className="border-orange-200 text-orange-600 font-black italic">7-Day Streak</Badge>
            </div>
            <CardDescription className="font-body text-base">Sign in daily to grow your tribe wealth frequency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              <AttendanceCard day={1} amount="5000" />
              <AttendanceCard day={2} amount="5000" />
              <AttendanceCard day={3} label="x1 Day" icon={Award} />
              <AttendanceCard day={4} amount="10000" />
              <AttendanceCard day={5} label="x1 Day" icon={Bike} />
              <AttendanceCard day={6} label="x3 Days" icon={ImageIcon} />
              <AttendanceCard day={7} isBig label="Elite" icon={Rocket} />
            </div>
            
            <Button 
              onClick={handleSignIn}
              disabled={isSigningIn || isCheckedIn || isProfileLoading}
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-black uppercase italic shadow-lg transition-all",
                isCheckedIn ? "bg-green-500 hover:bg-green-500 cursor-default" : "bg-primary hover:scale-[1.02]"
              )}
            >
              {isSigningIn ? <Loader className="animate-spin mr-2 h-5 w-5" /> : isCheckedIn ? <CheckCircle className="mr-2 h-5 w-5" /> : <CalendarCheck className="mr-2 h-5 w-5" />}
              {isCheckedIn ? 'Checked In Today' : 'Claim Daily Reward'}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Progress Overview */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Daily Progress
                </h3>
                <p className="text-sm text-muted-foreground font-body italic">Complete all tribal duties to unlock the 500 Coin Chest.</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-black uppercase italic tracking-widest text-primary/60">
                    <span>{completedDailyCount} / {dailyTasks.length} Completed</span>
                    <span>{Math.round(dailyProgress)}%</span>
                  </div>
                  <Progress value={dailyProgress} className="h-3 bg-white/20" />
                </div>
              </div>
              <Button disabled={dailyProgress < 100} className="rounded-full px-10 h-12 shadow-xl font-black uppercase italic tracking-widest text-xs">
                Claim Chest
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-headline text-2xl font-black uppercase italic flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-primary" /> Daily Tasks
            </h2>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Resets in 12h 45m</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dailyTasks.map((task) => (
              <Card key={task.id} className={cn("rounded-[2rem] border-none shadow-sm transition-all", task.isCompleted ? 'bg-secondary/20 opacity-80' : 'hover:shadow-md hover:-translate-y-1 bg-white')}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg uppercase italic tracking-tight">{task.title}</CardTitle>
                  <CardDescription className="text-xs font-body italic">{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary font-black italic">
                          <GoldCoinIcon className="h-4 w-4" />
                          <span>+{task.coinReward}</span>
                      </div>
                      {task.isCompleted ? (
                          <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase italic">
                             <CheckCircle className="h-4 w-4" />
                              Done
                          </div>
                      ) : (
                          <Button asChild size="sm" className="rounded-full px-6 font-black uppercase italic text-[10px]">
                              <Link href={task.cta.href}>{task.cta.label}</Link>
                          </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline text-2xl font-black uppercase italic flex items-center gap-2 px-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Achievements
          </h2>
          <div className="grid gap-4 md:grid-cols-2 pb-20">
            {achievementTasks.map((task) => (
              <Card key={task.id} className={cn("rounded-[2rem] border-none shadow-sm", task.isCompleted ? 'bg-secondary/20' : 'hover:shadow-md bg-white')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-headline text-lg font-black uppercase italic">{task.title}</h3>
                      <p className="text-sm text-muted-foreground font-body italic">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-primary font-black italic bg-primary/10 px-3 py-1 rounded-full text-xs">
                            <GoldCoinIcon className="h-3 w-3" />
                            <span>+{task.coinReward} Coins</span>
                        </div>
                      </div>
                    </div>
                    {task.isCompleted ? (
                        <Button disabled variant="outline" className="gap-2 rounded-full font-black uppercase italic text-[10px]">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Claimed
                        </Button>
                    ) : (
                        <Button asChild className="rounded-full font-black uppercase italic text-[10px] px-8">
                            <Link href={task.cta.href}>{task.cta.label}</Link>
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
