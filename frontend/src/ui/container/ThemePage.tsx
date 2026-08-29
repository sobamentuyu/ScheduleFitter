import { Text } from "@/ui/common/Text.tsx";
export const ThemePage = ({ color, selected, onClick }: Props) => {
  const colorClass = {
    Blue: "bg-blue-500",
    Red: "bg-red-500",
    Green: "bg-green-500",
    Pink: "bg-pink-500",
    Yellow: "bg-yellow-500",
    Orange: "bg-orange-500",
    Purple: "bg-secondary",
  };

  console.log(color);
  console.log(colorClass[color]);
  return (
    <button
      onClick={onClick}
      className={`flex items-center bg-secondary text-primary-content rounded-lg w-full max-w-[1200px] py-1 hover:bg-primary ${selected ? "border-2 border-primary" : "border-2 border-transparent"}`}
    >
      <span
        className={`inline-block w-4 h-4 rounded-full ring-2 ring-white ml-3 ${colorClass[color]}`}
      ></span>
      <Text
        size="xl"
        weight="medium"
        className="ml-2 text-primary-content ml-3"
      >
        {color}
      </Text>
    </button>
  );
};
type Props = {
  color: "Blue" | "Green" | "Red" | "Pink" | "Purple" | "Orange" | "Yellow";
  selected: boolean;
  onClick: () => void;
};
