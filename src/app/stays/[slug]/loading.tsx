/** Shown the moment a stay is clicked, in the shape of its hero, while the page streams in. */
export default function Loading() {
  return (
    <section aria-busy className="relative h-svh min-h-[620px] overflow-hidden bg-jungle-deep">
      <span className="sr-only">Loading stay…</span>
      <div className="mx-auto flex h-full max-w-[1400px] animate-pulse flex-col justify-end px-5 pb-12 md:px-10 md:pb-20">
        <div className="h-9 w-32 rounded-full bg-sand/10" />
        <div className="mt-10 h-3 w-44 rounded-full bg-sand/10" />
        <div className="mt-5 h-[clamp(3rem,9vw,8.5rem)] w-3/5 max-w-2xl rounded-3xl bg-sand/10" />
        <div className="mt-4 h-[clamp(1.5rem,3vw,2.5rem)] w-2/5 max-w-md rounded-full bg-sand/10" />
        <div className="mt-8 border-t border-sand/15 pt-6">
          <div className="h-4 w-72 max-w-full rounded-full bg-sand/10" />
        </div>
      </div>
    </section>
  );
}
