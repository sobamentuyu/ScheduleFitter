import { CaretLeftIcon, GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const isSetting = useLocation().pathname === "/setting";
  return (
    <header className="sticky top-0 bg-primary px-6 py-3.5 text-primary-content shadow-md flex items-center justify-between">
      {isSetting ? (
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="戻る">
            <CaretLeftIcon size={24} weight="regular" />
          </Link>
          <h1 className="text-2xl">設定</h1>
        </div>
      ) : (
        <h1 className="text-2xl">ScheduleFitter</h1>
      )}
      <div className="flex items-center gap-3">
        {!isSetting && (
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
