import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
        <SunMedium className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme !== "light";

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 rounded-full border-white/10 bg-white/5 backdrop-blur-xl"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
