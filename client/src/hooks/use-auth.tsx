import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { type User, type LoginData, type InsertUser } from "@shared/schema";
import { AuthService, type AuthResponse } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<AuthResponse>;
  register: (userData: InsertUser) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = AuthService.getUser();
        const token = AuthService.getToken();
        
        if (storedUser && token) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        AuthService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: InsertUser): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await AuthService.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setLocation("/login");
  };

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: AuthService.getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        AuthService.setUser(data.user);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && AuthService.isAuthenticated(),
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route wrapper
interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/login");
        return;
      }

      if (adminOnly && user?.role !== "admin") {
        setLocation("/dashboard");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, adminOnly, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zynblue border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (adminOnly && user?.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}
