import { useState } from 'react';
import Login from './pages/Login';
import Top from './pages/Top';

export default function App() {
	const [currentUser, setCurrentUser] = useState<any | null>(null);

	if (!currentUser) {
		return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
	}

	return <Top />;
}
