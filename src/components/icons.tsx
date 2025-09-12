export const UmmyLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={props.color || "hsl(var(--primary))"} />
        <stop offset="100%" stopColor={props.color || "hsl(var(--accent))"} />
      </linearGradient>
    </defs>
    <circle cx="16" cy="17" r="9" fill="hsl(var(--background))" stroke="url(#logo-gradient)" strokeWidth="2"/>
    <circle cx="9.5" cy="9.5" r="4.5" fill="hsl(var(--background))" stroke="url(#logo-gradient)" strokeWidth="2"/>
    <circle cx="22.5" cy="9.5" r="4.5" fill="hsl(var(--background))" stroke="url(#logo-gradient)" strokeWidth="2"/>
    <circle cx="13" cy="16" r="1.5" fill="url(#logo-gradient)"/>
    <circle cx="19" cy="16" r="1.5" fill="url(#logo-gradient)"/>
    <path d="M16 20 a2,2 0 0,0 0,2" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);


export const GameControllerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16.14 8.36a2.5 2.5 0 0 0-3.54 0" />
    <path d="M12 12H4" />
    <path d="M8 8V4" />
    <path d="M8.03 16.03a2.5 2.5 0 0 0 0-3.53" />
    <path d="M16 12h-4" />
    <path d="M12.46 12.46a2.5 2.5 0 0 0 3.53 3.53" />
    <path d="M17.64 17.64a2.5 2.5 0 0 0 0-3.53" />
    <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
  </svg>
);
