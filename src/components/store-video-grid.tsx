'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from 'reactfire';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Play, Gift, ShoppingCart, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface StoreVideo {
  id: string;
  name: string;
  videoUrl: string;
  price?: number;
  notForSale?: boolean;
  status: 'active' | 'inactive';
  createdAt?: any;
}

interface StoreVideoGridProps {
  onPurchase?: (videoId: string, videoName: string) => void;
  maxColumns?: number;
}

export function StoreVideoGrid({ onPurchase, maxColumns = 3 }: StoreVideoGridProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Query for active videos
  const videosQuery = useMemo(
    () =>
      query(
        collection(firestore, 'storeItems'),
        where('type', '==', 'video'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      ),
    [firestore]
  );

  const { data: videos = [], status } = useCollection(videosQuery);

  const handlePurchase = async (videoId: string, videoName: string) => {
    setPurchasingId(videoId);
    try {
      if (onPurchase) {
        onPurchase(videoId, videoName);
      } else {
        toast({
          title: 'Purchase Initiated',
          description: `Processing purchase for "${videoName}"...`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description: 'Unable to complete purchase',
      });
    } finally {
      setPurchasingId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Play className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
          <p className="text-gray-400">No videos available</p>
        </div>
      </div>
    );
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[maxColumns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="w-full">
      <div className={`grid ${gridColsClass} gap-4`}>
        {videos.map((video: StoreVideo) => (
          <div
            key={video.id}
            className="rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
          >
            {/* Video Preview */}
            <div className="relative w-full h-48 bg-black overflow-hidden group">
              <video
                src={video.videoUrl}
                className="w-full h-full object-cover"
                preload="metadata"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-purple-600 rounded-full p-4">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              {/* Status Badge */}
              {video.notForSale && (
                <div className="absolute top-2 right-2 bg-yellow-500/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  <span className="text-xs font-semibold">Promo</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="font-bold text-white text-sm mb-3 line-clamp-2">{video.name}</h3>

              {/* Price Info */}
              <div className="mb-4">
                {video.notForSale ? (
                  <div className="inline-block bg-yellow-500/20 text-yellow-300 text-xs font-semibold px-3 py-1 rounded-full">
                    🎁 Free - Promotional
                  </div>
                ) : (
                  <div className="inline-block text-blue-400 text-sm font-bold">
                    {video.price || 0} 💎 Coins
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePurchase(video.id, video.name)}
                disabled={purchasingId === video.id}
                className={`
                  w-full py-2 px-3 rounded-lg font-bold text-sm transition-all duration-200
                  active:scale-95 flex items-center justify-center gap-2
                  ${
                    video.notForSale
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  }
                  ${purchasingId === video.id ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {purchasingId === video.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {video.notForSale ? '▶️ Watch Now' : <ShoppingCart className="w-4 h-4" />}
                    {video.notForSale ? 'Watch' : 'Purchase'}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
