"use client";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import ConfigPanel, { Config } from "@/components/ConfigPanel";

type RecorderState = "idle" | "recording" | "stopped";

export default function RecordPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [state, setState] = useState<RecorderState>("idle");
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [recordingMs, setRecordingMs] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaStream?.getTracks().forEach((t) => t.stop());
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [mediaStream, previewURL]);

  const startTimer = () => {
    setRecordingMs(0);
    timerRef.current = window.setInterval(() => {
      setRecordingMs((v) => v + 1000);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  async function startRecording() {
    try {
      // Ask for screen + mic
      type ScreenMediaDevices = MediaDevices & {
        // Some TS lib targets don't include DisplayMediaStreamConstraints; use unknown for compatibility
        getDisplayMedia: (constraints?: unknown) => Promise<MediaStream>;
      };
      const displayStream = await (navigator.mediaDevices as ScreenMediaDevices).getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      // In some browsers display stream may lack audio; merge with mic
      let finalStream = displayStream as MediaStream;
      const hasAudio = displayStream.getAudioTracks().length > 0;
      if (!hasAudio) {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        const combined = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...mic.getAudioTracks(),
        ]);
        finalStream = combined;
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

      const localChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) localChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stopTimer();
        setChunks(localChunks);
        const blob = new Blob(localChunks, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewURL(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
        // Stop all tracks
        finalStream.getTracks().forEach((t) => t.stop());
        setMediaStream(null);
      };

      mediaRecorder.start();
      startTimer();
      setRecorder(mediaRecorder);
      setState("recording");
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar la grabación");
    }
  }

  function stopRecording() {
    if (!recorder) return;
    recorder.stop();
    setState("stopped");
  }

  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "video/webm";
  }

  function onGenerate(config: Config) {
    // Placeholder: here we will upload `chunks`/blob along with config
    console.log("Generate with config", config, {
      sizeMB: chunks.reduce((s, b) => s + b.size, 0) / (1024 * 1024),
    });
    alert("Generación simulada. Conectaremos al backend luego.");
  }

  const minutes = Math.floor(recordingMs / 60000)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((recordingMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <DashboardShell>
      <h1 className="text-2xl font-semibold">Record</h1>
      <p className="mt-2 text-sm text-gray-600">
        Graba la pantalla y usa el video para generar tu pitch deck.
      </p>

      {!previewURL ? (
        <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-xl overflow-hidden border bg-black">
            <video ref={videoRef} className="w-full h-[420px] object-contain bg-black" playsInline muted />
            <div className="p-3 text-xs text-white/80 bg-black/90 flex items-center justify-between">
              <span>{state === "recording" ? "Grabando" : "Listo"}</span>
              <span className="tabular-nums">{minutes}:{seconds}</span>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">Controles</h3>
            <div className="mt-4 flex gap-3">
              {state !== "recording" ? (
                <button onClick={startRecording} className="h-10 px-4 rounded-md bg-gray-900 text-white text-sm">
                  Iniciar Grabación
                </button>
              ) : (
                <button onClick={stopRecording} className="h-10 px-4 rounded-md bg-red-600 text-white text-sm">
                  Detener
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Se capturará la pantalla elegida y el audio del micrófono.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-xl overflow-hidden border bg-black">
            <video src={previewURL} controls className="w-full h-[420px] object-contain bg-black" />
          </div>
          <ConfigPanel onGenerate={onGenerate} />
        </div>
      )}
    </DashboardShell>
  );
}



