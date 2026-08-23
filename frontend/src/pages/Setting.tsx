import { Link } from "react-router-dom";

export function Setting() {
  return (
    <div className="flex flex-col justify-center mt-6 mx-20 gap-4">
      <Link
        to="/setting/account"
        className="flex justify-center items-center bg-secondary text-2xl rounded-lg py-1"
        aria-label="アカウント設定"
      >
        アカウント設定
      </Link>
      <Link
        to="/setting/theme"
        className=" flex justify-center items-center bg-secondary text-2xl rounded-lg py-1"
        aria-label="画面のテーマ"
      >
        画面のテーマ
      </Link>
    </div>
  );
}
