import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useState, useEffect } from "react";
import { getTheme } from "./theme/theme";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { Toaster } from "react-hot-toast";

function App() {
  const [activeTheme, setActiveTheme] = useState(getTheme());

  useEffect(() => {
    const applyGlobalCSSVariables = (newTheme) => {
      const root = document.documentElement;
      const isDark = newTheme.palette.mode === 'dark';
      
      root.style.setProperty('--color-primary-main', newTheme.palette.primary.main);
      root.style.setProperty('--color-primary-light', newTheme.palette.primary.light);
      root.style.setProperty('--color-primary-dark', newTheme.palette.primary.dark);
      
      // Sync background and text colors for custom CSS layout components
      root.style.setProperty('--color-bg-primary', newTheme.palette.background.default);
      root.style.setProperty('--color-bg-sidebar', newTheme.palette.background.paper);
      root.style.setProperty('--color-bg-secondary', isDark ? 'rgba(255,255,255,0.05)' : '#ECECFD');
      root.style.setProperty('--color-navbar-bg', isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)');
      root.style.setProperty('--color-dropdown-bg', isDark ? '#1e293b' : '#ffffff');
      
      root.style.setProperty('--color-text-primary', newTheme.palette.text.primary);
      root.style.setProperty('--color-text-secondary', newTheme.palette.text.secondary);
      root.style.setProperty('--color-text-placeholder', isDark ? '#64748b' : '#798EAE');
      
      root.style.setProperty('--color-border-hr', newTheme.palette.divider);
      
      if (isDark) {
        root.classList.add('dark-theme');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark-theme');
        root.classList.remove('dark');
      }
    };

    const applyLanguageSetting = () => {
      // Custom language logic will be handled manually via the MyMemory API
    };

    const handleStorageEvent = () => {
      const newTheme = getTheme();
      setActiveTheme(newTheme);
      applyGlobalCSSVariables(newTheme);
      applyLanguageSetting();
    };

    handleStorageEvent();
    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("settingsUpdated", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("settingsUpdated", handleStorageEvent);
    };
  }, []);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
            <WebSocketProvider>
              <AppRoutes />
            </WebSocketProvider>
          </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ThemeProvider>
  );
}

export default App;
