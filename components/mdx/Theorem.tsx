type Props = {
  title?: string;
  children: React.ReactNode;
  id?: string; // optional anchor target
};

export default function Theorem({ title = "Theorem", children, id }: Props) {
  return (
    <section
      id={id}
      className="my-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4
                 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="mb-2 text-sm font-semibold tracking-tight">
        {title}
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {children}
      </div>
    </section>
  );
}
