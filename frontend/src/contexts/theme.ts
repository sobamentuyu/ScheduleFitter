import { createContext } from "react";
import type { ThemeName } from "@/constants/theme.ts";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
