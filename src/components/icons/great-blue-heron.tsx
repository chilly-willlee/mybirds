export function GreatBlueHeron({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 32"
      width={Math.round(size * 1.5)}
      height={size}
      aria-hidden="true"
      className={className}
    >
      {/* Body + wings: bill tip → head → wing arch → wingtip → belly → neck-fold hump → throat → bill */}
      <path
        d="M46,16 C44,13 42,10 40,10 C38,10 36,12 33,12 C28,10 22,4 12,8 C8,10 3,13 2,17 C2,20 5,22 10,21 C16,20 22,20 28,21 C30,22 33,24 36,25 C38,25 41,22 43,19 C44,17 46,17 46,16 Z"
        fill="currentColor"
      />
      {/* Eye */}
      <circle cx="41" cy="12" r="1" fill="white" />
      {/* Legs trailing behind */}
      <path
        d="M29,22 L24,31 M34,23 L30,31"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
