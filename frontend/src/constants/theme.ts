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
