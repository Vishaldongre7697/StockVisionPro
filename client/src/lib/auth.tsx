import React, { ReactNode } from "react";
import { createAuthProvider, AuthContext, useAuth, User, RegisterData } from "./auth.ts";

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = createAuthProvider();
  
  return (
    <AuthContext.Provider 
      value={{
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        login: auth.login,
        register: auth.register,
        logout: auth.logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Re-export the auth hooks and types
export { useAuth, User, RegisterData };