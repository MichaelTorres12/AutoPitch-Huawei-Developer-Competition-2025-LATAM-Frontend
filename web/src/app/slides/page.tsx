"use client";
import DashboardShell from "@/components/DashboardShell";
import { loadDeck, type Deck } from "@/lib/deck";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileText, X, Play, ChevronLeft, Download, TvMinimalPlay } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
// import LoadingOverlay from "@/components/LoadingOverlay";
import PptxGenJS from "pptxgenjs";
import SlideView from "@/components/SlideView";
import SlideThumb from "@/components/SlideThumb";

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
  const [leftOpen, setLeftOpen] = useState<boolean>(true);
  const THEMES: Record<string, { name: string; bgGradient: string; titleClass: string; accent: string; titleColorHex: string; bulletColorHex: string }>= {
    teal: { name: "Aqua", bgGradient: "from-teal-200 via-teal-300 to-teal-500", titleClass: "text-blue-600", accent: "from-cyan-400 to-teal-500", titleColorHex: "1f4ed8", bulletColorHex: "333333" },
    sunset: { name: "Sunset", bgGradient: "from-rose-200 via-orange-200 to-yellow-200", titleClass: "text-rose-600", accent: "from-rose-500 to-orange-400", titleColorHex: "be123c", bulletColorHex: "374151" },
    gold: { name: "Golden", bgGradient: "from-amber-100 via-yellow-200 to-amber-300", titleClass: "text-amber-700", accent: "from-amber-400 to-yellow-300", titleColorHex: "b45309", bulletColorHex: "374151" },
  };
  const [theme, setTheme] = useState<keyof typeof THEMES>("teal");
  const activeSlide = deck?.slides[current];
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const presentRef = useRef<HTMLDivElement | null>(null);
  // regeneration state reserved for future feature
  // const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  // const uploadIdFromDeck = (id.startsWith("deck_") ? id.replace(/^deck_/, "") : id);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  function toggleExpandNotes(slideId: string) {
    setExpandedNotes((prev) => ({ ...prev, [slideId]: !prev[slideId] }));
  }

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
  const minutes = useMemo(() => Math.max(1, Math.round(totalTime / 60)), [totalTime]);
  const [transcript, setTranscript] = useState<string>("");
  useEffect(() => {
    async function loadSrt() {
      if (!deck?.transcriptUrl || !isSummaryOpen) return;
      try {
        const res = await fetch(deck.transcriptUrl);
        const srt = await res.text();
        // Basic SRT -> plain text cleanup
        const text = srt
          .replace(/\r/g, "")
          .split("\n\n")
          .map(block => block
            .split("\n")
            .filter((line, idx) => idx > 1 || !/^\d+$/.test(line)) // drop index line
            .filter(line => !/\d{2}:\d{2}:\d{2},\d{3} -->/.test(line)) // drop timestamps
            .join(" ")
          )
          .join("\n");
        setTranscript(text.trim());
      } catch {
        setTranscript("");
      }
    }
    loadSrt();
  }, [deck?.transcriptUrl, isSummaryOpen]);

  const summaryText = useMemo(() => {
    if (!deck) return "";
    const hasVideo = !!videoUrl;
    const slidesCount = deck.slides.length;
    const parts = [
      `Resumen de generación`,
      `Objetivo: ${deck.objective}`,
      `Tono: ${deck.tone}`,
      `Slides: ${slidesCount} · Tiempo estimado: ~${minutes} min`,
      `Video fuente: ${hasVideo ? "incluido" : "no disponible"}`,
    ];
    if (deck.summary) parts.push(deck.summary);
    return parts.join("\n");
  }, [deck, videoUrl, minutes]);

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
        color: THEMES[theme].titleColorHex,
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
          color: THEMES[theme].bulletColorHex,
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

  // regenerate() was removed from UI to avoid unused warnings. Keep logic in landing page.

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
          {/* Top toolbar - minimal */}
          <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between">
            {/* Left actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => videoUrl && setIsVideoOpen(true)}
                disabled={!videoUrl}
                className={`h-9 px-3 rounded-full inline-flex items-center gap-2 text-xs sm:text-sm ${videoUrl ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
              >
                Video original
                <TvMinimalPlay className="w-4 h-4" />
                <span className="hidden xs:inline">Ver video</span>
              </button>
            </div>

            {/* Center title */}
            <div className="min-w-0 text-center px-2">
              <div className="truncate font-semibold text-base sm:text-lg">{deck.slides[current]?.title || "Introducción"}</div>
              <div className="text-[11px] text-gray-500">Slide {current + 1} de {deck.slides.length}</div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 mr-1">
                <select
                  aria-label="Tema de diseño"
                  className="h-9 rounded-full border bg-white text-xs px-2"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as keyof typeof THEMES)}
                >
                  {Object.entries(THEMES).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={downloadPptx} className="cursor-pointer h-9 px-3 rounded-full border text-xs sm:text-sm inline-flex items-center gap-2 bg-white hover:bg-gray-50">
                <span className="hidden sm:inline">Descargar</span>
                <Download className="w-4 h-4" />
              </button>
              <button onClick={startPresentation} className="cursor-pointer h-9 px-3 rounded-full bg-orange-500 text-white text-xs sm:text-sm inline-flex items-center gap-2">
                <span className="hidden sm:inline">Presentar</span>
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
        <div className="flex-1 grid overflow-hidden min-h-0 bg-gray-100" style={{ gridTemplateColumns: `${leftOpen ? 280 : 44}px 1fr ${notesOpen ? PANEL_WIDTH_OPEN + "px" : PANEL_WIDTH_COLLAPSED + "px"}` }}>
          {/* Left thumbnails redesigned */}
          <div className="relative h-full min-h-0 bg-[#1f1f1f] text-white border-r">
            {/* Collapse handle */}
            <button
              aria-label={leftOpen ? "Contraer panel" : "Expandir panel"}
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute top-1/2 -right-3 z-10 -translate-y-1/2 h-8 w-6 rounded-full bg-gray-700 text-gray-200 grid place-items-center shadow cursor-pointer"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${leftOpen ? "" : "rotate-180"}`} />
            </button>

            {/* Content */}
            <div className={`h-full flex flex-col ${leftOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity`}>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-2 py-5 pb-12">
                <div className="space-y-2">
                  {deck.slides.map((sl, idx) => {
                    const isActive = current === idx;
                    return (
                      <div
                        key={sl.id}
                        onClick={() => selectSlide(idx)}
                        className={`relative h-auto cursor-pointer rounded-lg border overflow-hidden bg-[#2a2a2a] transition-colors ${isActive ? "border-orange-400 ring-2 ring-orange-400/50" : "border-transparent hover:bg-[#333333]"}`}
                      >
                        <div className="absolute left-2 top-2 text-[11px] font-medium text-orange-400 tabular-nums">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <div className="pl-9 pr-2 py-2">
                          <SlideThumb slide={sl} theme={{ bgGradient: THEMES[theme].bgGradient, titleClass: THEMES[theme].titleClass }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom status */}
              <div className="sticky bottom-0 p-3 bg-[#1f1f1f] border-t border-[#2a2a2a]">
                <div className="w-full text-center">
                  <span className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-orange-500 text-black text-sm font-medium">
                    Slide {current + 1} / {deck.slides.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center slide */}
          <motion.div className="bg-gray-100 flex items-center justify-center h-full min-h-0" animate={{ paddingLeft: 32, paddingRight: notesOpen ? 32 : 48 }} transition={{ type: "spring", stiffness: 220, damping: 28 }}>
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                <div className="h-full flex flex-col">
                  <SlideView slide={activeSlide!} theme={{ bgGradient: THEMES[theme].bgGradient, titleClass: THEMES[theme].titleClass }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right panel with smooth slide/width animation */}
          <motion.div className="relative h-full min-h-0 border-l border-gray-200 bg-white overflow-hidden shadow-sm" animate={{ width: notesOpen ? PANEL_WIDTH_OPEN : PANEL_WIDTH_COLLAPSED }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {/* Sliding content */}
            <motion.div className="absolute inset-0 overflow-y-auto" animate={{ x: notesOpen ? 0 : PANEL_WIDTH_COLLAPSED, opacity: notesOpen ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <div className="sticky top-0 z-[1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Guión sugerido para Pitch Deck</h3>
                <button aria-label="Cerrar guión" onClick={() => setNotesOpen(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100">
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="px-4 py-4 space-y-3">
                {deck.slides.map((sl, i) => {
                  const isActive = i === current;
                  const time = sl.suggestedTimeSec ? Math.round((sl.suggestedTimeSec || 0) / 60) : 0;
                  const fullText = sl.speakerNotes || "Buenos días a todos. Mi nombre es [Nombre] y hoy les presentaré nuestra propuesta de innovación tecnológica que revolucionará la forma en que trabajamos.";
                  const isLong = fullText.length > 220;
                  const expanded = !!expandedNotes[sl.id];
                  const displayText = expanded || !isLong ? fullText : `${fullText.slice(0, 220)}…`;
                  return (
                    <div
                      key={sl.id}
                      className={`group rounded-lg border bg-white p-3 transition-shadow hover:shadow-sm ${isActive ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`inline-flex h-6 px-2 items-center rounded-full text-[11px] font-medium ${isActive ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>{String(i + 1).padStart(2, "0")}</span>
                          <div className="truncate text-sm font-medium text-gray-900" title={sl.title}>{sl.title}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {time > 0 && (
                            <span className="inline-flex items-center h-6 px-2 rounded-full bg-sky-50 text-sky-700 text-[11px]">~{time}m</span>
                          )}
                          <button className="text-xs text-gray-600 hover:text-gray-900" onClick={() => selectSlide(i)}>Ir</button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-800 leading-relaxed">{displayText}</p>
                      {isLong && (
                        <button className="mt-1 text-[11px] text-gray-600 hover:text-gray-900" onClick={() => toggleExpandNotes(sl.id)}>
                          {expanded ? "Ver menos" : "Ver más"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="absolute bottom-3 right-3">
                <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900" onClick={() => setIsVideoOpen(true)}>
                  <FileText className="w-3 h-3" />
                  Editar guión
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
            <div className="p-4 overflow-y-auto text-base">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs">Objetivo: {deck.objective}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">Tono: {deck.tone}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">Slides: {deck.slides.length}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-700 text-xs">Tiempo: ~{minutes} min</span>
              </div>
              <div className="text-base font-semibold text-gray-600 mb-2 mt-4">Resumen</div>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {deck.summary || summaryText}
              </div>
              {deck.transcriptUrl && (
                <div className="mt-8">
                  <div className="text-base font-semibold text-gray-600 mb-2">Transcripción extraída del video (SRT)</div>
                  <div className="text-base whitespace-pre-wrap text-gray-700 bg-gray-50 border rounded p-3 max-h-60 overflow-y-auto">
                    {transcript || "Cargando transcripción…"}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Future: show overlay while regenerating */}
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



