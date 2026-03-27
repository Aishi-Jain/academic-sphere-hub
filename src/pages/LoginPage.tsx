import { useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, GraduationCap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roles = [
  { key: "admin", label: "Admin", icon: ShieldCheck },
  { key: "faculty", label: "Faculty", icon: GraduationCap },
  { key: "student", label: "Student", icon: UserRound },
];

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const presetRole = searchParams.get("role");
  const [selectedRole, setSelectedRole] = useState(
    roles.some((role) => role.key === presetRole) ? presetRole! : "admin"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedRoleMeta = useMemo(
    () => roles.find((role) => role.key === selectedRole) || roles[0],
    [selectedRole]
  );

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user_id,
          role: data.role,
          username: data.username,
          reference_id: data.reference_id,
        }),
      );

      if (data.role === "admin") window.location.href = "/AdminDashboard";
      else if (data.role === "faculty") window.location.href = "/FacultyDashboard";
      else window.location.href = "/StudentDashboard";
    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(22,217,255,0.22),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.3),transparent_28%),linear-gradient(180deg,#04060b_0%,#09111d_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_45%,transparent_70%)] opacity-60" />

      <div className="relative z-10 flex w-full max-w-6xl items-center justify-center">
        <div className="glass-panel relative w-full max-w-[520px] overflow-hidden rounded-[36px] border border-white/10 px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_100px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-y-0 left-0 w-[1px] bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_center,rgba(22,217,255,0.22),transparent_65%)]" />

          <div className="relative space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Academic Sphere Hub</p>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">Login with</h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Continue to your academic control surface with the {selectedRoleMeta.label.toLowerCase()} experience preselected.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`rounded-full border px-4 py-3 text-sm transition ${
                    selectedRole === role.key
                      ? "border-primary/70 bg-primary/15 text-foreground shadow-[0_0_24px_var(--glow-cyan)]"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <role.icon className="h-4 w-4" />
                    {role.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username</label>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={`Enter your ${selectedRoleMeta.label.toLowerCase()} username`}
                  className="h-12 rounded-full bg-white/[0.06] px-5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-full bg-white/[0.06] px-5 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                onClick={handleLogin}
                className="h-12 w-full rounded-full text-base"
                disabled={loading}
              >
                <LockKeyhole className="h-4 w-4" />
                {loading ? "Signing in..." : `Login as ${selectedRoleMeta.label}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
