"use client";
import DashboardShell from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
      <h1 className="text-2xl font-semibold">{t("library")}</h1>
      {empty ? (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">{t("noneYet")}</div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <Link key={it.id} href={`/slides?id=${it.id}`} className="rounded-lg border p-0 overflow-hidden group">
              <div className="bg-black relative h-36">
                <Image src={`https://picsum.photos/seed/${it.id.slice(-4)}/800/450`} alt="cover" fill className="object-cover transition-transform group-hover:scale-[1.02]" />
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate">{it.id}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(it.createdAt).toLocaleString()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}


