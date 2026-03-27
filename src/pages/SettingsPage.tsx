import { Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <p className="section-kicker">System Configuration</p>
        <h1 className="page-header">Settings</h1>
        <p className="page-description max-w-2xl">
          Prepare this workspace for future environment, integration, and academic policy controls without breaking the new visual language.
        </p>
      </section>

      <section className="data-card flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[hsl(var(--accent-violet))/0.16] bg-[hsl(var(--accent-violet))/0.12]">
          <Settings className="h-7 w-7 text-[hsl(var(--accent-violet))]" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">Settings Panel Ready</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          This page is now visually aligned with the rest of the platform and can be connected to backend-driven configuration modules whenever you are ready.
        </p>
      </section>
    </div>
  );
};

export default SettingsPage;
