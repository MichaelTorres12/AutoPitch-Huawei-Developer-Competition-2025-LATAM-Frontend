"use client";
export default function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl px-6 py-5 flex items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
        <div className="text-sm text-gray-700">{message || "Procesando…"}</div>
      </div>
    </div>
  );
}


