"use client";
import { Check, Target, Rocket, ShoppingCart, Briefcase, Code, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

export type Objective = "Inversores" | "Hackatón" | "Ventas" | string;
export type Tone = "Ejecutivo" | "Técnico" | "Inspirador" | string;
export type SlideCount = "3-5" | "6-8" | "9-10" | "11-15";

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
  const [slides, setSlides] = useState<SlideCount>(initial?.slides ?? "3-5");

  // Custom modes and values
  const [objectiveMode, setObjectiveMode] = useState<"preset" | "custom">("preset");
  const [objectiveCustom, setObjectiveCustom] = useState<string>("");
  const [toneMode, setToneMode] = useState<"preset" | "custom">("preset");
  const [toneCustom, setToneCustom] = useState<string>("");

  const optionBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer ${
        active ? "bg-blue-600 text-white border-gray-900" : "hover:bg-gray-50"
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
        <div role="radiogroup" aria-label={t("objective")} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RadioCard
            title={t("investors")}
            description="Optimiza para captar inversión."
            icon={Target}
            selected={objectiveMode === "preset" && objective === "Inversores"}
            onSelect={() => { setObjectiveMode("preset"); setObjective("Inversores"); }}
          />
          <RadioCard
            title={t("hackathon")}
            description="Enfocado en logros y demo."
            icon={Rocket}
            selected={objectiveMode === "preset" && objective === "Hackatón"}
            onSelect={() => { setObjectiveMode("preset"); setObjective("Hackatón"); }}
          />
          <RadioCard
            title={t("sales")}
            description="Orientado a cerrar clientes."
            icon={ShoppingCart}
            selected={objectiveMode === "preset" && objective === "Ventas"}
            onSelect={() => { setObjectiveMode("preset"); setObjective("Ventas"); }}
          />
          <RadioCardCustom
            title="Custome"
            description="Escribe tu propio objetivo."
            selected={objectiveMode === "custom"}
            value={objectiveCustom}
            onSelect={() => setObjectiveMode("custom")}
            onChange={(v) => setObjectiveCustom(v.slice(0, 50))}
            placeholder="Describe tu objetivo (máx. 50)"
          />
        </div>

        <div className="text-xs text-gray-500 mt-4 mb-2">{t("tone")}</div>
        <div role="radiogroup" aria-label={t("tone")} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RadioCard
            title={t("executive")}
            description="Formal y conciso."
            icon={Briefcase}
            selected={toneMode === "preset" && tone === "Ejecutivo"}
            onSelect={() => { setToneMode("preset"); setTone("Ejecutivo"); }}
          />
          <RadioCard
            title={t("technical")}
            description="Mayor detalle técnico."
            icon={Code}
            selected={toneMode === "preset" && tone === "Técnico"}
            onSelect={() => { setToneMode("preset"); setTone("Técnico"); }}
          />
          <RadioCard
            title={t("inspirational")}
            description="Motivacional y visionario."
            icon={Sparkles}
            selected={toneMode === "preset" && tone === "Inspirador"}
            onSelect={() => { setToneMode("preset"); setTone("Inspirador"); }}
          />
          <RadioCardCustom
            title="Custome"
            description="Escribe el tono ideal."
            selected={toneMode === "custom"}
            value={toneCustom}
            onSelect={() => setToneMode("custom")}
            onChange={(v) => setToneCustom(v.slice(0, 50))}
            placeholder="Ej. cercano, audaz (máx. 50)"
          />
        </div>

        <div className="text-xs text-gray-500 mt-4 mb-2">{t("slidesCount")}</div>
        <div className="flex gap-2">
          {optionBtn("3-5", slides === "3-5", () => setSlides("3-5"))}
          {optionBtn("6-8", slides === "6-8", () => setSlides("6-8"))}
          {optionBtn("9-10", slides === "9-10", () => setSlides("9-10"))}
          {optionBtn("11-15", slides === "11-15", () => setSlides("11-15"))}
        </div>

        {/** Generate button with validation for custom modes */}
        <GenerateButton
          onClick={() => {
            const finalObjective = objectiveMode === "custom" && objectiveCustom.trim() ? objectiveCustom.trim() : objective;
            const finalTone = toneMode === "custom" && toneCustom.trim() ? toneCustom.trim() : tone;
            onGenerate({ objective: finalObjective, tone: finalTone, slides });
          }}
          disabled={
            (objectiveMode === "custom" && objectiveCustom.trim().length === 0) ||
            (toneMode === "custom" && toneCustom.trim().length === 0)
          }
          label={t("generatePitchDeck")}
        />
      </div>
    </div>
  );
}

function GenerateButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      className={`mt-6 w-full h-10 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm inline-flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-700 hover:from-indigo-700 hover:to-purple-700 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <Check className="w-4 h-4" /> {label}
    </button>
  );
}

type RadioCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onSelect: () => void;
};

function RadioCard({ title, description, icon: Icon, selected, onSelect }: RadioCardProps) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
        selected ? "border-indigo-500 bg-indigo-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 w-8 h-8 rounded-md grid place-items-center ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        </div>
        <div className="ml-auto">
          <span className={`inline-block w-4 h-4 rounded-full border ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`} />
        </div>
      </div>
    </button>
  );
}

type RadioCardCustomProps = {
  title: string;
  description: string;
  selected: boolean;
  value: string;
  onSelect: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
};

function RadioCardCustom({ title, description, selected, value, onSelect, onChange, placeholder }: RadioCardCustomProps) {
  return (
    <div className={`rounded-lg border p-3 transition-colors ${selected ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"}`}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="w-full text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-8 h-8 p-2 rounded-md grid place-items-center ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{description}</div>
          </div>
          <div className="ml-auto">
            <span className={`inline-block w-4 h-4 rounded-full border ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`} />
          </div>
        </div>
      </button>
      {selected && (
        <div className="mt-3">
          <label className="sr-only">{title}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={50}
            placeholder={placeholder}
            className="w-full h-9 px-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
          <div className={`mt-1 text-[11px] ${value.length >= 50 ? "text-red-600" : "text-gray-500"}`}>{value.length}/50</div>
        </div>
      )}
    </div>
  );
}


