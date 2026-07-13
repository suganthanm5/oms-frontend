import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  HelpCircle,
  Building2,
  LogOut,
  Edit3,
  ChevronRight,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import './ProfileDrawer.css';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('system');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const drawerRef = useRef(null);

  // Fetch user profile when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset password visibility when modal opens/closes
  useEffect(() => {
    if (!showChangePassword) {
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setPasswordSuccess('');
    }
  }, [showChangePassword]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Fallback to localStorage data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Default user data
          setUser({
            name: 'John Doe',
            email: 'john.doe@company.com',
            role: 'Administrator',
            avatar: null,
            isOnline: true
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to default data
      setUser({
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'Administrator',
        avatar: null,
        isOnline: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Apply theme logic here
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Both password fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    // Check if password contains at least one number
    if (!/\d/.test(passwordForm.newPassword)) {
      setPasswordError('Password must include at least one number (0-9)');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setPasswordSuccess('Password changed successfully');
        setPasswordForm({
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        const error = await response.json();
        setPasswordError(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordError('An error occurred. Please try again.');
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
    setShowChangePassword(false);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A';
  };

  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      action: () => console.log('Edit Profile'),
      color: 'text-blue-600'
    },
    {
      icon: Lock,
      label: 'Change Password',
      action: () => setShowChangePassword(true),
      color: 'text-indigo-600'
    },
    {
      icon: Settings,
      label: 'Account Settings',
      action: () => console.log('Account Settings'),
      color: 'text-gray-600'
    },
    {
      icon: theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor,
      label: 'Appearance',
      action: () => {
        const themes = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        handleThemeChange(nextTheme);
      },
      color: 'text-purple-600',
      badge: theme.charAt(0).toUpperCase() + theme.slice(1)
    },
    {
      icon: Bell,
      label: 'Notifications',
      action: () => console.log('Notifications'),
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      label: 'Security',
      action: () => console.log('Security'),
      color: 'text-red-600'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      action: () => console.log('Help & Support'),
      color: 'text-green-600'
    },
    {
      icon: Building2,
      label: 'Switch Outlet',
      action: () => console.log('Switch Outlet'),
      color: 'text-indigo-600'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="profile-drawer-backdrop" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`profile-drawer ${isOpen ? 'profile-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
      >
        {/* Header */}
        <div className="profile-drawer-header">
          <button
            onClick={onClose}
            className="profile-drawer-close"
            aria-label="Close profile drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="profile-drawer-content">
          {loading ? (
            <div className="profile-drawer-loading">
              <div className="profile-avatar-skeleton"></div>
              <div className="profile-info-skeleton">
                <div className="skeleton-line skeleton-line-lg"></div>
                <div className="skeleton-line skeleton-line-md"></div>
                <div className="skeleton-line skeleton-line-sm"></div>
              </div>
            </div>
          ) : (
            <>
              {/* User Profile Section */}
              <div className="profile-user-section">
                <div className="profile-avatar-container">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar profile-avatar-fallback">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  {user?.isOnline && <div className="profile-status-indicator"></div>}
                </div>

                <div className="profile-user-info">
                  <h3 className="profile-user-name" id="profile-drawer-title">
                    {user?.name || 'User Name'}
                  </h3>
                  <p className="profile-user-role">{user?.role || 'Administrator'}</p>
                  <p className="profile-user-email">{user?.email || 'user@company.com'}</p>
                </div>

                <button className="profile-edit-btn">
                  <Edit3 size={16} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="profile-menu">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="profile-menu-item"
                  >
                    <div className="profile-menu-item-content">
                      <item.icon size={20} className={item.color} />
                      <span className="profile-menu-item-label">{item.label}</span>
                    </div>
                    <div className="profile-menu-item-right">
                      {item.badge && (
                        <span className="profile-menu-badge">{item.badge}</span>
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="profile-drawer-footer">
          <div className="profile-divider"></div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="profile-logout-btn"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="profile-logout-modal">
            <div className="profile-logout-modal-content">
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout from your account?</p>
              <div className="profile-logout-modal-actions">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="profile-logout-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="profile-logout-confirm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="profile-logout-modal" onClick={resetPasswordForm}>
            <div className="profile-logout-modal-content profile-change-password-modal" onClick={(e) => e.stopPropagation()}>
              <div className="change-password-header">
                <h3>Change Password</h3>
                <button
                  onClick={resetPasswordForm}
                  className="change-password-close"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {passwordSuccess && (
                <div className="password-success-message">
                  ✓ {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="password-error-message">
                  ✕ {passwordError}
                </div>
              )}

              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul className="requirements-list">
                  <li>At least 6 characters long</li>
                  <li>Must include at least one number (0-9)</li>
                </ul>
              </div>

              <div className="change-password-form">
                {/* New Password */}
                <div className="password-input-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      key={`new-${showNewPassword}`}
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter your new password"
                      className="password-input"
                      autoComplete="new-password"
                      spellCheck="false"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="password-toggle-btn"
                      type="button"
                      tabIndex="-1"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="password-input-group">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      key={`confirm-${showConfirmPassword}`}
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                      className="password-input"
                      autoComplete="new-password"
                      spellCheck="false"
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle-btn"
                      type="button"
                      tabIndex="-1"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-logout-modal-actions">
                <button
                  onClick={resetPasswordForm}
                  className="profile-logout-cancel"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="profile-logout-confirm password-update-btn"
                  type="button"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileDrawer;