import { type User, type LoginData, type InsertUser } from "@shared/schema";

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = "zynbank_token";
  private static readonly USER_KEY = "zynbank_user";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro no login");
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    
    return data;
  }

  static async register(userData: InsertUser): Promise<AuthResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro no cadastro");
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    
    return data;
  }

  static logout(): void {
    this.removeToken();
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
