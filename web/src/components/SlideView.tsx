"use client";
import Image from "next/image";
import { DeckSlide } from "@/lib/deck";

export type SlideTheme = {
  bgGradient: string;
  titleClass: string;
};

export default function SlideView({ slide, theme }: { slide: DeckSlide; theme: SlideTheme }) {
  const layout = slide.layout || "titleBullets";

  if (layout === "cover") {
    return (
      <div className={`h-full flex flex-col`}> 
        <div className={`flex-1 relative bg-gradient-to-br ${theme.bgGradient}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {slide.imageUrl ? (
              <div className="relative w-[70%] h-[60%]">
                <Image src={slide.imageUrl} alt={slide.title} fill className="object-contain" />
              </div>
            ) : null}
          </div>
        </div>
        <div className="bg-white py-10 text-center">
          <div className={`text-4xl font-extrabold ${theme.titleClass}`}>{slide.title}</div>
          {slide.bullets?.[0] && <div className="mt-2 text-gray-600">{slide.bullets[0]}</div>}
        </div>
      </div>
    );
  }

  if (layout === "imageLeft" || layout === "imageRight") {
    const image = (
      <div className="flex-1 relative bg-white grid place-items-center p-6">
        {slide.imageUrl ? (
          <div className="relative w-full h-full">
            <Image src={slide.imageUrl} alt={slide.title} fill className="object-contain" />
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Sin imagen</div>
        )}
      </div>
    );
    const content = (
      <div className="flex-1 bg-white p-8">
        <h1 className={`text-3xl font-bold mb-4 ${theme.titleClass}`}>{slide.title}</h1>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {slide.bullets?.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    );
    return (
      <div className="h-full flex flex-col">
        <div className={`h-2 bg-gradient-to-r ${theme.bgGradient}`} />
        <div className="flex-1 grid grid-cols-2">{layout === "imageLeft" ? (<>{image}{content}</>) : (<>{content}{image}</>)}</div>
      </div>
    );
  }

  if (layout === "quote") {
    return (
      <div className={`h-full flex flex-col`}> 
        <div className={`flex-1 bg-gradient-to-br ${theme.bgGradient} grid place-items-center p-8`}>
          <blockquote className="max-w-3xl bg-white/90 rounded-xl shadow p-8 text-center">
            <div className={`text-2xl font-semibold ${theme.titleClass}`}>“{slide.bullets?.[0] || slide.title}”</div>
            <div className="mt-3 text-gray-600">{slide.bullets?.[1]}</div>
          </blockquote>
        </div>
      </div>
    );
  }

  // default: title + bullets stacked
  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 bg-gradient-to-br ${theme.bgGradient} grid place-items-center`}> 
        {slide.imageUrl && (
          <div className="relative w-[68%] h-[55%]">
            <Image src={slide.imageUrl} alt={slide.title} fill className="object-contain" />
          </div>
        )}
      </div>
      <div className="bg-white p-10">
        <h1 className={`text-3xl font-bold text-center mb-4 ${theme.titleClass}`}>{slide.title}</h1>
        <ul className="max-w-2xl mx-auto list-disc list-inside text-gray-700 space-y-2">
          {slide.bullets?.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


