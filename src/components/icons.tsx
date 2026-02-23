export const UmmyLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <defs>
            <linearGradient id="smileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF" />
                <stop offset="100%" stopColor="#D4E100" />
            </linearGradient>
        </defs>
        {/* Stylized Yari Face Icon */}
        <circle cx="50" cy="50" r="45" fill="currentColor" />
        <path d="M30 45 Q30 35 35 35 Q40 35 40 45" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 45 Q60 35 65 35 Q70 35 70 45" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 65 Q50 85 70 65" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
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
