"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export type Objective = "Inversores" | "Hackatón" | "Ventas";
export type Tone = "Ejecutivo" | "Técnico" | "Inspirador";
export type SlideCount = "6-8" | "10" | "12-15";

export type Config = {
  objective: Objective;
  tone: Tone;
  slides: SlideCount;
};

export default function ConfigPanel({
  onGenerate,
  initial,
}: {
  onGenerate: (config: Config) => void;
  initial?: Partial<Config>;
}) {
  const { t } = useI18n();
  const [objective, setObjective] = useState<Objective>(initial?.objective ?? "Hackatón");
  const [tone, setTone] = useState<Tone>(initial?.tone ?? "Ejecutivo");
  const [slides, setSlides] = useState<SlideCount>(initial?.slides ?? "10");

  const optionBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md border text-sm transition-colors ${
        active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold">{t("configuration")}</h3>
      <div className="mt-4 text-sm">
        <div className="text-xs text-gray-500 mb-2">{t("objective")}</div>
        <div className="grid grid-cols-3 gap-2">
          {optionBtn(t("investors"), objective === "Inversores", () => setObjective("Inversores"))}
          {optionBtn(t("hackathon"), objective === "Hackatón", () => setObjective("Hackatón"))}
          {optionBtn(t("sales"), objective === "Ventas", () => setObjective("Ventas"))}
        </div>

        <div className="text-xs text-gray-500 mt-4 mb-2">{t("tone")}</div>
        <div className="grid grid-cols-3 gap-2">
          {optionBtn(t("executive"), tone === "Ejecutivo", () => setTone("Ejecutivo"))}
          {optionBtn(t("technical"), tone === "Técnico", () => setTone("Técnico"))}
          {optionBtn(t("inspirational"), tone === "Inspirador", () => setTone("Inspirador"))}
        </div>

        <div className="text-xs text-gray-500 mt-4 mb-2">{t("slidesCount")}</div>
        <div className="flex gap-2">
          {optionBtn("6-8", slides === "6-8", () => setSlides("6-8"))}
          {optionBtn("10", slides === "10", () => setSlides("10"))}
          {optionBtn("12-15", slides === "12-15", () => setSlides("12-15"))}
        </div>

        <button
          className="mt-6 w-full h-10 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm inline-flex items-center justify-center gap-2"
          onClick={() => onGenerate({ objective, tone, slides })}
        >
          <Check className="w-4 h-4" /> {t("generatePitchDeck")}
        </button>
      </div>
    </div>
  );
}


