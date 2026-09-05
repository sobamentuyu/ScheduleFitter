import { ThemePage } from "@/ui/container/ThemePage.tsx";
import {
  themeNames,
  useTheme,
  type ThemeName,
} from "@/contexts/ThemeContext.tsx";

const labels: Record<ThemeName, string> = {
  blue: "Blue",
  green: "Green",
  red: "Red",
  pink: "Pink",
  purple: "Purple",
  orange: "Orange",
  yellow: "Yellow",
};
export function Theme() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col justify-center items-center mt-6 mx-20 gap-4 ">
      {themeNames.map((themeName) => (
        <ThemePage
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
