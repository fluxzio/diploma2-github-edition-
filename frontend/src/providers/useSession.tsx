import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { UserI } from "../entities";

interface SessionContextType {
  user: UserI | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const fetchUser = async () => {
    try {
      const response = await api.get("/api/users/me/");
      setUser(response.data);
    } catch (error) {
      logout(false); // не делать navigate при загрузке
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem("token", token);
    try {
      const response = await api.get("/api/users/me/");
      setUser(response.data);
      navigate("/dashboard");
    } catch (err) {
      logout();
    }
  };

  const logout = (redirect: boolean = true) => {
    localStorage.removeItem("token");
    setUser(null);
    if (redirect) navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
};
