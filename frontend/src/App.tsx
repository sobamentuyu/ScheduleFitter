import { useState } from 'react';
import Login from './pages/Login';
import Top from './pages/Top';

export interface User {
	id: number;
	email: string;
	name: string;
}

export default function App() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	if (!currentUser) {
		return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
	}

	return <Top user={currentUser} onLogout={() => setCurrentUser(null)} />;
}
