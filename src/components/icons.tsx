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
