import { ShieldCheck, Bell, Search } from "lucide-react";

export function AppNavbar() {
  return (
    <header className="surface-panel flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-2xl border border-border bg-primary/15 text-primary"
        >
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Navbar Placeholder</p>
          <p className="truncate text-xs text-muted-foreground">
            Global search, alerts, environment switcher, and account controls will
            live here in later phases.
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <PlaceholderPill label="Search" icon={<Search className="size-4" />} />
        <PlaceholderPill label="Alerts" icon={<Bell className="size-4" />} />
      </div>
    </header>
  );
}

type PlaceholderPillProps = {
  label: string;
  icon: React.ReactNode;
};

function PlaceholderPill({ label, icon }: PlaceholderPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
