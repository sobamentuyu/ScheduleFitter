import { useState } from 'react';

interface User {
	id: string;
	email: string;
}

interface LoginProps {
	onLoginSuccess?: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSsoLogin = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch('http://localhost:8080/login.php', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					// 開発環境用のダミーメールアドレス（PHP側のAuthContextで受け取る）
					'X-Dev-User-Email': 'dev-user@example.com',
				},
			});

			if (!response.ok) {
				throw new Error(`認証エラーが発生しました: HTTP ${response.status}`);
			}

			const data = await response.json();
			console.log('ログイン成功レスポンス:', data);

			// 3. 親コンポーネント（App.tsxなど）へログイン成功を通知
			if (onLoginSuccess && data.user) {
				onLoginSuccess(data.user);
			}
		} catch (err) {
			console.error(err);
			setError(err instanceof Error ? err.message : '通信に失敗しました');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-base-200">
			<div className="card w-96 bg-base-100 shadow-xl border border-base-300">
				<div className="card-body text-center">
					<h2 className="card-title justify-center text-2xl font-bold">ScheduleFitter</h2>
					<p className="text-sm text-base-content/70 mt-1">組織のSSOアカウントを使用してログイン</p>

					{/* エラーメッセージ表示枠 */}
					{error && (
						<div className="alert alert-error mt-4 text-xs py-2">
							<span>{error}</span>
						</div>
					)}

					{/* SSO認証ボタン（仮置き） */}
					<div className="card-actions mt-6 justify-center">
						<button
							type="button"
							className="btn btn-primary w-full"
							onClick={handleSsoLogin}
							disabled={loading}
						>
							{loading ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								'SSOでログイン（認証連携）'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
