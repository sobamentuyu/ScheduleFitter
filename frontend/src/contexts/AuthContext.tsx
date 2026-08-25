import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
	id: number;
	email: string;
	userID: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	loginWithSso: () => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	// 1. 初回ロード時に保存されているユーザー情報を復元
	useEffect(() => {
		const savedUser = localStorage.getItem('schedulefitter_user');
		if (savedUser) {
			try {
				setUser(JSON.parse(savedUser));
			} catch (e) {
				localStorage.removeItem('schedulefitter_user');
			}
		}
		setLoading(false);
	}, []);

	// 2. SSOログイン実行（バックエンドへ問い合わせ）
	// 開発時はモックとして、ヘッダーに特定の値を付与してバックエンドに問い合わせる
	// 本番環境では、SSOのリダイレクトURLをバックエンドから取得してリダイレクトする形に変更する必要がある
	const loginWithSso = async () => {
		setLoading(true);
		try {
			const response = await fetch('http://localhost:8080/login.php', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Dev-User-Email': 'dev-user@example.com', // 開発時モックヘッダー
				},
			});

			if (!response.ok) {
				throw new Error(`認証に失敗しました (Status: ${response.status})`);
			}

			const data = await response.json();
			if (data.error || !data.user) {
				throw new Error(data.message || 'ユーザー情報の取得に失敗しました');
			}

			// 状態とローカルストレージを更新
			setUser(data.user);
			localStorage.setItem('schedulefitter_user', JSON.stringify(data.user));
		} finally {
			setLoading(false);
		}
	};

	// 3. ログアウト処理
	const logout = () => {
		setUser(null);
		localStorage.removeItem('schedulefitter_user');
	};

	return (
		<AuthContext.Provider value={{ user, loading, loginWithSso, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

// カスタムフック
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
