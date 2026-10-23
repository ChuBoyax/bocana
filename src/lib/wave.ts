type WaveOptions = {
  width: number;
  height: number;
  amplitude: number;
  wavelength: number;
  baseline: number;
};

/**
 * A filled sine-like wave. Keep `width / 2` a multiple of `wavelength` so an
 * element twice the container width can loop seamlessly with translateX(-50%).
 */
export function wavePath({ width, height, amplitude, wavelength, baseline }: WaveOptions) {
  const half = wavelength / 2;
  let d = `M0 ${baseline} Q${half / 2} ${baseline - amplitude} ${half} ${baseline}`;
  for (let x = half; x < width; x += half) d += ` T${x + half} ${baseline}`;
  return `${d} V${height} H0 Z`;
}
