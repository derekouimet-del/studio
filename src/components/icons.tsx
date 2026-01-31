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
      <path d="M12 7c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
      <path d="M12 15v-2m-1.5-3.5h3" />
      <path d="M12 15l-1 2h2l-1-2z" />
      <path d="M2.5 10a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM20.5 10a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill="currentColor" />
      <path d="M3 10h1.5m15 0H18m-14 3h2m10 0h2" />
    </svg>
  );
}
