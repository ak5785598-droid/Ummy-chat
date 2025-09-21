
'use client';

import { useState } from 'react';
import { Youtube, Clapperboard, PlaySquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/app-layout';

export default function WatchPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getYouTubeVideoId = (url: string) => {
    setError(null);
    let videoId = null;
    try {
      const urlObject = new URL(url);
      const hostname = urlObject.hostname;
      if (hostname.includes('youtube.com')) {
        videoId = urlObject.searchParams.get('v');
      } else if (hostname.includes('youtu.be')) {
        videoId = urlObject.pathname.slice(1);
      }
      if (!videoId) {
        throw new Error();
      }
      return videoId;
    } catch (e) {
      setError('Invalid YouTube URL. Please enter a valid video link.');
      return null;
    }
  };

  const handleWatchClick = () => {
    if (!inputValue) {
      setError('Please enter a YouTube URL.');
      return;
    }
    const videoId = getYouTubeVideoId(inputValue);
    if (videoId) {
      setVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
    } else {
      setVideoUrl('');
    }
  };

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
            <CardTitle className="font-headline">Watch a YouTube Video</CardTitle>
            <CardDescription>Paste a YouTube video URL below to watch it with your friends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter a YouTube video URL..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWatchClick()}
                className="flex-1"
              />
              <Button onClick={handleWatchClick}>
                <PlaySquare />
                <span className="sr-only md:not-sr-only ml-2">Watch</span>
              </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Invalid URL</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {videoUrl ? (
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full rounded-lg"
                  src={videoUrl}
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
                    Paste a YouTube video link above to begin.
                  </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
