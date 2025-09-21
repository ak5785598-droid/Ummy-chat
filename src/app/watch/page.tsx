
'use client';

import { useState, useTransition } from 'react';
import {
  Youtube,
  Clapperboard,
  PlaySquare,
  AlertTriangle,
  Loader2,
  Search,
} from 'lucide-react';
import Image from 'next/image';
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
import { searchVideosAction } from '@/actions/get-videos';
import type { VideoSearchResult } from '@/ai/flows/youtube-video-search';

export default function WatchPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<VideoSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSearchResults([]);
    setSelectedVideoId(null);
    const formData = new FormData(event.currentTarget);
    const query = formData.get('query') as string;

    if (!query) {
      setError('Please enter a search term.');
      return;
    }

    startTransition(async () => {
      const result = await searchVideosAction(query);

      if (result.success) {
        setSearchResults(result.data);
        if (result.data.length === 0) {
            setError('No videos found. Try a different search term.')
        }
      } else {
        setError(result.error);
      }
    });
  };

  const videoEmbedUrl = selectedVideoId
    ? `https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`
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
              Search YouTube Videos
            </CardTitle>
            <CardDescription>
              Enter a song or video name to search YouTube and watch it with
              your friends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                name="query"
                placeholder="e.g., 'latest movie trailers' or 'lofi hip hop radio'"
                className="flex-1"
                disabled={isPending}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Search />
                )}
                <span className="sr-only md:not-sr-only ml-2">Search</span>
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
              !isPending && searchResults.length === 0 && (
                <Alert className="bg-secondary">
                  <Clapperboard className="h-4 w-4" />
                  <AlertTitle>Start a Watch Party!</AlertTitle>
                  <AlertDescription>
                    Search for a YouTube video to begin. <br />
                    <span className='font-bold mt-2 block'>Note: This feature requires a YouTube API key. Please add your key to a `.env.local` file as `YOUTUBE_API_KEY=your_key_here`.</span>
                  </AlertDescription>
                </Alert>
              )
            )}
            
            {isPending && (
                <div className='flex justify-center items-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            )}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((video) => (
                  <Card
                    key={video.videoId}
                    className="cursor-pointer overflow-hidden transition-all hover:shadow-md hover:-translate-y-1"
                    onClick={() => {
                        setSelectedVideoId(video.videoId)
                        setSearchResults([])
                    }}
                  >
                    <div className="relative aspect-video w-full">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base font-medium line-clamp-2">
                        {video.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
