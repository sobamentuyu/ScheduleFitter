import { createContext } from "react";

export interface User {
	id: number;
	email: string;
	userId: string;
}

type AuthContextType = {
	user: User | null;
	loading: boolean;
	loginWithSso: () => Promise<void>;
	logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
