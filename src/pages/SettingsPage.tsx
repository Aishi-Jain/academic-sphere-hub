import { Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div><h1 className="page-header">Settings</h1><p className="page-description">System configuration</p></div>
      <div className="stat-card flex flex-col items-center justify-center py-16 space-y-3">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          <Settings className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Settings panel — connect to backend APIs to configure.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
