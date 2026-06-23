import { Layers3, Shield, Workflow } from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    title: "Platform",
    items: ["Workspace Navigation", "Threat Modules", "Shared Filters"],
    icon: Shield,
  },
  {
    title: "Operations",
    items: ["Queues Placeholder", "Review Flows", "Case Management"],
    icon: Workflow,
  },
  {
    title: "System",
    items: ["Design Tokens", "Component Library", "Environment Config"],
    icon: Layers3,
  },
] as const;

export function AppSidebar() {
  return (
    <aside
      aria-label="Primary navigation placeholder"
      className="surface-panel hidden min-h-[calc(100svh-2rem)] flex-col overflow-hidden lg:flex"
    >
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="eyebrow-label">Sentinel AI</p>
        <h2 className="mt-2 text-lg font-semibold text-sidebar-foreground">
          Sidebar Placeholder
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Phase 0 includes the shell only. Feature navigation will be added in
          later phases.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-5">
        {SIDEBAR_SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.title}
              aria-labelledby={`${section.title}-title`}
              className="rounded-2xl border border-sidebar-border bg-sidebar/80 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3
                  id={`${section.title}-title`}
                  className="text-sm font-medium text-sidebar-foreground"
                >
                  {section.title}
                </h3>
              </div>

              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-transparent bg-background/40 px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
