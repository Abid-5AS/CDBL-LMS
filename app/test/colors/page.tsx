import ColorSystemTest from "@/components/shared/ColorSystemTest";

export default function ColorsTestPage() {
  return (
    <main className="min-h-screen bg-card dark:bg-card/90 text-foreground dark:text-foreground/90">
      <section className="max-w-6xl mx-auto py-8 px-4 sm:px-8 space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80 uppercase tracking-[0.2em]">
            System Tools
          </p>
          <h1 className="text-3xl font-semibold">Semantic Color Sandbox</h1>
          <p className="text-muted-foreground dark:text-muted-foreground/80 max-w-3xl">
            This page renders every semantic token so designers and engineers can
            verify contrast, soft/strong ramps, and light/dark parity. Toggle
            the theme switcher in the shell to validate both palettes.
          </p>
        </header>
        <ColorSystemTest />
      </section>
    </main>
  );
}
