export type DeckSlide = {
  id: string;
  title: string;
  bullets: string[];
  imageUrl?: string;
  speakerNotes?: string;
  suggestedTimeSec?: number;
};

export type Deck = {
  id: string;
  createdAt: number;
  objective: string;
  tone: string;
  slides: DeckSlide[];
};

export function createMockDeck(params: {
  objective: string;
  tone: string;
  slidesCount: number;
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
    slides: blocks,
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


