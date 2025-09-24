"use client";
import DashboardShell from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LibraryBig, Plus, Upload, Camera, CalendarClock } from "lucide-react";

export default function LibraryPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<{ id: string; createdAt: number }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("decks_index") || "[]";
      setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const empty = useMemo(() => items.length === 0, [items]);

  return (
    <DashboardShell>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-white/70 backdrop-blur-sm shadow-sm">
              <LibraryBig className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-600">{t("library")}</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">Tus pitch decks</h1>
            <p className="mt-1 text-sm text-gray-500">Explora y reabre los decks que generaste con IA.</p>
          </div>
          {!empty && (
            <Link href="/" className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-gray-900 text-white text-sm hover:bg-black transition-colors">
              <Plus className="w-4 h-4" /> Nuevo
            </Link>
          )}
        </div>

        {empty ? (
          <div className="mt-8 rounded-2xl border p-10 text-center bg-white">
            <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center">
              <LibraryBig className="w-6 h-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{t("noneYet")}</h2>
            <p className="mt-2 text-sm text-gray-600">Sube un video o graba uno para generar tu primer pitch deck.</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link href="/" className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-gray-900 text-white text-sm hover:bg-black transition-colors">
                <Upload className="w-4 h-4" /> Subir video
              </Link>
              <Link href="/record" className="inline-flex items-center gap-2 h-9 px-4 rounded-full border text-sm hover:bg-gray-50">
                <Camera className="w-4 h-4" /> Grabar
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((it) => (
              <Link key={it.id} href={`/slides?id=${it.id}`} className="group rounded-xl border overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-black">
                  <Image src={`https://picsum.photos/seed/${it.id.slice(-4)}/800/450`} alt="cover" fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
                  <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/90">Deck</span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium truncate">{it.id}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{new Date(it.createdAt).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}


