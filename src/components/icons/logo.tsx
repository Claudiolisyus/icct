import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 20"
      width="200"
      height="20"
      {...props}
    >
      <text
        x="50%"
        y="15"
        textAnchor="middle"
        fontFamily="var(--font-headline), sans-serif"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
        className="font-headline"
      >
        Schedule System Prototype
      </text>
    </svg>
  );
}
