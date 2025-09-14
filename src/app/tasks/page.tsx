import { getDailyTasks, getAchievementTasks } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Gem, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

export default function TasksPage() {
  const dailyTasks = getDailyTasks();
  const achievementTasks = getAchievementTasks();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Task Center
          </h1>
        </header>
        
        <section className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold">Daily Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dailyTasks.map((task) => (
              <Card key={task.id} className={task.isCompleted ? 'bg-secondary/50' : ''}>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold">
                          <Gem className="h-5 w-5" />
                          <span>+{task.coinReward} Coins</span>
                      </div>
                      {task.isCompleted ? (
                          <Button disabled variant="secondary" className="gap-2">
                             <CheckCircle className="h-4 w-4" />
                              Completed
                          </Button>
                      ) : (
                          <Button asChild>
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
          <h2 className="font-headline text-2xl font-semibold">Achievements</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {achievementTasks.map((task) => (
              <Card key={task.id} className={task.isCompleted ? 'bg-secondary/50' : ''}>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold">
                          <Gem className="h-5 w-5" />
                          <span>+{task.coinReward} Coins</span>
                      </div>
                       {task.isCompleted ? (
                          <Button disabled variant="secondary" className="gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Claimed
                          </Button>
                      ) : (
                          <Button asChild>
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
