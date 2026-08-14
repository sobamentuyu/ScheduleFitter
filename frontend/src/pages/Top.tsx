// frontend/src/pages/Top.tsx
import { User } from '../App'; // または共通の types からインポート

interface TopProps {
	user: User;
	onLogout: () => void;
}

export default function Top({ user, onLogout }: TopProps) {
	return (
		<div className="min-h-screen bg-base-100 p-6">
			<header className="flex justify-between items-center pb-4 border-b border-base-300">
				<div>
					<h1 className="text-2xl font-bold">ScheduleFitter</h1>
					<p className="text-sm text-base-content/70">
						ようこそ、<span className="font-semibold">{user.name}</span> さん（{user.email}）
					</p>
				</div>

				{/* ログアウトボタン */}
				<button className="btn btn-outline btn-sm" onClick={onLogout}>
					ログアウト
				</button>
			</header>

			<main className="mt-6">
				{/* ここにカレンダーや予定一覧のコンテンツを配置 */}
				<div className="card bg-base-200 p-6">
					<h2 className="text-lg font-bold mb-2">メインコンテンツ</h2>
					<p>ここにスケジュールや衝突判定のUIを実装していきます。</p>
				</div>
			</main>
		</div>
	);
}
