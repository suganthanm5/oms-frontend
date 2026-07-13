

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { setCookie, getCookie, deleteCookie } from "../utils/cookieUtils";

const AuthContext = createContext(null);

const loadUser = () => {
  try {
    const raw = getCookie("user");
    
    if (!raw || raw === "null" || raw === "undefined") return null;

    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;

   
    if (user.role) {
      user.role = user.role.toString().toUpperCase().replace('ROLE_', '').trim();
    } else {
      
      user.role = "USER";
    }

    if (!user.username && !user.name) {
      const fallbackUsername = getCookie("username");
      if (fallbackUsername && fallbackUsername !== "undefined") {
        user.username = fallbackUsername;
      }
    }

    return user;
  } catch (err) {
    console.error("AuthContext: Failed to load user", err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadUser());
  const [isLoading, setIsLoading] = useState(() => {
    const token = getCookie('token');
    const userData = loadUser();
    return !(userData && token);
  });

  
  useEffect(() => {
    const userData = loadUser();
    const token = getCookie('token');

    if (userData && token) {
      setUser(userData);
      setCookie("username", userData.username || userData.name || "");
      setCookie("role", userData.role || "USER");
      setCookie("email", userData.email || "");
      if (userData.outletId) {
        setCookie("outletId", userData.outletId);
      } else {
        deleteCookie("outletId");
      }
    } else if (!userData && token) {
      deleteCookie('token');
    }
    setIsLoading(false);
  }, []);

  const [isImpersonating, setIsImpersonating] = useState(() => !!getCookie("impersonatorToken"));

  const login = useCallback((userData, token) => {
    const normalizedRole = (userData.role || "USER").toString().toUpperCase().replace('ROLE_', '').trim();
    const normalizedUserData = { ...userData, role: normalizedRole };
    setCookie("token", token);
    setCookie("user", JSON.stringify(normalizedUserData));
    setCookie("username", normalizedUserData.username || normalizedUserData.name || "");
    setCookie("email", normalizedUserData.email || "");
    setCookie("role", normalizedUserData.role);
    if (normalizedUserData.outletId) {
      setCookie("outletId", normalizedUserData.outletId);
    } else {
      deleteCookie("outletId");
    }
    setUser(normalizedUserData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const impersonate = useCallback((targetUserData, targetToken) => {
    const originalToken = getCookie("token");
    const originalUser = getCookie("user");
    
    if (!getCookie("impersonatorToken")) {
      setCookie("impersonatorToken", originalToken);
      setCookie("impersonatorUser", originalUser);
    }
    
    login(targetUserData, targetToken);
    setIsImpersonating(true);
  }, [login]);

  const stopImpersonating = useCallback(() => {
    const originalToken = getCookie("impersonatorToken");
    const originalUser = getCookie("impersonatorUser");
    
    if (originalToken && originalUser) {
      deleteCookie("impersonatorToken");
      deleteCookie("impersonatorUser");
      login(JSON.parse(originalUser), originalToken);
    }
    setIsImpersonating(false);
  }, [login]);

  const logout = useCallback(() => {
    deleteCookie("token");
    deleteCookie("user");
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("role");
    deleteCookie("outletId");
    deleteCookie("impersonatorToken");
    deleteCookie("impersonatorUser");
    setUser(null);
    setIsImpersonating(false);
    window.dispatchEvent(new Event('storage'));
  }, []);

  
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = loadUser();
      setUser(userData);
      setIsImpersonating(!!getCookie("impersonatorToken"));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading, isImpersonating, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
