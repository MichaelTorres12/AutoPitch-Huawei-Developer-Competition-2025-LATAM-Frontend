"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es" | "pt" | "zh";

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  en: {
    workspace: "Workspace",
    dashboard: "Dashboard",
    library: "Library",
    upgrade: "Upgrade",
    signIn: "Sign In",
    switchLanguage: "Switch Language",
    localVideo: "Local Video",
    recordRealTime: "Record Real Time",
    tagline: "Turn your DEMOS into powerful Pitch Decks",
    uploadYourVideo: "Upload Your Video",
    dragOrClick: "Drag video files here or click to select files",
    controls: "Controls",
    startRecording: "Start Recording",
    stop: "Stop",
    willCapture: "Selected screen and microphone will be captured.",
    configuration: "Configuration",
    objective: "Objective",
    investors: "Investors",
    hackathon: "Hackathon",
    sales: "Sales",
    tone: "Tone",
    executive: "Executive",
    technical: "Technical",
    inspirational: "Inspirational",
    slidesCount: "Number of Slides",
    generatePitchDeck: "Generate Pitch Deck",
    createNew: "Create New Pitch Deck",
    subtitleCreate: "Upload your demo video and set parameters to generate your presentation",
    noneYet: "No items yet.",
    proSoon: "Pro plans coming soon with more minutes and exports.",
    confirmSwitch: "Switching tabs will remove the current video. Continue?",
  },
  es: {
    workspace: "Workspace",
    dashboard: "Dashboard",
    library: "Library",
    upgrade: "Upgrade",
    signIn: "Sign In",
    switchLanguage: "Cambiar idioma",
    localVideo: "Local Video",
    recordRealTime: "Record Real Time",
    tagline: "Convierte tus DEMOS en poderosos Pitch Decks",
    uploadYourVideo: "Sube tu video",
    dragOrClick: "Arrastra tu video aquí o haz click para seleccionar",
    controls: "Controles",
    startRecording: "Iniciar Grabación",
    stop: "Detener",
    willCapture: "Se capturará la pantalla elegida y el micrófono.",
    configuration: "Configuración",
    objective: "Objetivo",
    investors: "Inversores",
    hackathon: "Hackatón",
    sales: "Ventas",
    tone: "Tono",
    executive: "Ejecutivo",
    technical: "Técnico",
    inspirational: "Inspirador",
    slidesCount: "Número de Slides",
    generatePitchDeck: "Generar Pitch Deck",
    createNew: "Crear Nuevo Pitch Deck",
    subtitleCreate: "Sube tu video demo y define parámetros para tu presentación",
    noneYet: "No hay elementos aún.",
    proSoon: "Próximamente planes Pro con más minutos y exportaciones.",
    confirmSwitch: "Cambiar de pestaña eliminará el video actual. ¿Continuar?",
  },
  pt: {
    workspace: "Workspace",
    dashboard: "Dashboard",
    library: "Biblioteca",
    upgrade: "Upgrade",
    signIn: "Entrar",
    switchLanguage: "Mudar idioma",
    localVideo: "Vídeo Local",
    recordRealTime: "Gravar em Tempo Real",
    tagline: "Converta seus DEMOS em poderosos Pitch Decks",
    uploadYourVideo: "Envie seu vídeo",
    dragOrClick: "Arraste o vídeo aqui ou clique para selecionar",
    controls: "Controles",
    startRecording: "Iniciar Gravação",
    stop: "Parar",
    willCapture: "A tela e o microfone serão capturados.",
    configuration: "Configuração",
    objective: "Objetivo",
    investors: "Investidores",
    hackathon: "Hackathon",
    sales: "Vendas",
    tone: "Tom",
    executive: "Executivo",
    technical: "Técnico",
    inspirational: "Inspirador",
    slidesCount: "Número de Slides",
    generatePitchDeck: "Gerar Pitch Deck",
    createNew: "Criar Novo Pitch Deck",
    subtitleCreate: "Envie seu vídeo e defina os parâmetros",
    noneYet: "Ainda não há itens.",
    proSoon: "Planos Pro em breve com mais minutos e exportações.",
    confirmSwitch: "Mudar de aba removerá o vídeo atual. Continuar?",
  },
  zh: {
    workspace: "工作区",
    dashboard: "仪表盘",
    library: "库",
    upgrade: "升级",
    signIn: "登录",
    switchLanguage: "切换语言",
    localVideo: "本地视频",
    recordRealTime: "实时录制",
    tagline: "将你的演示转换成强大的Pitch Deck",
    uploadYourVideo: "上传你的视频",
    dragOrClick: "拖拽或点击选择视频文件",
    controls: "控制",
    startRecording: "开始录制",
    stop: "停止",
    willCapture: "将捕获所选屏幕和麦克风。",
    configuration: "配置",
    objective: "目标",
    investors: "投资人",
    hackathon: "黑客松",
    sales: "销售",
    tone: "语气",
    executive: "高管",
    technical: "技术",
    inspirational: "鼓舞",
    slidesCount: "页数",
    generatePitchDeck: "生成 Pitch Deck",
    createNew: "创建新的 Pitch Deck",
    subtitleCreate: "上传你的演示视频并设置参数",
    noneYet: "暂无内容。",
    proSoon: "专业版即将推出，提供更多分钟数和导出。",
    confirmSwitch: "切换标签将移除当前视频。继续？",
  },
};

type I18nContextType = {
  lang: Lang;
  t: (key: keyof typeof dictionaries["en"]) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ap_lang") : null;
    if (stored === "en" || stored === "es" || stored === "pt" || stored === "zh") {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("ap_lang", lang);
  }, [lang]);

  const value = useMemo<I18nContextType>(() => ({
    lang,
    t: (key) => dictionaries[lang][key] ?? key,
    setLang,
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}


