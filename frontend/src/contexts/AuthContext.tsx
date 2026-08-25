import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
	id: number;
	email: string;
	userId: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	loginWithSso: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	// 初回ロード時: Cookie のセッションを使ってユーザー情報を取得
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await fetch('http://localhost:8080/me.php', {
					method: 'GET',
					credentials: 'include', // Cookie を送信
				});

				if (res.ok) {
					const data = await res.json();
					if (data.authenticated && data.user) {
						setUser(data.user);
					}
				}
			} catch (err) {
				console.error('セッション確認エラー:', err);
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
	}, []);

	// SSOログイン処理
	const loginWithSso = async () => {
		setLoading(true);
		try {
			const response = await fetch('http://localhost:8080/login.php', {
				method: 'GET',
				credentials: 'include', // Set-Cookie を受け取る
				headers: {
					'Content-Type': 'application/json',
					'X-Dev-User-Email': 'dev-user@example.com',
				},
			});

			if (!response.ok) {
				throw new Error(`認証に失敗しました (Status: ${response.status})`);
			}

			const data = await response.json();
			if (data.error || !data.user) {
				throw new Error(data.message || 'ログインに失敗しました');
			}

			setUser(data.user);
		} finally {
			setLoading(false);
		}
	};

	// ログアウト処理
	const logout = async () => {
		try {
			await fetch('http://localhost:8080/logout.php', {
				method: 'POST',
				credentials: 'include',
			});
		} catch (err) {
			console.error('ログアウトエラー:', err);
		} finally {
			setUser(null);
		}
	};

	return (
		<AuthContext.Provider value={{ user, loading, loginWithSso, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
