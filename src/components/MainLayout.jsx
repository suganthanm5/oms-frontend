import { useState, useEffect } from 'react';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';
import { MenuRounded, SwitchAccountRounded } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const MainLayout = ({ children, title = 'Dashboard' }) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const { isImpersonating, user, stopImpersonating } = useAuth();

  // On small screens start collapsed (hidden)
  useEffect(() => {
    const handle = () => {
      if (window.innerWidth <= 768) setCollapsed(true);
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Listen to sidebar collapse changes from settings or other pages
  useEffect(() => {
    const handleSettings = () => {
      setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('settingsUpdated', handleSettings);
    window.addEventListener('storage', handleSettings);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettings);
      window.removeEventListener('storage', handleSettings);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {isImpersonating && (
        <div className="impersonation-pop">
          <div className="impersonation-pop-indicator">
            <span className="pulse-dot"></span>
            <SwitchAccountRounded sx={{ fontSize: 18 }} />
          </div>
          <div className="impersonation-pop-body">
            <div className="impersonation-pop-title">Impersonation Session</div>
            <div className="impersonation-pop-desc">
              <strong>{user?.name || user?.username}</strong>
              <span className="role-tag">{user?.role?.replace('ROLE_', '').replace('_', ' ')}</span>
            </div>
          </div>
          <button className="impersonation-pop-btn" onClick={stopImpersonating}>
            Exit
          </button>
        </div>
      )}
      <div className="app-container">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="main-content">
          <Navbar title={title} setCollapsed={setCollapsed} />
          <div className="page-container">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;