import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
	isAuthenticated: boolean;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
	getToken: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

	useEffect(() => {
		const storedToken = localStorage.getItem('token');
		if (storedToken) {
			setToken(storedToken);
		}
	}, []);

	const login = (newToken: string) => {
		localStorage.setItem('token', newToken);
		setToken(newToken);
	};

	const logout = () => {
		localStorage.removeItem('token');
		setToken(null);
	};

	const getToken = () => token;

	return (
		<AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout, getToken }}>
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
