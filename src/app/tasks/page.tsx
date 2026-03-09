'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * High-Fidelity Task Center Dimension.
 * Re-engineered to handle the comprehensive 18-task tribal roster.
 */
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

  const dailyTasks = useMemo(() => getDailyTasks(), []);
  const achievementTasks = useMemo(() => getAchievementTasks(), []);

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
      <div className="space-y-8 max-w-5xl mx-auto p-4 animate-in fade-in duration-700 font-headline pb-32">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20">
               <ClipboardList className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Task Center
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-lg italic px-1">Complete tribal duties to earn Gold and prestige.</p>
        </header>

        {/* Daily Attendance Grid */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <CalendarCheck className="h-6 w-6 text-orange-500" />
                  <CardTitle className="text-2xl uppercase italic">Daily Attendance</CardTitle>
               </div>
               <Badge variant="outline" className="border-orange-200 text-orange-600 font-black italic">7-Day Streak</Badge>
            </div>
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
                "w-full h-16 rounded-3xl text-xl font-black uppercase italic shadow-xl transition-all",
                isCheckedIn ? "bg-green-500 hover:bg-green-500 cursor-default" : "bg-primary hover:scale-[1.02] shadow-primary/20"
              )}
            >
              {isSigningIn ? <Loader className="animate-spin mr-2 h-6 w-6" /> : isCheckedIn ? <CheckCircle className="mr-2 h-6 w-6" /> : <CalendarCheck className="mr-2 h-6 w-6" />}
              {isCheckedIn ? 'Checked In Today' : 'Claim Daily Reward'}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-primary" /> Daily Tasks
            </h2>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Resets in 12h</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dailyTasks.map((task) => (
              <Card key={task.id} className={cn("rounded-[2rem] border-none shadow-sm transition-all", task.isCompleted ? 'bg-secondary/20 opacity-80' : 'bg-white hover:shadow-md')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg uppercase italic tracking-tight">{task.title}</CardTitle>
                  <CardDescription className="text-xs font-body italic min-h-[32px]">{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-primary font-black italic">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span>+{task.coinReward.toLocaleString()}</span>
                  </div>
                  {task.isCompleted ? (
                    <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase italic">
                      <CheckCircle className="h-4 w-4" /> Done
                    </div>
                  ) : (
                    <Button asChild size="sm" className="rounded-full px-6 font-black uppercase italic text-[10px] h-8 shadow-md">
                      <Link href={task.cta.href}>{task.cta.label}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Achievement Tasks Section */}
        <section className="space-y-4 pb-20">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-2">
               <Trophy className="h-5 w-5 text-yellow-500" /> Achievement Duties
            </h2>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Permanent Ledger</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {achievementTasks.map((task) => (
              <Card key={task.id} className={cn("rounded-[2rem] border-none shadow-sm transition-all", task.isCompleted ? 'bg-secondary/20 opacity-80' : 'bg-white hover:shadow-md')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg uppercase italic tracking-tight">{task.title}</CardTitle>
                  <CardDescription className="text-xs font-body italic">{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-primary font-black italic">
                    <GoldCoinIcon className="h-5 w-5" />
                    <span className="text-lg">+{task.coinReward.toLocaleString()}</span>
                  </div>
                  {task.isCompleted ? (
                    <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase italic">
                      <CheckCircle className="h-5 w-5" /> Achieved
                    </div>
                  ) : (
                    <Button asChild className="rounded-full px-8 font-black uppercase italic text-xs h-10 shadow-lg">
                      <Link href={task.cta.href}>{task.cta.label}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
