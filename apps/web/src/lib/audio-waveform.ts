import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

export type RegionUpdateHandler = (start: number, end: number) => void;

export interface WaveformHandle {
  setRegion: (start: number, end: number) => void;
  destroy: () => void;
}

export async function createWaveform(
  container: HTMLElement,
  audioUrl: string,
  durationSec: number,
  onRegionUpdate: RegionUpdateHandler,
): Promise<WaveformHandle> {
  const regionsPlugin = RegionsPlugin.create();
  const wavesurfer = WaveSurfer.create({
    container,
    height: 88,
    waveColor: "#a3a3a3",
    progressColor: "#171717",
    cursorColor: "#171717",
    url: audioUrl,
    normalize: true,
    plugins: [regionsPlugin],
  });

  await new Promise<void>((resolve, reject) => {
    wavesurfer.on("ready", () => resolve());
    wavesurfer.on("error", () => reject(new Error("Could not load waveform.")));
  });

  const region = regionsPlugin.addRegion({
    start: 0,
    end: durationSec,
    drag: true,
    resize: true,
    color: "rgba(23, 23, 23, 0.12)",
  });

  region.on("update-end", () => {
    onRegionUpdate(region.start, region.end);
  });

  return {
    setRegion(start: number, end: number) {
      const clampedStart = Math.max(0, Math.min(start, durationSec));
      const clampedEnd = Math.max(clampedStart + 0.05, Math.min(end, durationSec));
      region.setOptions({ start: clampedStart, end: clampedEnd });
    },
    destroy() {
      wavesurfer.destroy();
    },
  };
}
