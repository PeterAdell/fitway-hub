import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isPremium: boolean;
  points: number;
  height?: number;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  steps: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage synchronously to avoid race conditions on refresh
  const getInitialState = () => {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("fitway_user");
    const storedToken = localStorage.getItem("token") || localStorage.getItem("fitway_token");
    const rememberMe = localStorage.getItem('remember_me') === 'true';

    if (storedUser && storedToken && rememberMe) {
      try {
        return {
          user: JSON.parse(storedUser),
          token: storedToken
        };
      } catch (e) {
        return { user: null, token: null };
      }
    }
    return { user: null, token: null };
  };

  const initialState = getInitialState();
  const [user, setUser] = useState<User | null>(initialState.user);
  const [token, setToken] = useState<string | null>(initialState.token);

  // Normalize legacy keys on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("fitway_user");
    const storedToken = localStorage.getItem("token") || localStorage.getItem("fitway_token");
    
    if (storedUser && storedToken) {
      try {
        localStorage.setItem('user', storedUser);
        localStorage.setItem('token', storedToken);
        localStorage.removeItem('fitway_user');
        localStorage.removeItem('fitway_token');
      } catch (e) {
        // ignore storage errors
      }
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const userData: User = {
        id: data.user.id,
        name: data.user.name || data.user.email.split('@')[0],
        email: data.user.email,
        role: data.user.role as UserRole || "user",
        isPremium: Boolean(data.user.is_premium),
        points: data.user.points || 0,
        steps: data.user.steps || 0,
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
        height: data.user.height,
        weight: data.user.weight
      };

      setToken(data.token);
      setUser(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');

      if (data.rememberToken) {
        localStorage.setItem('remember_token', data.rememberToken);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const userData: User = {
        id: data.user.id,
        name: data.user.name || name,
        email: data.user.email,
        role: data.user.role as UserRole || "user",
        isPremium: Boolean(data.user.is_premium),
        points: data.user.points || 0,
        steps: data.user.steps || 0,
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
        height: data.user.height,
        weight: data.user.weight
      };

      setToken(data.token);
      setUser(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem('remember_token');
    localStorage.removeItem('remember_me');
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      // persist to current user key
      try {
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (e) {}
      // If points changed, attempt to sync with backend
      try {
        const token = localStorage.getItem('token');
        if (token && typeof data.points !== 'undefined') {
          fetch('/api/user/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ points: updated.points }),
          }).then(async (res) => {
            if (res.ok) {
              const json = await res.json();
              if (json?.user) {
                // replace local user with server's copy
                try { localStorage.setItem('user', JSON.stringify(json.user)); } catch(e){}
                setUser(json.user as User);
              }
            }
          }).catch(() => {});
        }
      } catch (e) {}
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
