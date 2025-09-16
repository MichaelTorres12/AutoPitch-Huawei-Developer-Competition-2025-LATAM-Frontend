"use client";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Video, FileText, X } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ConfigPanel, { Config } from "@/components/ConfigPanel";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { createMockDeck } from "@/lib/deck";
import { saveVideoBlob } from "@/lib/videoStore";
import { useRouter } from "next/navigation";

type UploadTab = "local" | "record";

export default function LocalVideoPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UploadTab>("local");
  const [files, setFiles] = useState<File[]>([]);
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
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
    const slidesCount = config.slides === "6-8" ? 7 : config.slides === "10" ? 10 : 13;
    const deck = createMockDeck({
      objective: config.objective,
      tone: config.tone,
      slidesCount,
      videoUrl: objectURL ?? undefined,
    });
    try {
      if (objectURL) {
        const blob = await (await fetch(objectURL)).blob();
        await saveVideoBlob(deck.id, blob);
      }
    } catch {}
    router.push(`/slides?id=${deck.id}`);
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
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 justify-center">
            <Video className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl">→</span>
            <Upload className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-center text-2xl sm:text-3xl font-semibold mt-4">
            {t("tagline")}
          </h1>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-lg border bg-white overflow-hidden">
              <button
                className={`px-4 py-2 text-sm flex items-center gap-2 ${
                  activeTab === "local" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSwitchTab("local")}
              >
                <Upload className="w-4 h-4" /> {t("localVideo")}
              </button>
              <button
                className={`px-4 py-2 text-sm flex items-center gap-2 ${
                  activeTab === "record" ? "bg-gray-100" : ""
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
                    isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{t("uploadYourVideo")}</h2>
                  <p className="mt-2 text-sm text-gray-600">{t("dragOrClick")}</p>
                  <div className="mt-6">
                    <button className="px-5 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm shadow">
                      Select video files
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
                <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black">
                    {/* preview */}
                    <video src={objectURL} controls className="w-full h-[420px] object-contain bg-black" />
                    <div className="p-3 text-xs text-gray-300 bg-black/90 flex justify-between">
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
                <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black">
                    <video ref={videoRef} className="w-full h-[420px] object-contain bg-black" playsInline muted />
                    <div className="p-3 text-xs text-white/80 bg-black/90 flex items-center justify-between" />
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <h3 className="font-semibold">{t("controls")}</h3>
                    <div className="mt-4 flex gap-3">
                      {!mediaStream ? (
                        <button onClick={startRecording} className="h-10 px-4 rounded-md bg-gray-900 text-white text-sm">{t("startRecording")}</button>
                      ) : (
                        <button onClick={stopRecording} className="h-10 px-4 rounded-md bg-red-600 text-white text-sm">{t("stop")}</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{t("willCapture")}</p>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                  <div className="rounded-xl overflow-hidden border bg-black">
                    <video src={objectURL} controls className="w-full h-[420px] object-contain bg-black" />
                  </div>
                  <ConfigPanel onGenerate={onGenerate} />
                </div>
              )}
            </section>
          )}
        </div>
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
            </aside>
          </>
        )}
    </DashboardShell>
  );
}
