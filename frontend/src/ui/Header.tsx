import { CaretLeftIcon, GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
const pageConfig: Record<
  string,
  { title: string; showBack: boolean; backTo: string }
> = {
  "/setting": { title: "設定", showBack: true, backTo: "/" },
  "/setting/account": {
    title: "アカウント設定",
    showBack: true,
    backTo: "/setting",
  },
  "/setting/theme": {
    title: "画面のテーマ",
    showBack: true,
    backTo: "/setting",
  },
};
export function Header() {
  const pathname = useLocation().pathname;
  const current = pageConfig[pathname];
  return (
    <header className="sticky top-0 bg-primary px-6 py-3.5 text-primary-content shadow-md flex items-center justify-between">
      {current?.showBack ? (
        <div className="flex items-center gap-2">
          <Link to={current.backTo} aria-label="戻る">
            <CaretLeftIcon size={24} weight="regular" />
          </Link>
          <h1 className="text-2xl">{current.title}</h1>
        </div>
      ) : (
        <h1 className="text-2xl">ScheduleFitter</h1>
      )}
      <div className="flex items-center gap-3">
        {!current && (
          <Link to="/setting" aria-label="設定">
            <GearIcon size={24} weight="regular" />
          </Link>
        )}
        <button type="button" aria-label="ログアウト">
          <SignOutIcon size={24} weight="regular" />
        </button>
      </div>
    </header>
  );
}
