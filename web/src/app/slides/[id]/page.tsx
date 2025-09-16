"use client";
import DashboardShell from "@/components/DashboardShell";
import { loadDeck, type Deck } from "@/lib/deck";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PptxGenJS from "pptxgenjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SlidesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const d = loadDeck(params.id);
    setDeck(d);
  }, [params.id]);

  const totalTime = useMemo(() => deck?.slides.reduce((s, sl) => s + (sl.suggestedTimeSec ?? 0), 0) ?? 0, [deck]);
  const fullScript = useMemo(
    () =>
      deck
        ? deck.slides
            .map(
              (sl, i) => `${i + 1}. ${sl.title}\n${sl.speakerNotes ?? ""}${sl.suggestedTimeSec ? `\n(≈ ${sl.suggestedTimeSec}s)` : ""}`
            )
            .join("\n\n")
        : "",
    [deck]
  );

  function updateEdges() {
    const el = scrollerRef.current;
    if (!el) return;
    const nearStart = el.scrollLeft <= 4;
    const nearEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 4;
    setAtStart(nearStart);
    setAtEnd(nearEnd);
  }

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateEdges();
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollerRef.current]);

  function downloadPptx() {
    if (!deck) return;
    const pptx = new PptxGenJS();
    deck.slides.forEach((sl) => {
      const slide = pptx.addSlide();
      slide.addText(sl.title, { x: 0.5, y: 0.3, fontSize: 24, bold: true });
      slide.addText(sl.bullets.map((b) => `• ${b}`).join("\n"), { x: 0.5, y: 1.0, fontSize: 14 });
      if (sl.imageUrl) {
        slide.addImage({ path: sl.imageUrl, x: 6.2, y: 1.2, w: 3.0, h: 1.7 });
      }
      if (sl.speakerNotes) {
        slide.addNotes(sl.speakerNotes);
      }
    });
    pptx.writeFile({ fileName: `${deck.id}.pptx` });
  }

  if (!deck) {
    return (
      <DashboardShell>
        <div className="text-sm">Deck not found. <button className="underline" onClick={() => router.push("/")}>Go back</button></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pitch Deck</h1>
        <button onClick={downloadPptx} className="h-10 px-4 rounded-md bg-gray-900 text-white text-sm">Download .pptx</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1">Slides: {deck.slides.length}</span>
        <span className="rounded-full bg-gray-100 px-3 py-1">~ {Math.round(totalTime/60)} min</span>
        <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1">{deck.objective}</span>
        <span className="rounded-full bg-purple-50 text-purple-700 px-3 py-1">{deck.tone}</span>
      </div>

      <div className="relative mt-6">
        {!atStart && (
          <button
            aria-label="Prev"
            onClick={() => scrollerRef.current?.scrollBy({ left: -scrollerRef.current.clientWidth * 0.9, behavior: "smooth" })}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow p-2 border"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {!atEnd && (
          <button
            aria-label="Next"
            onClick={() => scrollerRef.current?.scrollBy({ left: scrollerRef.current.clientWidth * 0.9, behavior: "smooth" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow p-2 border"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div ref={scrollerRef} className="overflow-x-auto flex gap-4 scroll-smooth snap-x snap-mandatory pb-2">
          {deck.slides.map((sl) => (
            <div key={sl.id} className="snap-start min-w-[420px] w-[420px] rounded-xl border overflow-hidden bg-white">
              <div className="p-4">
                <h3 className="font-semibold text-lg">{sl.title}</h3>
                <ul className="mt-2 list-disc pl-6 text-sm">
                  {sl.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                </ul>
              </div>
              {sl.imageUrl && (
                <div className="bg-black">
                  <img src={sl.imageUrl} alt="slide" className="w-full h-48 object-cover" />
                </div>
              )}
              <div className="p-4 bg-gray-50 text-sm">
                <div className="font-medium mb-1">Speaker Notes</div>
                <p className="text-gray-700 whitespace-pre-wrap">{sl.speakerNotes}</p>
                {sl.suggestedTimeSec ? (
                  <div className="mt-2 text-xs text-gray-500">Suggested: {sl.suggestedTimeSec}s</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Guion completo</h2>
        <div className="mt-2 rounded-lg border bg-white p-4 text-sm whitespace-pre-wrap">{fullScript}</div>
      </div>
    </DashboardShell>
  );
}


