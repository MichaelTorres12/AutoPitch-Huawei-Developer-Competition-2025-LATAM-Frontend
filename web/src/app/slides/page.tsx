"use client";
import DashboardShell from "@/components/DashboardShell";
import { loadDeck, type Deck } from "@/lib/deck";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileText, X, Play, ChevronLeft, Download, TvMinimalPlay } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import LoadingOverlay from "@/components/LoadingOverlay";
import { processFromUpload } from "@/lib/api";
import { deckFromProcess } from "@/lib/deck";
import PptxGenJS from "pptxgenjs";

function SlidesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const id = search.get("id") || "";
  const PANEL_WIDTH_OPEN = 400;
  const PANEL_WIDTH_COLLAPSED = 50; // ajusta este valor para cambiar el grosor cuando está comprimido
  const [deck, setDeck] = useState<Deck | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);
  const [notesOpen, setNotesOpen] = useState<boolean>(true);
  const activeSlide = deck?.slides[current];
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const presentRef = useRef<HTMLDivElement | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const uploadIdFromDeck = (id.startsWith("deck_") ? id.replace(/^deck_/, "") : id);

  useEffect(() => {
    if (!id) return;
    const d = loadDeck(id);
    setDeck(d);
    (async () => {
      if (!d) return;
      // Prefer remote URL from backend if available
      if (d.videoUrl) setVideoUrl(d.videoUrl);
      try {
        const { loadVideoBlob } = await import("@/lib/videoStore");
        const blob = await loadVideoBlob(d.id);
        if (blob) setVideoUrl(URL.createObjectURL(blob));
      } catch {}
    })();
  }, [id]);

  const totalTime = useMemo(() => deck?.slides.reduce((s, sl) => s + (sl.suggestedTimeSec ?? 0), 0) ?? 0, [deck]);

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

  function selectSlide(index: number) {
    setCurrent(Math.max(0, Math.min((deck?.slides.length ?? 1) - 1, index)));
  }

  function downloadPptx() {
    if (!deck) return;
    const pptx = new PptxGenJS();

    deck.slides.forEach((sl) => {
      const s = pptx.addSlide();
      // Title
      s.addText(sl.title || "", {
        x: 0.5,
        y: 0.4,
        w: 9,
        fontSize: 28,
        bold: true,
        color: "1f4ed8",
        align: "center",
      });
      // Bullets
      const bullets = (sl.bullets || []).map((b) => `• ${b}`).join("\n");
      if (bullets) {
        s.addText(bullets, {
          x: 1.0,
          y: 1.4,
          w: 8,
          fontSize: 16,
          color: "333333",
        });
      }
      // Speaker notes
      if (sl.speakerNotes) s.addNotes(sl.speakerNotes);
    });

    pptx.writeFile({ fileName: `${deck.id}.pptx` });
  }

  function startPresentation() {
    setIsPresenting(true);
    const el = presentRef.current;
    try {
      if (el && el.requestFullscreen) el.requestFullscreen();
    } catch {}
  }

  function stopPresentation() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
    } catch {}
    setIsPresenting(false);
  }

  async function regenerate() {
    if (!deck) return;
    try {
      setIsRegenerating(true);
      const proc = await processFromUpload({
        uploadId: uploadIdFromDeck,
        language: "es",
        objective: deck.objective,
        tone: deck.tone,
        slidesNumber: deck.slides.length,
      });
      if (!proc.ok) throw new Error("Proceso fallido");
      const newDeck = deckFromProcess(id, deck.objective, deck.tone, proc);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`deck_${id}`, JSON.stringify(newDeck));
      }
      setDeck(newDeck);
      setCurrent(0);
    } catch {
      alert("No se pudo regenerar el deck");
    } finally {
      setIsRegenerating(false);
    }
  }

  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement) setIsPresenting(false);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!isPresenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") selectSlide(current + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") selectSlide(current - 1);
      if (e.key === "Escape") stopPresentation();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresenting, current, deck?.slides.length]);


  if (!id || !deck) {
    return (
      <DashboardShell>
        <div className="text-sm">Deck not found. <button className="underline" onClick={() => router.push("/")}>Go back</button></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className=" h-screen overflow-hidden flex flex-col">
        <div className="sticky top-0 z-10">
          {/* Top toolbar */}
          <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => videoUrl && setIsVideoOpen(true)} disabled={!videoUrl} className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 ${videoUrl ? "bg-orange-500 text-white cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
                Ver grabación de origen
                <TvMinimalPlay className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-xl font-semibold">{deck.slides[current]?.title || "Introducción"}</div>
              <div className="text-sm text-gray-500">Slide {current + 1} de {deck.slides.length}</div>
            </div>
            <div className="flex items-center gap-2 py-1">
              <button onClick={downloadPptx} className="cursor-pointer px-3 py-2 text-sm border rounded flex items-center gap-2">
                Descargar Pitch Deck
                <Download className="w-4 h-4" />
              </button>
              <button onClick={startPresentation} className="cursor-pointer px-3 py-2 text-sm bg-orange-500 text-white rounded flex items-center gap-2">
                Presentar 
                <Play className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Second toolbar 
          <div className="bg-white border-b px-4 py-1 flex items-center gap-2">
            <button className="p-1"><SkipBack className="w-4 h-4" /></button>
            <button className="p-1"><Play className="w-4 h-4" /></button>
            <button className="p-1"><SkipForward className="w-4 h-4" /></button>
            <button className="p-1"><Share2 className="w-4 h-4" /></button>
            <button className="p-1"><FileText className="w-4 h-4" /></button>
            <button className="p-1"><Share2 className="w-4 h-4" /></button>
          </div>
          */}
        </div>

        {/* Main layout */}
        <div className="flex-1 grid overflow-hidden min-h-0 bg-gray-100" style={{ gridTemplateColumns: `280px 1fr ${notesOpen ? PANEL_WIDTH_OPEN + "px" : PANEL_WIDTH_COLLAPSED + "px"}` }}>
          {/* Left thumbnails */}
          <div className="bg-white border-r overflow-y-auto h-full min-h-0">
            <div className="p-3 space-y-1">
              {deck.slides.map((sl, idx) => (
                <div
                  key={sl.id}
                  onClick={() => selectSlide(idx)}
                  className={`cursor-pointer rounded-lg overflow-hidden ${
                    current === idx ? "bg-orange-100 border-2 border-orange-400" : "bg-white border border-gray-500"
                  }`}
                >
                  <div className="p-2">
                    <div className="text-xs font-medium text-orange-600">{idx + 1}. {sl.title}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{sl.bullets[0] || ""}</div>
                  </div>
                  <div className="relative h-20 bg-gradient-to-br from-teal-400 to-teal-600">
                    {sl.imageUrl && (
                      <Image src={sl.imageUrl} alt="thumb" fill className="object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center slide */}
          <motion.div className="bg-gray-100 flex items-center justify-center h-full min-h-0" animate={{ paddingLeft: 32, paddingRight: notesOpen ? 32 : 48 }} transition={{ type: "spring", stiffness: 220, damping: 28 }}>
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                <div className="h-full flex flex-col">
                  {/* Slide content area */}
                  <div className="flex-1 bg-gradient-to-br from-teal-200 via-teal-300 to-teal-500 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {activeSlide?.imageUrl ? (
                        <div className="relative w-[70%] h-[55%]">
                          <Image src={activeSlide.imageUrl} alt={activeSlide.title} fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="bg-white/80 rounded-lg px-6 py-4 text-center text-gray-500 shadow-sm">
                          <div className="text-sm">Sin imagen para esta lámina</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Title section */}
                  <div className="bg-white p-8 text-center">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">{activeSlide?.title}</h1>
                    <p className="text-gray-600">{activeSlide?.bullets?.[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right panel with smooth slide/width animation */}
          <motion.div className="relative h-full min-h-0 border-l border-gray-200 bg-white overflow-hidden shadow-sm" animate={{ width: notesOpen ? PANEL_WIDTH_OPEN : PANEL_WIDTH_COLLAPSED }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {/* Sliding content */}
            <motion.div className="absolute inset-0 overflow-y-auto" animate={{ x: notesOpen ? 0 : PANEL_WIDTH_COLLAPSED, opacity: notesOpen ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Guión de Pitch Deck</h3>
                <button aria-label="Cerrar guión" onClick={() => setNotesOpen(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100">
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="p-4 text-xs text-gray-500">Notas y texto para el presentador</div>
              <div className="px-4 pb-4 space-y-4">
                {deck.slides.map((sl, i) => (
                  <div key={sl.id}>
                    <div className="text-xs font-semibold text-gray-600 mb-1">SLIDE {i + 1} - {sl.title.toUpperCase()}</div>
                    <div className="text-xs text-gray-800 leading-relaxed">{sl.speakerNotes || "Buenos días a todos. Mi nombre es [Nombre] y hoy les presentaré nuestra propuesta de innovación tecnológica que revolucionará la forma en que trabajamos."}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 right-4">
                <button className="flex items-center gap-1 text-xs text-gray-600" onClick={() => setIsVideoOpen(true)}>
                  <FileText className="w-3 h-3" />
                  Editar Guión
                </button>
              </div>
            </motion.div>

            {/* Handle when collapsed */}
            {!notesOpen && (
              <div className="absolute inset-0 flex py-4 justify-center">
                <button aria-label="Abrir guión" onClick={() => setNotesOpen(true)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100">
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="absolute inset-0" onClick={() => setIsVideoOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Video original</div>
              <button onClick={() => setIsVideoOpen(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-black">
              <video src={videoUrl} controls autoPlay className="w-full aspect-video" />
            </div>
          </div>
        </div>
      )}

      {/* Presentation Overlay (Fullscreen) */}
      {isPresenting && (
        <div ref={presentRef} className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <div className="w-[92vw] max-w-[1600px]" style={{ aspectRatio: "16 / 9" }}>
            <div className="w-full h-full bg-white rounded-md overflow-hidden shadow-2xl flex flex-col">
              <div className="flex-1 relative bg-gradient-to-br from-teal-200 via-teal-300 to-teal-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  {activeSlide?.imageUrl && (
                    <div className="relative w-[70%] h-[60%]">
                      <Image src={activeSlide.imageUrl} alt={activeSlide.title} fill className="object-contain" />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white py-6 text-center">
                <div className="text-4xl font-bold text-blue-600">{activeSlide?.title}</div>
                <div className="mt-2 text-lg text-gray-600">{activeSlide?.bullets?.[0]}</div>
              </div>
            </div>
          </div>
          <button onClick={stopPresentation} className="absolute top-4 right-4 text-white/80 text-sm px-3 py-1 rounded border border-white/40 hover:bg-white/10">Salir (Esc)</button>
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

      {isRegenerating && <LoadingOverlay message="Regenerando el Pitch Deck…" />}
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



