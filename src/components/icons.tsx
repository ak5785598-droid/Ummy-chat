export const UmmyLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
    width="32"
    height="32"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <radialGradient
        id="heart-gradient"
        cx="0.5"
        cy="0.5"
        r="0.5"
        fx="0.3"
        fy="0.3"
      >
        <stop offset="0%" stopColor="#FF89B5" />
        <stop offset="100%" stopColor="#E85A90" />
      </radialGradient>
      <linearGradient id="mic-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E85A90" />
        <stop offset="100%" stopColor="#D13B76" />
      </linearGradient>
    </defs>

    {/* Headphones */}
    <path
      d="M 20 55 A 30 30 0 0 1 80 55"
      stroke="#5F3A70"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="15" cy="55" r="10" fill="#5F3A70" />
    <circle cx="85" cy="55" r="10" fill="#5F3A70" />

    {/* Heart */}
    <path
      d="M50 30 C 35 15, 10 25, 10 45 C 10 65, 50 85, 50 85 C 50 85, 90 65, 90 45 C 90 25, 65 15, 50 30 Z"
      fill="url(#heart-gradient)"
    />

    {/* Face */}
    <circle cx="38" cy="48" r="3" fill="#333" />
    <circle cx="62" cy="48" r="3" fill="#333" />
    <path
      d="M 45 60 Q 50 68 55 60"
      stroke="#333"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />

    {/* Soundwave */}
    <rect x="42" y="68" width="4" height="12" rx="2" fill="white" />
    <rect x="48" y="65" width="4" height="18" rx="2" fill="white" />
    <rect x="54" y="68" width="4" height="12" rx="2" fill="white" />

    {/* Microphone */}
    <g transform="translate(65, 75) rotate(25)">
      <rect x="-8" y="-12" width="16" height="24" rx="8" fill="#5F3A70" />
      <circle cx="0" cy="5" r="3" fill="#FF89B5" />
      <circle cx="-5" cy="0" r="2" fill="#E85A90" />
    </g>
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
