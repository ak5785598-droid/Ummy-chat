import Image from "next/image";
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Logo() {
  const logo = PlaceHolderImages.find(img => img.id === 'ummy-official-logo');
  const src = logo?.imageUrl || "https://storage.googleapis.com/fetch-and-generate-images/ummy-logo-v3.png";
  
  return (
    <div className="flex flex-col items-center">
      <Image
        src={src}
        alt="Ummy Logo"
        width={140}
        height={140}
        unoptimized
        priority
        data-ai-hint="cute mascot"
      />
    </div>
  );
}
