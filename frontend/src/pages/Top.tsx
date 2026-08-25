import { useAuth } from '../contexts/AuthContext';

export default function Top() {
	const { user, logout } = useAuth();

	return (
		<div className="min-h-screen bg-base-100 p-6">
			{/* ユーザー情報の表示 */}
			{/* ユーザー名情報の表示は以下の形式 */}
			<div className="mb-4">
				<p>ユーザー名: {user?.name}</p>
				<p>ユーザーID: {user?.id}</p>
				<p>ユーザーEメール: {user?.email}</p>
			</div>
			{/* ログアウトボタン */}
			<button className="btn btn-outline btn-error btn-sm" onClick={logout}>
				ログアウト
			</button>
		</div>
	);
}
