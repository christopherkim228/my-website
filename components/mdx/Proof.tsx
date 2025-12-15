type ProofProps = {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
};

export default function Proof({
  title = "Proof",
  children,
  defaultOpen = false,
  id,
}: ProofProps) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="my-6 rounded-2xl border border-black/10 bg-black/[0.02]
                 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
        {title}
        <span className="ml-2 text-xs opacity-60">(click)</span>
      </summary>

      <div className="px-4 pb-4 pt-2">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
          <div className="mt-3 text-right opacity-70">□</div>
        </div>
      </div>
    </details>
  );
}
