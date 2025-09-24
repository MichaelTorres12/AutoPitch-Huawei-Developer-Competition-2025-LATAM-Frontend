export type DeckSlide = {
  id: string;
  title: string;
  bullets: string[];
  imageUrl?: string;
  speakerNotes?: string;
  suggestedTimeSec?: number;
  layout?: "title" | "titleBullets" | "quote" | "imageLeft" | "imageRight" | "stats" | "cover";
};

export type Deck = {
  id: string;
  createdAt: number;
  objective: string;
  tone: string;
  summary?: string;
  slides: DeckSlide[];
  videoUrl?: string;
  transcriptUrl?: string;
};

export function createMockDeck(params: {
  objective: string;
  tone: string;
  slidesCount: number;
  videoUrl?: string;
}): Deck {
  const id = `deck_${Date.now()}`;
  const blocks: DeckSlide[] = [];
  const titles = [
    "Problema",
    "Solución",
    "Demo",
    "Mercado",
    "Modelo",
    "Tracción",
    "Competencia",
    "Roadmap",
    "Equipo",
    "Ask",
  ];
  for (let i = 0; i < params.slidesCount; i++) {
    const title = titles[i % titles.length];
    blocks.push({
      id: `${i + 1}`,
      title,
      bullets: [
        `Punto clave ${i + 1}.1 en ${title}`,
        `Punto clave ${i + 1}.2 en ${title}`,
        `Punto clave ${i + 1}.3 en ${title}`,
      ],
      imageUrl: `https://picsum.photos/seed/${i + 10}/800/450`,
      speakerNotes: `Notas del presentador para ${title}. Mantén un ritmo claro y enfatiza el valor.`,
      suggestedTimeSec: 30,
    });
  }
  const deck: Deck = {
    id,
    createdAt: Date.now(),
    objective: params.objective,
    tone: params.tone,
    summary: undefined,
    slides: blocks,
    videoUrl: params.videoUrl,
    transcriptUrl: undefined,
  };

  // persist
  if (typeof window !== "undefined") {
    const key = `deck_${id}`;
    window.localStorage.setItem(key, JSON.stringify(deck));
    const list = JSON.parse(window.localStorage.getItem("decks_index") || "[]");
    list.unshift({ id, createdAt: deck.createdAt });
    window.localStorage.setItem("decks_index", JSON.stringify(list));
  }

  return deck;
}

export function loadDeck(id: string): Deck | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`deck_${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Deck;
  } catch {
    return null;
  }
}

// Convert backend response to Deck shape
export function deckFromProcess(id: string, objective: string, tone: string, resp: {
  pitch_deck: { summary?: string; slides: { title: string; bullets: string[] }[]; script?: { slide: number; what_to_say: string }[] };
  frame_urls?: string[];
  input_video_url?: string;
  srt_url?: string;
}): Deck {
  const layouts: DeckSlide["layout"][] = ["cover", "titleBullets", "imageRight", "titleBullets", "quote", "imageLeft", "stats"];
  const slides: DeckSlide[] = resp.pitch_deck.slides.map((s, idx) => ({
    id: `${idx + 1}`,
    title: s.title,
    bullets: s.bullets || [],
    imageUrl: resp.frame_urls?.[idx] || resp.frame_urls?.[0],
    speakerNotes: resp.pitch_deck.script?.find((sc) => sc.slide === idx + 1)?.what_to_say,
    suggestedTimeSec: 30,
    layout: layouts[idx % layouts.length],
  }));
  return {
    id,
    createdAt: Date.now(),
    objective,
    tone,
    summary: resp.pitch_deck.summary,
    slides,
    videoUrl: resp.input_video_url,
    transcriptUrl: resp.srt_url,
  };
}


