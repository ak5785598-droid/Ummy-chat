import { DilseyLogoIcon } from "@/components/icons";

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="Vibe Home">
      <DilseyLogoIcon className="h-7 w-7"/>
      <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
        Vibe
      </span>
    </div>
  );
}
