import { CheckIn } from "@/components/home/check-in";
import { Hero } from "@/components/home/hero";
import { Included } from "@/components/home/included";
import { Location } from "@/components/home/location";
import { Marquee } from "@/components/home/marquee";
import { StaysRail } from "@/components/home/stays-rail";
import { Welcome } from "@/components/home/welcome";

export default function Home() {
  return (
    <>
      <Hero />
      <Welcome />
      <StaysRail />
      <Marquee />
      <Included />
      <CheckIn />
      <Location />
    </>
  );
}
