import { ThemePage } from "@/ui/container/ThemePage.tsx";
import { useState } from "react";
import { useEffect } from "react";
export function Theme() {
  const colors = [
    "Blue",
    "Green",
    "Red",
    "Pink",
    "Purple",
    "Orange",
    "Yellow",
  ] as const;
  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    return localStorage.getItem("selectedColor") ?? "Purple";
  });
  useEffect(() => {
    if (selectedColor !== null) {
      localStorage.setItem("selectedColor", selectedColor);
    }
  }, [selectedColor]);

  return (
    <div className="flex flex-col justify-center items-center mt-6 mx-20 gap-4 ">
      {colors.map((color) => (
        <ThemePage
          key={color}
          color={color}
          selected={selectedColor === color}
          onClick={() => setSelectedColor(color)}
        />
      ))}
    </div>
  );
}
