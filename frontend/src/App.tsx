import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Top from './pages/Top';

export default function App() {
	const { user, loading } = useAuth();

	// 初期化中（ローカルストレージ確認中）のチラつき防止
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-base-200">
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	}

	return user ? <Top /> : <Login />;
}
