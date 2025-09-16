"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Library, Rocket, Globe } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";


type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <FolderOpen className="w-4 h-4" /> },
  { href: "/library", label: "Library", icon: <Library className="w-4 h-4" /> },
  { href: "/upgrade", label: "Upgrade", icon: <Rocket className="w-4 h-4" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();

  return (
    <aside className="border-r px-4 py-6 flex flex-col gap-6 bg-white h-full overflow-y-auto">
      <div className="text-sm font-semibold tracking-wide text-gray-500">{t("workspace")}</div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              <span>{item.href === "/" ? t("dashboard") : item.href === "/library" ? t("library") : t("upgrade")}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="text-xs text-gray-500">{t("switchLanguage")}</div>
        <div className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={lang}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLang(e.target.value as Lang)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <button className="h-10 rounded-md bg-gray-900 text-white text-sm">{t("signIn")}</button>
      </div>
    </aside>
  );
}


