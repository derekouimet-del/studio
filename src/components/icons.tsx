import type { SVGProps } from 'react';

export function PenQuestLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5L12 2z" />
      <path 
        d="M12 7c-1.5 0-3 2-3 4 0 2 1.5 5 3 6 1.5-1 3-4 3-6 0-2-1.5-4-3-4z" 
        fill="currentColor"
        strokeWidth="1"
      />
      <line x1="12" y1="12" x2="12" y2="17" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
    </svg>
  );
}
