import { createContext, useContext } from "react";
import { apiRequest } from "./queryClient";

// Types
export type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  profileImage?: string;
};

export type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName?: string;
};

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {}
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);
