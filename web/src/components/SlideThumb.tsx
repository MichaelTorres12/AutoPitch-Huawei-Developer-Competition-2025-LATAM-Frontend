"use client";
import { DeckSlide } from "@/lib/deck";
import SlideView, { type SlideTheme } from "./SlideView";

export default function SlideThumb({ slide, theme }: { slide: DeckSlide; theme: SlideTheme }) {
  // Render EXACTLY the same component used in the main canvas but scaled down
  return (
    <div className="relative bg-white rounded border border-black/20 overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
      <div className="absolute inset-0 origin-top-left" style={{ transform: "scale(0.25)", width: "400%", height: "400%" }}>
        <div className="h-full">
          <SlideView slide={slide} theme={theme} />
        </div>
      </div>
    </div>
  );
}


