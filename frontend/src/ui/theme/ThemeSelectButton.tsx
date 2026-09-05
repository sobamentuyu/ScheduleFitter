import type { ThemeName } from "@/constants/theme";
import { Text } from "@/ui/common/Text.tsx";
type Props = {
  color: string;
  selected: boolean;
  onClick: () => void;
  theme: ThemeName;
};
const themeColorClass: Record<ThemeName, string> = {
  purple: "#e8b8e6",
  blue: "#a3bce2",
  orange: "#fcd7a1",
  yellow: "#fbf5b6",
  pink: "#f5bce3",
  red: "#f5b2b2",
  green: "#a2d7d4",
};

export const ThemeSelectButton = (props: Props) => {
  return (
    <button
      onClick={props.onClick}
      className={`flex items-center bg-secondary text-primary-content rounded-lg w-full max-w-[1200px] py-1 hover:bg-primary ${props.selected ? "border-2 border-primary" : "border-2 border-transparent"}`}
    >
      <span
        className="inline-block w-4 h-4 rounded-full ring-2 ring-white ml-3"
        style={{ backgroundColor: themeColorClass[props.theme] }}
      ></span>
      <Text
        size="xl"
        weight="medium"
        className="ml-2 text-primary-content ml-3"
      >
        {props.color}
      </Text>
    </button>
  );
};
