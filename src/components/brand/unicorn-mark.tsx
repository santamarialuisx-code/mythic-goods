/**
 * Placeholder unicorn mark. Swap the paths here once the real logo lands —
 * every surface (header, footer, placeholders, admin) reads from this file.
 */
export function UnicornMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12.6 2.8 17.4 19.2H7.8L12.6 2.8Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M12.6 2.8 17.4 19.2H7.8L12.6 2.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 13.1h5.4M8.9 16.4h7.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M19.2 3.9l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
