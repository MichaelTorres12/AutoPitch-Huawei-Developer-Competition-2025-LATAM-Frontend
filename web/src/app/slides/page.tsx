"use client";
import DashboardShell from "@/components/DashboardShell";
import { loadDeck, type Deck } from "@/lib/deck";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PptxGenJS from "pptxgenjs";
import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import Image from "next/image";

function SlidesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const id = search.get("id") || "";
  const [deck, setDeck] = useState<Deck | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const d = loadDeck(id);
    setDeck(d);
    (async () => {
      if (!d) return;
      try {
        const { loadVideoBlob } = await import("@/lib/videoStore");
        const blob = await loadVideoBlob(d.id);
        if (blob) setVideoUrl(URL.createObjectURL(blob));
      } catch {}
    })();
  }, [id]);

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

  const summaryText = useMemo(() => {
    if (!deck) return "";
    const hasVideo = !!videoUrl;
    const slidesCount = deck.slides.length;
    const minutes = Math.max(1, Math.round(totalTime / 60));
    return [
      `Resumen de generación`,
      `Objetivo: ${deck.objective}`,
      `Tono: ${deck.tone}`,
      `Slides: ${slidesCount} · Tiempo estimado: ~${minutes} min`,
      `Video fuente: ${hasVideo ? "incluido" : "no disponible"}`,
      "AQUI SE MOSTRARIA EL RESUMEN QUE SE OBTUVO DEL VIDEO Y SE USO PARA LA GENERACION DEL PITCH DECK + GUION"
    ].join("\n");
  }, [deck, videoUrl, totalTime]);

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
  }, [deck]);

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

  if (!id || !deck) {
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
                <div className="bg-black relative h-48">
                  <Image src={sl.imageUrl} alt="slide" fill className="object-cover" />
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

      {videoUrl && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Video de origen</h2>
          <div className="rounded-xl overflow-hidden border bg-black mt-2">
            <video src={videoUrl} controls className="w-full h-[420px] object-contain bg-black" />
          </div>
        </div>
      )}

      {/* Floating Summary Button */}
      <button
        aria-label="Resumen"
        onClick={() => setIsSummaryOpen(true)}
        className="fixed bottom-6 right-6 h-12 px-4 rounded-full shadow-lg bg-gray-900 text-white text-sm inline-flex items-center gap-2"
      >
        <FileText className="w-4 h-4" /> Resumen
      </button>

      {/* Right Drawer Modal */}
      {isSummaryOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsSummaryOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-screen w-full max-w-md bg-white z-50 shadow-xl border-l flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Resumen</div>
              <button aria-label="Cerrar" onClick={() => setIsSummaryOpen(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm whitespace-pre-wrap">
              {summaryText}
            </div>
          </aside>
        </>
      )}
    </DashboardShell>
  );
}

export default function SlidesPage() {
  return (
    <Suspense fallback={<DashboardShell><div className="text-sm">Loading…</div></DashboardShell>}>
      <SlidesInner />
    </Suspense>
  );
}


