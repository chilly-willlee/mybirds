export function GreatEgret({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 36"
      width={Math.round(size * 1.556)}
      height={size}
      aria-hidden="true"
      className={className}
    >
      {/* Body + wings: long bill, swept S-neck, broad wing, slender belly */}
      <path
        d="M52,15 C50,11 47,9 44,9 C40,8 36,7 30,5 C22,4 12,6 5,10 C2,12 1,15 1,17 C3,18 7,19 13,19 C19,20 26,21 32,22 C36,22 40,21 43,19 C46,18 49,16 51,16 Z"
        fill="currentColor"
      />
      {/* Eye */}
      <circle cx="44" cy="10" r="1" fill="white" />
      {/* Long trailing legs — distinctively long relative to body */}
      <path
        d="M25,21 L17,34 M31,22 L24,34"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
