
'use client';

import { useState } from 'react';
import {
  Youtube,
  Clapperboard,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/app-layout';

export default function WatchPage() {
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleUrlSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get('youtube_url') as string;
    
    if (url) {
        try {
            const urlObj = new URL(url);
            let extractedId = '';
            if (urlObj.hostname === 'youtu.be') {
                extractedId = urlObj.pathname.slice(1);
            } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
                extractedId = urlObj.searchParams.get('v') || '';
            }
            
            if (extractedId) {
                setVideoId(extractedId);
            } else {
                alert('Invalid YouTube URL. Please use a valid video URL.');
            }
        } catch (error) {
            alert('Invalid URL format.');
        }
    }
  };

  const videoEmbedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
    : null;

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <Youtube className="h-8 w-8 text-red-500" />
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Watch Party
          </h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Watch a YouTube Video
            </CardTitle>
            <CardDescription>
              Paste a YouTube video URL below to start watching.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <Input
                type="url"
                name="youtube_url"
                placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="flex-1"
              />
              <Button type="submit">Play</Button>
            </form>

            {videoEmbedUrl ? (
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full rounded-lg"
                  src={videoEmbedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
               <Alert className="bg-secondary">
                  <Clapperboard className="h-4 w-4" />
                  <AlertTitle>Start a Watch Party!</AlertTitle>
                  <AlertDescription>
                    Paste a YouTube video URL above to begin.
                  </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
