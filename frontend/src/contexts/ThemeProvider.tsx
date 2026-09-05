import type { ThemeName } from "@/constants/theme.ts";
import { defaultTheme } from "@/constants/theme.ts";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "@/contexts/theme.ts";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
