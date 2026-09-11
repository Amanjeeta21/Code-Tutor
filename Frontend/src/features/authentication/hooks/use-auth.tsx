/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  bio?: string;
  role?: string;
  gender?: string;
  dateOfBirth?: string;
  language?: string;
  editorLanguage?: string;
  image?: string;
  createdAt?: string;
}

export type ProfileUpdate = Partial<
  Pick<
    User,
    | 'bio'
    | 'dateOfBirth'
    | 'editorLanguage'
    | 'email'
    | 'fullName'
    | 'gender'
    | 'image'
    | 'language'
    | 'role'
    | 'username'
  >
>;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(dataUser: any): User {
  return {
    id: dataUser.id,
    email: dataUser.email,
    fullName: dataUser.fullName || dataUser.name,
    username: dataUser.username,
    bio: dataUser.bio,
    role: dataUser.role,
    gender: dataUser.gender,
    dateOfBirth: dataUser.dateOfBirth,
    language: dataUser.language,
    editorLanguage: dataUser.editorLanguage,
    image: dataUser.image,
    createdAt: dataUser.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(mapUser(data.user));
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session check failed', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: ProfileUpdate) => {
    const res = await fetch('/api/auth/profile', {
      body: JSON.stringify(profile),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Unable to update your profile right now.');
    }

    const updatedUser = mapUser(data.user);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      void checkSession();
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        checkSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}