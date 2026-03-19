import Image from "next/image";
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Logo() {
  const logo = PlaceHolderImages.find(img => img.id === 'ummy-official-logo');
  
  return (
    <div className="flex flex-col items-center">
      <Image
        src={logo?.imageUrl || "https://storage.googleapis.com/fetch-and-generate-images/ummy-logo-v3.png"}
        alt="Ummy Logo"
        width={140}
        height={140}
        unoptimized
        data-ai-hint="cute mascot"
      />
    </div>
  );
}
