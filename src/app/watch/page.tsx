
'use client';

import { useState, useTransition } from 'react';
import { Youtube, Loader, AlertTriangle, Search, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/app-layout';
import { searchVideosAction, type VideoSearchResult } from '@/actions/get-videos';
import Image from 'next/image';

export default function WatchPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoSearchResult[]>([]);

  const handleSearchClick = () => {
    if (!inputValue) return;
    setError(null);
    setVideos([]);
    setVideoUrl('');

    startTransition(async () => {
      const result = await searchVideosAction(inputValue);
      if (result.success && result.data) {
        setVideos(result.data);
      } else {
        setError(result.error || 'Failed to search for videos.');
      }
    });
  };

  const handleSelectVideo = (videoId: string) => {
    setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
    setVideos([]);
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
            <CardDescription>Search for a YouTube video to watch with your friends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for a YouTube video by name..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                className="flex-1"
                disabled={isPending}
              />
              <Button onClick={handleSearchClick} disabled={isPending}>
                {isPending ? (
                  <Loader className="animate-spin" />
                ) : (
                  <Search />
                )}
                <span className="sr-only md:not-sr-only ml-2">Search</span>
              </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Search Failed</AlertTitle>
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
            ) : videos.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map(video => (
                        <Card key={video.videoId} className="overflow-hidden cursor-pointer group" onClick={() => handleSelectVideo(video.videoId)}>
                           <CardContent className="p-0">
                             <div className="relative aspect-video">
                                <Image 
                                    src={video.thumbnailUrl} 
                                    alt={video.title}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                             </div>
                             <div className="p-4">
                                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                             </div>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            ) : !isPending && (
                <Alert className="bg-secondary">
                  <Clapperboard className="h-4 w-4" />
                  <AlertTitle>Start a Watch Party!</AlertTitle>
                  <AlertDescription>
                    Search for a YouTube video above to begin.
                  </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
