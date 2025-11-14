"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Save, CheckCircle } from "lucide-react";
import { useAnnotations, useAnnotationEnabled } from "@/hooks/useAnnotations";
import { AnnotationType } from "@/lib/annotations/config";
import { cn } from "@/lib/utils";

/**
 * Annotations Manager Component
 *
 * Admin panel to toggle annotations, guides, and documentation features
 * without modifying code
 */
export function AnnotationsManager() {
  const { config, toggle, reset, getStats } = useAnnotations();
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState<"all" | "accessibility" | "performance" | "security" | "deployment" | "quality">("all");

  const stats = getStats();

  // Auto-hide save confirmation after 2 seconds
  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleToggle = (type: AnnotationType) => {
    toggle(type);
    setSaved(true);
  };

  const handleReset = () => {
    if (window.confirm("Reset all annotations to default? This action cannot be undone.")) {
      reset();
      setSaved(true);
    }
  };

  // Filter annotations by category
  const filteredAnnotations = Object.entries(config).filter(([, annotation]) => {
    if (category === "all") return true;
    return annotation.category === category;
  });

  const categoryIcons: Record<string, string> = {
    accessibility: "♿",
    performance: "⚡",
    security: "🔒",
    deployment: "☁️",
    quality: "✅",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Annotations Manager</h2>
        <p className="text-muted-foreground">
          Toggle documentation features and guides without modifying code
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Annotations</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enabled</p>
              <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold text-orange-600">{stats.disabled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(stats.byCategory).map(([cat, count]) => (
          <Card key={cat} className="sm:col-span-1">
            <CardContent className="pt-4">
              <div className="space-y-2 text-center">
                <p className="text-2xl">{categoryIcons[cat]}</p>
                <p className="text-xs font-medium capitalize">{cat}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Annotations List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable annotations and guides</CardDescription>
            </div>
            <div className="flex gap-2">
              {saved && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Category Tabs */}
          <Tabs value={category} onValueChange={(val) => setCategory(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="accessibility">♿ A11y</TabsTrigger>
              <TabsTrigger value="performance">⚡ Perf</TabsTrigger>
              <TabsTrigger value="security">🔒 Security</TabsTrigger>
              <TabsTrigger value="deployment">☁️ Deploy</TabsTrigger>
              <TabsTrigger value="quality">✅ Quality</TabsTrigger>
            </TabsList>

            {/* All Categories Content */}
            <TabsContent value="all" className="space-y-4">
              {filteredAnnotations.map(([type, annotation]) => (
                <AnnotationItem
                  key={type}
                  type={type as AnnotationType}
                  annotation={annotation}
                  onToggle={handleToggle}
                />
              ))}
            </TabsContent>

            {/* Category-specific Content */}
            {["accessibility", "performance", "security", "deployment", "quality"].map((cat) => (
              <TabsContent key={cat} value={cat} className="space-y-4">
                {filteredAnnotations.map(([type, annotation]) => (
                  <AnnotationItem
                    key={type}
                    type={type as AnnotationType}
                    annotation={annotation}
                    onToggle={handleToggle}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual annotation item with toggle
 */
interface AnnotationItemProps {
  type: AnnotationType;
  annotation: any;
  onToggle: (type: AnnotationType) => void;
}

function AnnotationItem({ type, annotation, onToggle }: AnnotationItemProps) {
  const enabled = useAnnotationEnabled(type);

  return (
    <div className={cn(
      "flex items-start justify-between p-4 rounded-lg border transition-colors",
      enabled ? "bg-green-50/50 border-green-200/50 dark:bg-green-900/10 dark:border-green-800/30" : "bg-muted/50 border-muted"
    )}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{annotation.title}</h3>
          <Badge variant={enabled ? "default" : "secondary"}>
            Phase {annotation.phase}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {annotation.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{annotation.description}</p>
        {annotation.documentPath && (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
            📄 {annotation.documentPath}
          </p>
        )}
      </div>

      <div className="ml-4 pt-1">
        <Switch
          checked={enabled}
          onCheckedChange={() => onToggle(type)}
          aria-label={`Toggle ${annotation.title}`}
        />
      </div>
    </div>
  );
}
