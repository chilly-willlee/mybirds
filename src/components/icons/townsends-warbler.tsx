export function TownsendWarbler({
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
      <path
        d="M46,15 C43,11 39,9 34,8 C29,7 24,7 19,8 C14,9 9,12 5,15 C3,17 1,15 0,11 L0,16 C2,20 7,23 15,25 C21,27 30,26 38,22 C42,19 44,17 46,15Z"
        fill="currentColor"
      />
      <circle cx="37" cy="10" r="1.5" fill="white" />
    </svg>
  );
}
