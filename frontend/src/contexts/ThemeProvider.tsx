import type { ThemeName } from "@/constants/theme.ts";
import { defaultTheme, isThemeName, THEME_STORAGE_KEY } from "@/constants/theme.ts";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "@/contexts/theme.ts";

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function persistTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // private mode などでは保存できないことがある
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
