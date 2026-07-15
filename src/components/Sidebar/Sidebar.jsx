import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  InputBase,
  ButtonBase,
} from "@mui/material";
import {
  DashboardRounded,
  AccountTreeRounded,
  PlaceRounded,
  StoreRounded,
  InventoryRounded,
  StorefrontRounded,
  LogoutRounded,
  DarkModeRounded,
  LightModeRounded,
  SearchRounded,
  MenuOpenRounded,
  MenuRounded,
  KeyboardDoubleArrowLeftRounded,
  KeyboardDoubleArrowRightRounded,
  ExpandMoreRounded,
  PeopleRounded,
  InventoryRounded as BatchIcon,
  SwapHorizRounded,
  ShoppingCartRounded,
  AssessmentRounded,
  AllInclusiveRounded,
  HistoryRounded,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { getCookie } from "../../utils/cookieUtils";
import "./Sidebar.css";

/* All nav items with role visibility */
const ALL_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRounded />, roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"] },
  { to: "/users", label: "User Management", icon: <PeopleRounded />, roles: ["ADMIN"] },
  {
    label: "Outlet",
    icon: <StoreRounded />,
    roles: ["ADMIN", "MANAGER"],
    isDropdown: true,
    children: [
      { to: "/location", label: "Location", icon: <PlaceRounded />, roles: ["ADMIN"] },
      { to: "/division", label: "Division", icon: <AccountTreeRounded />, roles: ["ADMIN"] },
      { to: "/outlet", label: "Outlet", icon: <StorefrontRounded />, roles: ["ADMIN", "MANAGER"] },
    ]
  },
  { to: "/product", label: "Product", icon: <InventoryRounded />, roles: ["ADMIN", "MANAGER"] },
  { to: "/stock", label: "Stock", icon: <SwapHorizRounded />, roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"] },
  { to: "/orders", label: "Orders", icon: <ShoppingCartRounded />, roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"] },
  { to: "/reports", label: "Reports", icon: <AssessmentRounded />, roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"] },
  { to: "/audit-logs", label: "Audit Logs", icon: <HistoryRounded />, roles: ["ADMIN"] },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { role, roles, switchRole, logout, isLoading } = useAuth();
  const searchInputRef = useRef(null);

  // ── Theme ─────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("settingsUpdated", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);
    return () => {
      window.removeEventListener("settingsUpdated", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  // ── Search ────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  const handleSearchClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => searchInputRef.current?.focus(), 420);
    }
  };

  // ── Mobile overlay close ──────────────────────────────────
  useEffect(() => {
    const handleBodyClick = (e) => {
      if (
        window.innerWidth <= 768 &&
        !collapsed &&
        !e.target.closest(".new-sidebar") &&
        !e.target.closest(".mobile-nav-toggle") &&
        !e.target.closest(".mobile-nav-toggle-navbar")
      ) {
        setCollapsed(true);
        document.body.classList.remove("sidebar-open");
      }
    };
    document.addEventListener("click", handleBodyClick);
    return () => document.removeEventListener("click", handleBodyClick);
  }, [collapsed, setCollapsed]);

  // Keep body class in sync for mobile overlay
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.classList.toggle("sidebar-open", !collapsed);
    }
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleToggle = () => {
    setCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebarCollapsed", String(newValue));
      window.dispatchEvent(new Event("settingsUpdated"));
      return newValue;
    });
  };

  const location = useLocation();
  const [isMasterOpen, setIsMasterOpen] = useState(false);

  // Auto-open Master dropdown if a child route is active
  useEffect(() => {
    const isChildActive = ["/location", "/division", "/outlet"].includes(location.pathname);
    if (isChildActive && !collapsed) {
      setIsMasterOpen(true);
    }
  }, [location.pathname, collapsed]);

  // Get role from context or cookies as fallback
  const currentRole = role || getCookie("role") || "USER";
  const userRoleStr = currentRole.toString().toUpperCase().replace('ROLE_', '').trim();

  // Recursively process and filter navigation items based on role permissions and search query
  const filterByRoleAndSearch = (items) => {
    return items
      .map((item) => {
        let processed = { ...item };
        if (userRoleStr === "USER" || userRoleStr === "OUTLET_MANAGER") {
          if (processed.to === "/orders") processed.label = "My Requests";
          if (processed.to === "/stock") processed.label = "Available Stock";
        } else {
          if (processed.to === "/orders") processed.label = "Requests";
        }

        if (processed.children) {
          processed.children = filterByRoleAndSearch(processed.children);
        }

        return processed;
      })
      .filter((item) => {
        // Filter by role permissions
        if (item.roles && item.roles.length > 0) {
          const allowedRoles = item.roles.map(r => r.toString().toUpperCase().replace('ROLE_', '').trim());
          if (!allowedRoles.includes(userRoleStr)) return false;
        }

        // If dropdown, only show if it has visible children
        if (item.isDropdown && (!item.children || item.children.length === 0)) {
          return false;
        }

        // Apply search query
        if (search) {
          const matchesSelf = item.label.toLowerCase().includes(search.toLowerCase());
          if (item.isDropdown) {
            const matchesChildren = item.children.some(child => child.label.toLowerCase().includes(search.toLowerCase()));
            return matchesSelf || matchesChildren;
          }
          return matchesSelf;
        }

        return true;
      });
  };

  const filteredNav = filterByRoleAndSearch(ALL_NAV);

  return (
    <Box
      component="aside"
      className={`new-sidebar${collapsed ? " collapsed" : ""}${isDark ? " dark-theme" : ""}`}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <Box className="sidebar-header">
        <Box className="header-logo">
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7d2ae8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </svg>
          <AllInclusiveRounded sx={{ fontSize: 20, fill: "url(#logo-gradient)" }} />
        </Box>

        <Box className="header-brand-name">
          <span className="brand-title">OUTLET</span>
          <span className="brand-subtitle">MANAGEMENT SYSTEM</span>
        </Box>

        <ButtonBase
          className="sidebar-toggle-btn"
          onClick={handleToggle}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <KeyboardDoubleArrowRightRounded className="toggle-icon" />
          ) : (
            <KeyboardDoubleArrowLeftRounded className="toggle-icon" />
          )}
        </ButtonBase>
      </Box>

      {/* Role Switcher */}
      {roles && roles.length > 1 && !collapsed && (
        <Box className="role-switcher-wrap">
          <Typography className="role-switcher-label">Active Role</Typography>
          <Box className="role-chips">
            {roles.map((r) => (
              <ButtonBase
                key={r}
                className={`role-chip ${role === r ? "active" : ""}`}
                onClick={() => switchRole(r)}
              >
                {r.toLowerCase()}
              </ButtonBase>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Content ────────────────────────────────────── */}
      <Box className="sidebar-content">

        {/* Search */}
        <Box className="new-search-form" onClick={handleSearchClick}>
          <SearchRounded
            className="search-icon"
            sx={{ color: "var(--color-text-placeholder)", fontSize: "1.3rem" }}
          />
          <InputBase
            inputRef={searchInputRef}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ style: { pointerEvents: collapsed ? "none" : "auto" } }}
            className="sidebar-search-input"
            sx={{
              flex: 1,
              fontSize: "1rem",
              fontFamily: "inherit",
              color: "var(--color-text-primary)",
              "& input::placeholder": { color: "var(--color-text-placeholder)" },
            }}
          />
        </Box>

        {/* Section label */}
        <Typography component="div" className="nav-section-label">
          Main Menu
        </Typography>

        {/* Menu links */}
        <List className="new-menu-list" disablePadding>
          {filteredNav.map((item) => {
            if (item.isDropdown) {
              const isChildActive = item.children.some(child => child.to === location.pathname);
              return (
                <ListItem key={item.label} disablePadding sx={{ display: "block" }}>
                  <ButtonBase
                    onClick={(e) => {
                      if (collapsed) {
                        setCollapsed(false);
                        setIsMasterOpen(true);
                      } else {
                        setIsMasterOpen(!isMasterOpen);
                      }
                    }}
                    className={`new-menu-link dropdown-parent${isChildActive ? " active-parent" : ""}`}
                    sx={{ width: "calc(100% - 16px)", textAlign: "left", justifyContent: "flex-start", mx: "8px" }}
                  >
                    <Box component="span" className="menu-icon">{item.icon}</Box>
                    <Typography component="span" className="new-menu-label" sx={{ flex: 1 }}>
                      {item.label}
                    </Typography>
                    {!collapsed && (
                      <ExpandMoreRounded
                        className={`dropdown-chevron ${isMasterOpen ? "open" : ""}`}
                        sx={{ fontSize: "1.25rem" }}
                      />
                    )}
                  </ButtonBase>

                  <Box className={`submenu-container ${isMasterOpen && !collapsed ? "open" : ""}`}>
                    <Box className="submenu-inner">
                      <List className="new-submenu-list" disablePadding>
                        {item.children.map((child) => (
                          <ListItem key={child.to} disablePadding>
                            <NavLink
                              to={child.to}
                              title={collapsed ? child.label : ""}
                              className={({ isActive }) =>
                                `new-submenu-link${isActive ? " active" : ""}`
                              }
                            >
                              <Box component="span" className="menu-icon sub-menu-icon">{child.icon}</Box>
                              <Typography component="span" className="new-menu-label">
                                {child.label}
                              </Typography>
                            </NavLink>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Box>
                </ListItem>
              );
            }

            return (
              <ListItem key={item.to} disablePadding>
                <NavLink
                  to={item.to}
                  title={collapsed ? item.label : ""}
                  className={({ isActive }) =>
                    `new-menu-link${isActive ? " active" : ""}`
                  }
                >
                  <Box component="span" className="menu-icon">{item.icon}</Box>
                  <Typography component="span" className="new-menu-label">
                    {item.label}
                  </Typography>
                </NavLink>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* ── Footer ─────────────────────────────────────── */}
      <Box className="new-sidebar-footer">


        {/* Logout */}
        <ButtonBase
          className="logout-btn"
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : ""}
          disableRipple
        >
          <Box component="span" className="menu-icon">
            <LogoutRounded sx={{ fontSize: "1.2rem" }} />
          </Box>
          <Typography component="span" className="new-menu-label">
            Sign Out
          </Typography>
        </ButtonBase>

      </Box>
    </Box>
  );
};

export default Sidebar;

