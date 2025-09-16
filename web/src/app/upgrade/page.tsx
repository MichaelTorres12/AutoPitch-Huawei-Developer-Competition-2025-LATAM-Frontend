import DashboardShell from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";

export default function UpgradePage() {
  const { t } = useI18n();
  return (
    <DashboardShell>
      <h1 className="text-2xl font-semibold">{t("upgrade")}</h1>
      <p className="mt-2 text-sm text-gray-600">{t("proSoon")}</p>
      <div className="mt-6 rounded-lg border p-6">
        <div className="text-sm text-gray-700">{t("proSoon")}</div>
      </div>
    </DashboardShell>
  );
}


