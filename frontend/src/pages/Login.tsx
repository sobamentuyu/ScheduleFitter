import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
	const { loginWithSso } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async () => {
		setLoading(true);
		setError(null);
		try {
			await loginWithSso();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'ログイン処理中にエラーが発生しました');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-base-200">
			<div className="card w-96 bg-base-100 shadow-xl border border-base-300">
				<div className="card-body text-center">
					<h2 className="card-title justify-center text-2xl font-bold">ScheduleFitter</h2>
					<p className="text-sm text-base-content/70 mt-1">組織アカウント（SSO）でログイン</p>

					{error && (
						<div className="alert alert-error mt-4 text-xs py-2">
							<span>{error}</span>
						</div>
					)}

					<div className="card-actions mt-6 justify-center">
						<button
							type="button"
							className="btn btn-primary w-full"
							onClick={handleLogin}
							disabled={loading}
						>
							{loading ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								'SSOでログイン'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
