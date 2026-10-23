/** Shown the moment a stay is clicked, in the shape of its hero, while the page streams in. */
export default function Loading() {
  return (
    <section aria-busy className="relative h-svh min-h-[640px] overflow-hidden bg-jungle-deep">
      <span className="sr-only">Loading stay…</span>
      <div className="mx-auto flex h-full max-w-[1400px] animate-pulse flex-col px-5 pt-28 pb-10 md:px-10 md:pt-32 md:pb-14">
        <div className="h-8 w-32 rounded-full bg-sand/10" />
        <div className="mt-auto">
          <div className="h-3 w-44 rounded-full bg-sand/10" />
          <div className="mt-5 h-[clamp(2.75rem,6.5vw,6.5rem)] w-3/5 max-w-2xl rounded-3xl bg-sand/10" />
          <div className="mt-3 h-[clamp(1.25rem,2.2vw,1.9rem)] w-2/5 max-w-md rounded-full bg-sand/10" />
        </div>
        <div className="mt-10 flex gap-8 border-t border-sand/15 pt-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-2.5 w-14 rounded-full bg-sand/10" />
              <div className="h-6 w-10 rounded-full bg-sand/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
