import { SiteLink } from "@/components/navigation";
import { StayArt } from "@/components/stay-art";
import { ArrowIcon } from "@/components/ui/bits";

export default function NotFound() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden bg-jungle-deep px-5 text-center text-sand">
      <StayArt tone="lagoon" className="opacity-60" />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.32em] uppercase opacity-70">Error 404</p>
        <h1 className="font-display mt-6 text-[clamp(3.5rem,11vw,10rem)] leading-[0.88] tracking-tight">
          Lost at <span className="wonk text-lagoon-soft italic">sea?</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-sand/80">This page drifted away. Let&apos;s get you back to shore.</p>
        <SiteLink
          href="/"
          className="group mt-10 inline-flex items-center gap-3 rounded-full bg-sand px-6 py-4 text-sm font-semibold text-jungle transition-colors duration-500 hover:bg-lagoon hover:text-sand"
        >
          Back to La Bocana
          <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
        </SiteLink>
      </div>
    </section>
  );
}
