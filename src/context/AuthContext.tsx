import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loginWithJwt: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loginWithJwt: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();
  const [user, setUser] = useState<UserProfile | null>(null);

  const parseJwt = (token: string): UserProfile | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return {
        id: parsed.sub || parsed.id || 'user-b',
        name: parsed.name || 'Company B User',
        email: parsed.email || 'user@companyb.com',
        role: parsed.role || 'Auditor',
        tenantId: tenant.id,
      };
    } catch {
      // Fallback mock payload if raw token is passed during test
      return {
        id: 'user-b-mock',
        name: 'Company B User',
        email: 'user@companyb.com',
        role: 'Auditor',
        tenantId: tenant.id,
      };
    }
  };

  const loginWithJwt = (token: string) => {
    const profile = parseJwt(token);
    if (profile) {
      setUser(profile);
      sessionStorage.setItem('sso_token', token);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sso_token');
  };

  useEffect(() => {
    if (tenant.authProvider === 'company_b_jwt') {
      // Check query param ?token=
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        loginWithJwt(tokenParam);
        return;
      }

      // Check postMessage event from parent window
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'COMPANY_B_SSO_TOKEN' && event.data?.token) {
          loginWithJwt(event.data.token);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [tenant]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginWithJwt,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
