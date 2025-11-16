# UI Enhancement TODO

- [x] Layered shell background component with gradients, grid overlay, and accessibility-friendly fallbacks.
- [x] Adopt shadcn-inspired typography primitives and apply them to shared dashboard headers.
- [x] Replace emoji-based role glyphs with a consistent Lucide-driven `RoleIndicator` component and wire it into admin views.
- [x] Rework analytics filter bar for responsive behavior and add inline active-filter summaries.
- [x] Refresh high-density tables with solid surfaces, zebra striping, sticky headers, and repositioned pagination.
- [x] Reduce aggressive `glass-card` transparency (especially for dense data) and add `prefers-reduced-transparency` fallbacks.
- [x] Prefetch HR Admin KPI + stats data on the server and hydrate SWR with fallback data to eliminate the post-login loading gap.
- [x] Swap HR Admin dashboard components to the unified Neo `surface-card` primitives for consistent styling across sections.
- [x] Upgrade `/reports` with surface cards, richer analytics, and actionable widgets (availability, compliance, exports).
- [x] Refresh HR Head dashboard with surface cards, insights sidebar, and actionable panels.
- [x] Refresh Dept Head dashboard with the new design system.
- [ ] Refresh CEO dashboard with the new design system.
- [ ] Refresh Manager dashboard with the new design system.
- [ ] Employee experience refresh:
  - [x] Modernize employee dashboard/home (hero, quick metrics, availability, alerts, date context).
  - [x] Redesign Apply Leave flow with live balance chips, inline policy hints, and persistent “Today” chip.
  - [ ] Upgrade My Leaves history with timeline/table toggle + filters and the new surface cards.
  - [ ] Align Balance, Holidays, Policies, FAQ pages with the new shell and contextual date helpers.
