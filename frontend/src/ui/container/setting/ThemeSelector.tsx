import type { ThemeName } from "@/model/theme.ts";
import { ThemeSelectButton } from "@/ui/container/setting/ThemeSelectButton.tsx";
import { useTheme } from "@/hooks/useTheme.ts";
import { themeNames } from "@/model/theme.ts";

const labels: Record<ThemeName, string> = {
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
    <div className="flex flex-col justify-center items-center gap-4 mt-6 mx-20 w-full max-w-[1200px]">
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
