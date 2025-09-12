import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            data-ai-hint="person portrait"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <div className="absolute bottom-2 left-2">
            <h3 className="font-semibold text-white text-sm">{user.name}</h3>
           </div>
        </div>
      </Card>
    </Link>
  );
}
