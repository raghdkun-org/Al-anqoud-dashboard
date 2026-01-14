"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { SecurityMonitor } from "@/components/security";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { useFeature } from "@/lib/config";

export function SecurityDashboardContent() {
  const t = useTranslations("devTools.security");
  const securityMonitorEnabled = useFeature("securityMonitor");

  // Show disabled message if security monitor feature is off
  if (!securityMonitorEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("title")}
          description={t("description")}
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Disabled</AlertTitle>
          <AlertDescription>
            The Security Monitor feature is currently disabled. Contact your administrator to enable it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
