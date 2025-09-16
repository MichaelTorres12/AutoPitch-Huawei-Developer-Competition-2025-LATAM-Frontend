import DashboardShell from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";

export default function LibraryPage() {
  const { t } = useI18n();
  return (
    <DashboardShell>
      <h1 className="text-2xl font-semibold">{t("library")}</h1>
      <p className="mt-2 text-sm text-gray-600">{t("noneYet")}</p>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-sm text-gray-600">{t("noneYet")}</div>
      </div>
    </DashboardShell>
  );
}


