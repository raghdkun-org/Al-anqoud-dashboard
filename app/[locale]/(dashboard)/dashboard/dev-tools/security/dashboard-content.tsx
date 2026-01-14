"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { SecurityMonitor } from "@/components/security";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export function SecurityDashboardContent() {
  const t = useTranslations("devTools.security");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* Development Warning */}
      <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t("badge")}</AlertTitle>
        <AlertDescription>
          {t("description")}
        </AlertDescription>
      </Alert>

      {/* Security Monitor Component */}
      <SecurityMonitor />
    </div>
  );
}
