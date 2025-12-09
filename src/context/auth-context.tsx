
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  email: string;
  role: string; // I will assume role is part of user metadata or can be inferred
  // add other user properties here
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A mock role mapping based on email
const getRoleFromEmail = (email: string) => {
  if (email === 'admin@sejadikopi.com') {
    return 'admin';
  }
  if (email === 'kasir@sejadikopi.com') {
    return 'kasir';
  }
  return 'authenticated';
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verify the user's session from localStorage
    try {
      const session = localStorage.getItem('sejadikopi-session');
      if (session) {
        const { user: userData, access_token } = JSON.parse(session);
        if (userData && access_token) {
           const role = getRoleFromEmail(userData.email);
           setUser({ ...userData, role });
        }
      }
    } catch (error) {
      console.error("Gagal mengurai sesi dari localStorage", error);
      // If parsing fails, clear the broken session
      localStorage.removeItem('sejadikopi-session');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    const response = await fetch('https://vamos-api.sejadikopi.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email, password: pass }),
    });

    if (!response.ok) {
        throw new Error('Gagal masuk');
    }

    const data = await response.json();

    if (data.access_token && data.user) {
      const role = getRoleFromEmail(data.user.email);
      const userWithRole = { ...data.user, role };
      localStorage.setItem('sejadikopi-session', JSON.stringify({ ...data, user: userWithRole }));
      setUser(userWithRole);
    } else {
      throw new Error('Kredensial tidak valid');
    }
  };

  const logout = () => {
    localStorage.removeItem('sejadikopi-session');
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
