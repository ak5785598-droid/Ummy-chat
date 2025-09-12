export const DilseyLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={props.color || "hsl(var(--primary))"} />
        <stop offset="100%" stopColor={props.color || "hsl(var(--accent))"} />
      </linearGradient>
    </defs>
    <path d="M27 15C27 20.523 22.023 25 16 25C14.739 25 13.524 24.814 12.4 24.472L7 27L8.528 21.6C6.186 19.476 5 17.361 5 15C5 9.477 9.477 5 15 5C20.523 5 27 9.477 27 15Z" fill="hsl(var(--background))" stroke={props.color || "url(#logo-gradient)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.8284 15.3995C20.0000 14.2279 20.0000 12.4141 18.8284 11.2426C17.6569 10.0711 15.8431 10.0711 14.6716 11.2426C13.5000 12.4141 13.5000 14.2279 14.6716 15.3995L16.2500 17.0000L18.8284 15.3995Z" fill={props.color || "url(#logo-gradient)"}/>
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
