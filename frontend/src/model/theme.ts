export const themeNames = [
  "blue",
  "green",
  "red",
  "pink",
  "purple",
  "orange",
  "yellow",
] as const;

export type ThemeName = (typeof themeNames)[number];

export const defaultTheme: ThemeName = "purple";

export const THEME_STORAGE_KEY = "schedulefitter-theme";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (themeNames as readonly string[]).includes(value);
}
