"use client";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Video, } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ConfigPanel, { Config } from "@/components/ConfigPanel";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { uploadVideo, processFromUpload } from "@/lib/api";
import { deckFromProcess } from "@/lib/deck";
import LoadingOverlay from "@/components/LoadingOverlay";

type UploadTab = "local" | "record";

export default function LocalVideoPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UploadTab>("local");
  const [files, setFiles] = useState<File[]>([]);
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // recording state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  // removed timer to simplify and avoid unused vars

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter((f) => f.type.startsWith("video/"));
    setFiles(videoFiles);
    if (videoFiles.length > 0) {
      const url = URL.createObjectURL(videoFiles[0]);
      setObjectURL(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm"],
    },
    multiple: true,
  });

  const fileList = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      })),
    [files]
  );

  async function onGenerate(config: Config) {
    setIsLoading(true);
    // 1) ensure we have a file to upload; if from recording, objectURL exists
    let uploadId: string | null = null;
    try {
      if (files[0]) {
        // uploaded via Local Video dropzone
        const up = await uploadVideo(files[0]);
        uploadId = up.id;
      } else if (objectURL) {
        const blob = await (await fetch(objectURL)).blob();
        const file = new File([blob], "recording.webm", { type: blob.type || "video/webm" });
        const up = await uploadVideo(file);
        uploadId = up.id;
      }
    } catch {
      alert("No se pudo subir el video al backend");
      setIsLoading(false);
      return;
    }
    if (!uploadId) {
      alert("No hay video para procesar");
      setIsLoading(false);
      return;
    }

    // 2) trigger processing pipeline
    try {
      const proc = await processFromUpload({
        uploadId,
        language: "es",
        objective: config.objective,
        tone: config.tone,
        slidesNumber: config.slides,
      });

      if (!proc.ok) throw new Error("Proceso fallido");

      // 3) build Deck and persist
      const deckId = `deck_${uploadId}`;
      const deck = deckFromProcess(deckId, config.objective, config.tone, proc);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`deck_${deckId}`, JSON.stringify(deck));
        const list = JSON.parse(window.localStorage.getItem("decks_index") || "[]");
        list.unshift({ id: deckId, createdAt: deck.createdAt });
        window.localStorage.setItem("decks_index", JSON.stringify(list));
      }
      router.push(`/slides?id=${deckId}`);
    } catch {
      alert("No se pudo procesar el video");
    } finally {
      setIsLoading(false);
    }
  }

  // CLEAR HELPERS AND TAB SWITCH
  function clearResources() {
    // stop any active media stream
    mediaStream?.getTracks().forEach((t) => t.stop());
    setMediaStream(null);
    // reset recorder/chunks
    setRecorder(null);
    setChunks([]);
    // no timers to clear
    // clear video element
    if (videoRef.current) {
      try {
        (videoRef.current as unknown as { srcObject: MediaStream | null }).srcObject = null;
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {}
    }
    // clear uploaded/preview url
    if (objectURL) {
      try { URL.revokeObjectURL(objectURL); } catch {}
    }
    setObjectURL(null);
    setFiles([]);
  }

  function handleSwitchTab(next: UploadTab) {
    const hasLoaded = !!objectURL || files.length > 0 || chunks.length > 0 || !!mediaStream;
    if (hasLoaded) {
      const ok = window.confirm(t("confirmSwitch"));
      if (!ok) return;
      clearResources();
    }
    setActiveTab(next);
  }

  // RECORDING CLEANUP
  useEffect(() => {
    return () => {
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [mediaStream]);

  async function startRecording() {
    try {
      type ScreenMediaDevices = MediaDevices & { getDisplayMedia: (constraints?: unknown) => Promise<MediaStream> };
      const displayStream = await (navigator.mediaDevices as ScreenMediaDevices).getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      let finalStream: MediaStream = displayStream;
      if (displayStream.getAudioTracks().length === 0) {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        finalStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...mic.getAudioTracks(),
        ]);
      }
      setMediaStream(finalStream);
      if (videoRef.current) {
        videoRef.current.srcObject = finalStream;
        await videoRef.current.play();
      }
      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: getSupportedMimeType(),
        videoBitsPerSecond: 4_000_000,
      });
      const local: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => e.data && local.push(e.data);
      mediaRecorder.onstop = () => {
        setChunks(local);
        const blob = new Blob(local, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setObjectURL(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
        finalStream.getTracks().forEach((t) => t.stop());
        setMediaStream(null);
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
    } catch {
      alert("No se pudo iniciar la grabación");
    }
  }
  function stopRecording() {
    recorder?.stop();
  }
  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    for (const t of types) if (MediaRecorder.isTypeSupported(t)) return t;
    return "video/webm";
  }

  return (
    <DashboardShell>
        <div className="max-w-8xl mx-auto px-4 xl:px-20 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white/70 backdrop-blur-sm shadow-sm">
              <Video className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-600">Pitch deck desde tu video</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("tagline")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">Sube un demo o graba tu pitch en vivo.</p>
          </div>

          <div className="mt-6 flex justify-center">
            <div
              role="tablist"
              aria-label="Modo de entrada"
              className="flex items-center gap-1 rounded-full border bg-gray-100 p-1 shadow-inner"
            >
              <button
                role="tab"
                aria-selected={activeTab === "local"}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
                  activeTab === "local" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
                onClick={() => handleSwitchTab("local")}
              >
                <Upload className="w-4 h-4" /> {t("localVideo")}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "record"}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
                  activeTab === "record" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
                onClick={() => handleSwitchTab("record")}
              >
                <Camera className="w-4 h-4" /> {t("recordRealTime")}
              </button>
            </div>
          </div>

          {activeTab === "local" ? (
            <section className="mt-6">
              {!objectURL ? (
                <div
                  {...getRootProps()}
                  className={`rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-colors ${
                    isDragActive ? "border-indigo-400/70 bg-indigo-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-1 ring-inset ring-indigo-200/60">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{t("uploadYourVideo")}</h2>
                  <p className="mt-2 text-sm text-gray-600">{t("dragOrClick")}</p>
                  <div className="mt-6">
                    <button aria-label="Seleccionar archivos de video" className="cursor-pointer h-10 px-5 rounded-full bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors">
                      Seleccionar archivos de video
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center text-[11px] text-gray-500">
                    <span>MP4</span>
                    <span>AVI</span>
                    <span>MOV</span>
                    <span>MKV</span>
                    <span>WMV</span>
                    <span>FLV</span>
                    <span>WebM</span>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1fr_500px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black shadow-sm">
                    {/* preview */}
                    <div className="h-[460px] flex items-center justify-center bg-black">
                      <video src={objectURL} controls className="max-h-full max-w-full object-contain bg-black" />
                    </div>
                    <div className="p-3 text-xs text-gray-300/90 bg-black/90 flex justify-between">
                      <span>{fileList[0]?.name}</span>
                      <span>{fileList[0]?.sizeMB} MB</span>
                    </div>
                  </div>
                  <ConfigPanel onGenerate={onGenerate} />
                </div>
              )}
            </section>
          ) : (
            <section className="mt-6">
              {!objectURL ? (
                <div className="grid lg:grid-cols-[1fr_500px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black">
                    <div className="h-[460px] flex items-center justify-center bg-black">
                      <video ref={videoRef} className="max-h-full max-w-full object-contain bg-black" playsInline muted />
                    </div>
                    <div className="p-3 text-xs text-white/80 bg-black/90 flex items-center justify-between" />
                  </div>
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <h3 className="font-semibold">{t("controls")}</h3>
                    <div className="mt-4 flex gap-3">
                      {!mediaStream ? (
                        <button onClick={startRecording} className="cursor-pointer h-10 px-4 rounded-full bg-gray-900 text-white text-sm hover:bg-black transition-colors">{t("startRecording")}</button>
                      ) : (
                        <button onClick={stopRecording} className="cursor-pointer h-10 px-4 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">{t("stop")}</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{t("willCapture")}</p>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1fr_500px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black shadow-sm">
                    <div className="h-[460px] flex items-center justify-center bg-black">
                      <video src={objectURL} controls className="max-h-full max-w-full object-contain bg-black" />
                    </div>
                  </div>
                  <ConfigPanel onGenerate={onGenerate} />
                </div>
              )}
            </section>
          )}
        </div>
        {isLoading && <LoadingOverlay message="Generando Pitch Deck con IA…" />}
    </DashboardShell>
  );
}
