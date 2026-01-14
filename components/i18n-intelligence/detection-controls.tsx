/**
 * i18n Intelligence Dashboard - Detection Controls
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useI18nIntelligenceStore } from "@/lib/i18n-intelligence";

export function DetectionControls() {
  const t = useTranslations("devTools.i18n");
  const config = useI18nIntelligenceStore((s) => s.config);
  const isDetecting = useI18nIntelligenceStore((s) => s.isDetecting);
  const toggleDetection = useI18nIntelligenceStore((s) => s.toggleDetection);
  const updateConfig = useI18nIntelligenceStore((s) => s.updateConfig);
  const recalculateHealth = useI18nIntelligenceStore((s) => s.recalculateHealth);
  const clearAllIssues = useI18nIntelligenceStore((s) => s.clearAllIssues);
  const clearResolvedIssues = useI18nIntelligenceStore((s) => s.clearResolvedIssues);
  const exportData = useI18nIntelligenceStore((s) => s.exportData);
  const importData = useI18nIntelligenceStore((s) => s.importData);
  const reset = useI18nIntelligenceStore((s) => s.reset);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i18n-intelligence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importData(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{t("controls.title")}</CardTitle>
          <Badge variant={isDetecting ? "default" : "secondary"}>
            {isDetecting ? t("controls.active") : t("controls.paused")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t("controls.detectionActive")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("controls.detectionHint")}
            </p>
          </div>
          <Button
            variant={isDetecting ? "default" : "outline"}
            size="sm"
            onClick={() => toggleDetection()}
          >
            {isDetecting ? (
              <>
                <Pause className="h-4 w-4 me-1" /> {t("controls.pause")}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 me-1" /> {t("controls.start")}
              </>
            )}
          </Button>
        </div>

        {/* Detection Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="detect-missing" className="text-sm">
              {t("controls.missingKeys")}
            </Label>
            <Switch
              id="detect-missing"
              checked={config.detectMissingKeys}
              onCheckedChange={(checked: boolean) =>
                updateConfig({ detectMissingKeys: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="detect-fallback" className="text-sm">
              {t("controls.fallbackUsage")}
            </Label>
            <Switch
              id="detect-fallback"
              checked={config.detectFallbackUsage}
              onCheckedChange={(checked: boolean) =>
                updateConfig({ detectFallbackUsage: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="detect-rtl" className="text-sm">
              {t("controls.rtlIssues")}
            </Label>
            <Switch
              id="detect-rtl"
              checked={config.detectRTLIssues}
              onCheckedChange={(checked: boolean) =>
                updateConfig({ detectRTLIssues: checked })
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={recalculateHealth}>
            <RotateCcw className="h-4 w-4 me-1" />
            {t("controls.refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 me-1" />
            {t("controls.export")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 me-1" />
            {t("controls.import")}
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={clearResolvedIssues}
            className="text-yellow-600 hover:text-yellow-700"
          >
            {t("controls.clearResolved")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllIssues}
            className="text-orange-600 hover:text-orange-700"
          >
            {t("controls.clearAll")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(t("controls.resetConfirm"))) {
                reset();
              }
            }}
          >
            <Trash2 className="h-4 w-4 me-1" />
            {t("controls.reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
