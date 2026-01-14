"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { WidgetGrid, EditModeToolbar } from "@/components/dashboard";
import { useIsEditMode } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { Feature, useFeature } from "@/lib/config";
import { StatsCard } from "@/components/shared";
import { Users, Activity, TrendingUp, Clock } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const isEditMode = useIsEditMode();
  const dashboardPersonalizationEnabled = useFeature("dashboardPersonalization");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={isEditMode ? t("editMode") : t("welcome")}
      >
        <Feature name="dashboardPersonalization">
          <EditModeToolbar />
        </Feature>
      </PageHeader>

      {dashboardPersonalizationEnabled ? (
        <>
          {/* Edit mode indicator */}
          {isEditMode && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
              <strong>{t("editMode")}:</strong> {t("customizeDescription")}
            </div>
          )}

          {/* Widget Grid */}
          <div className={cn(
            "transition-all duration-200",
            isEditMode && "ring-2 ring-primary/20 rounded-lg p-4 -m-4"
          )}>
            <WidgetGrid />
          </div>
        </>
      ) : (
        /* Fallback when dashboard personalization is disabled */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value="1,234"
            description="Active users this month"
            icon={Users}
          />
          <StatsCard
            title="Activity"
            value="89%"
            description="User engagement rate"
            icon={Activity}
          />
          <StatsCard
            title="Growth"
            value="+12.5%"
            description="Compared to last month"
            icon={TrendingUp}
          />
          <StatsCard
            title="Uptime"
            value="99.9%"
            description="System availability"
            icon={Clock}
          />
        </div>
      )}
    </div>
  );
}
