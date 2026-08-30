import { Link } from "react-router-dom";
import { Text } from "@/ui/common/Text.tsx";

export function Setting() {
  return (
    <div className="flex flex-col justify-center items-center mt-6 mx-20 gap-4">
      <Link
        to="/setting/account"
        className="flex justify-center items-center bg-secondary text-xl rounded-lg py-1 w-full max-w-[1200px] hover:bg-primary"
        aria-label="アカウント設定"
      >
        <Text size="xl" weight="medium">
          アカウント設定
        </Text>
      </Link>
      <Link
        to="/setting/theme"
        className="flex justify-center items-center bg-secondary text-xl rounded-lg py-1 w-full max-w-[1200px] hover:bg-primary"
        aria-label="画面のテーマ"
      >
        <Text size="xl" weight="medium">
          画面のテーマ
        </Text>
      </Link>
    </div>
  );
}
