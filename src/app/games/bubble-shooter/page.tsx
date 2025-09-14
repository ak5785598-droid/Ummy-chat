
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { GameControllerIcon } from '@/components/icons';

export default function BubbleShooterGamePage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <GameControllerIcon className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Bubble Shooter
          </h1>
        </header>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="aspect-video w-full">
              <iframe
                src="https://playpager.com/embed/bubbleshooter/index.html"
                className="h-full w-full rounded-md border-0"
                allowFullScreen
              ></iframe>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
