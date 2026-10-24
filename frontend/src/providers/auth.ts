import { createContext } from "react";
import type { User } from "@/entities/user.ts";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  loginWithSso: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
