import type { ThemeName } from "@/constants/theme";
import { ThemeSelectButton } from "@/ui/theme/ThemeSelectButton.tsx";
import { useTheme } from "@/hooks/useTheme.ts";
import { themeNames } from "@/constants/theme.ts";
export const labels: Record<ThemeName, string> = {
  blue: "Blue",
  green: "Green",
  red: "Red",
  pink: "Pink",
  purple: "Purple",
  orange: "Orange",
  yellow: "Yellow",
};
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col justify-center items-center mt-6 mx-20 gap-4 ">
      {themeNames.map((themeName) => (
        <ThemeSelectButton
          key={themeName}
          color={labels[themeName]}
          selected={theme === themeName}
          onClick={() => setTheme(themeName)}
          theme={themeName}
        />
      ))}
    </div>
  );
}
