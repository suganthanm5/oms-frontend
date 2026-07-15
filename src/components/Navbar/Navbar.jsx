import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  IconButton,
  InputBase,
  Divider,
  Tooltip,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ButtonBase,
} from "@mui/material";
import {
  SearchRounded,
  NotificationsRounded,
  PersonRounded,
  SettingsRounded,
  LogoutRounded,
  StoreRounded,
  PlaceRounded,
  AccountTreeRounded,
  KeyboardArrowDownRounded,
  WarningAmberRounded,
  LightModeRounded,
  DarkModeRounded,
  MenuRounded,
} from "@mui/icons-material";
import ModernProfileDrawer from "../ProfileDrawer/ModernProfileDrawer";
import TypingText from "../TypingText";
import { getCookie, deleteCookie } from "../../utils/cookieUtils";
import { reportService } from "../../services/reportService";
import { getLocations } from "../../services/locationService";
import { getProducts } from "../../services/productService";
import { outletService } from "../../services/outletService";
import { orderService } from "../../services/orderService";
import { useMemo } from "react";
import "./Navbar.css";

// Dynamic notifications list fetched from dashboard summary metrics

/* ── Component ───────────────────────────────────── */
const Navbar = ({ title = "Dashboard", setCollapsed }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

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

  const toggleTheme = () => {
    const newValue = !isDark;
    localStorage.setItem("darkMode", String(newValue));
    setIsDark(newValue);
    window.dispatchEvent(new Event("settingsUpdated"));
    window.dispatchEvent(new Event("storage"));
  };

  /* Helper to load user profile dynamically */
  const loadUserFromCookie = () => {
    try {
      const raw = getCookie("user");
      if (raw && raw !== "null" && raw !== "undefined") {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            name: parsed.name || getCookie("username") || "Admin",
            email: parsed.email || getCookie("email") || "admin@company.com",
            role: parsed.role || getCookie("role") || "Administrator",
            profilePicture: parsed.profilePicture || null,
          };
        }
      }
    } catch (e) {
      console.error("Navbar: Failed to load user from cookie", e);
    }
    return {
      name: getCookie("username") || "Admin",
      email: getCookie("email") || "admin@company.com",
      role: getCookie("role") || "Administrator",
      profilePicture: null,
    };
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };

  /* User state */
  const [user, setUser] = useState(() => loadUserFromCookie());

  /* Clock */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Dynamic Summary Alerts & Notifications from Live Database Tables */
  const [summary, setSummary] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [outletsList, setOutletsList] = useState([]);
  const [locationsListRaw, setLocationsListRaw] = useState([]);
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchNavbarData = async () => {
      try {
        const [summ, ords, outs, locs, prods] = await Promise.all([
          reportService.getDashboardSummary().catch(() => null),
          orderService.getAll({ size: 10 }).catch(() => null),
          outletService.getAll(0, 10, "").catch(() => null),
          getLocations(0, 10, "").catch(() => null),
          getProducts(0, 10).catch(() => null)
        ]);

        if (!active) return;
        if (summ) setSummary(summ);

        if (ords) {
          const oList = ords.content ?? ords.data?.content ?? ords.data ?? ords;
          if (Array.isArray(oList)) setOrdersList(oList);
        }

        if (outs) {
          const ouList = outs.content ?? outs.data?.content ?? outs.data ?? outs;
          if (Array.isArray(ouList)) setOutletsList(ouList);
        }

        if (locs) {
          const lList = locs.content ?? locs.data?.content ?? locs.data ?? locs;
          if (Array.isArray(lList)) setLocationsListRaw(lList);
        }

        if (prods) {
          const pList = prods.content ?? prods.data?.content ?? prods.data ?? prods;
          if (Array.isArray(pList)) setProductsList(pList);
        }
      } catch (err) {
        console.error("Navbar: Failed to fetch notifications details", err);
      }
    };

    fetchNavbarData();
    return () => {
      active = false;
    };
  }, []);

  const notificationsList = useMemo(() => {
    const list = [];

    // 1. Live Critically Low Stock warning from summary (Urgent)
    if (summary?.lowStockCount > 0) {
      list.push({
        id: "alert-low-stock",
        Icon: WarningAmberRounded,
        text: `${summary.lowStockCount} items running critically low on stock`,
        time: "Action Required",
        color: "#f59e0b",
        onClick: () => navigate("/stock")
      });
    }

    // 2. Live Pending orders count warning from summary (Urgent)
    if (summary?.pendingOrdersCount > 0) {
      list.push({
        id: "alert-pending-orders",
        Icon: StoreRounded,
        text: `${summary.pendingOrdersCount} orders are pending your approval`,
        time: "Action Required",
        color: "#ef4444",
        onClick: () => navigate("/orders")
      });
    }

    // 3. Real-time individual Orders Activity (Pending, Rejected, Completed)
    ordersList.slice(0, 5).forEach((order) => {
      const orderNo = order.orderNo || `ORD-${order.id}`;
      const status = (order.status || "").toUpperCase();
      let text = `Order ${orderNo} status updated`;
      let timeLabel = "Status changed";
      let color = "#7d2ae8";

      if (status === "PENDING") {
        text = `Order ${orderNo} is pending approval`;
        timeLabel = "Order pending";
        color = "#ef4444";
      } else if (status === "REJECTED" || status === "CANCELLED") {
        text = `Order ${orderNo} has been rejected`;
        timeLabel = "Order rejected";
        color = "#ea580c";
      } else if (status === "COMPLETED" || status === "DELIVERED") {
        text = `Order ${orderNo} is completed`;
        timeLabel = "Order completed";
        color = "#10b981";
      }

      list.push({
        id: `order-${order.id}-${status}`,
        Icon: StoreRounded,
        text,
        time: timeLabel,
        color,
        onClick: () => navigate("/orders")
      });
    });

    // 4. Real-time Outlets Activity (Newly added Outlets)
    outletsList.slice(0, 3).forEach((outlet) => {
      list.push({
        id: `outlet-${outlet.id}`,
        Icon: StoreRounded,
        text: `New outlet "${outlet.outletName}" registered`,
        time: `Code: ${outlet.outletCode || "Active"}`,
        color: "#7c3aed",
        onClick: () => navigate("/outlet")
      });
    });

    // 5. Real-time Locations Activity (Newly added Locations)
    locationsListRaw.slice(0, 3).forEach((location) => {
      list.push({
        id: `location-${location.id}`,
        Icon: PlaceRounded,
        text: `New location "${location.name}" added to grid`,
        time: `${location.city || "Operational"} node`,
        color: "#0ea5e9",
        onClick: () => navigate("/location")
      });
    });

    // 6. Real-time Products Activity (Newly added Products)
    productsList.slice(0, 3).forEach((product) => {
      list.push({
        id: `product-${product.id}`,
        Icon: AccountTreeRounded,
        text: `New product "${product.name}" added`,
        time: `Code: ${product.productCode || "Active"}`,
        color: "#db2777",
        onClick: () => navigate("/product")
      });
    });

    // Deduplicate notifications by id
    const seenIds = new Set();
    return list.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    }).slice(0, 8); // Display at most 8 notifications to keep user experience premium
  }, [summary, ordersList, outletsList, locationsListRaw, productsList, navigate]);

  /* Search */
  const [search, setSearch] = useState("");

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  /* Profile updates and sync across tabs */
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(loadUserFromCookie());
    };

    const handleStorageEvent = (e) => {
      handleStorageChange();
    };

    window.addEventListener("profileUpdated", handleStorageChange);
    window.addEventListener("userDataUpdated", handleStorageChange);
    window.addEventListener("storage", handleStorageEvent);

    const handleOpenProfileDrawerEvent = () => setProfileDrawerOpen(true);
    window.addEventListener("openProfileDrawer", handleOpenProfileDrawerEvent);

    return () => {
      window.removeEventListener("profileUpdated", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("openProfileDrawer", handleOpenProfileDrawerEvent);
    };
  }, []);

  /* Click-outside to close dropdowns */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".navbar-notif-wrap")) setNotifOpen(false);
      if (!e.target.closest(".navbar-user-wrap")) setUserOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* Helpers */
  const handleLogout = () => {
    deleteCookie("token");
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("role");
    deleteCookie("user");
    deleteCookie("outletId");
    navigate("/");
  };

  const handleOpenProfile = () => {
    setUserOpen(false);
    setProfileDrawerOpen(true);
  };

  const formatTime = (d) => {
    const is24h = (localStorage.getItem('timeFormat') || '12h') === '24h';
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !is24h });
  };
  const formatDate = (d) => {
    const lang = localStorage.getItem('language') || 'english';
    return d.toLocaleDateString(lang === 'tamil' ? 'ta-IN' : 'en-US', { weekday: "short", month: "short", day: "numeric" });
  };

  /* Avatar initials */
  const initials = (user.name || "A").charAt(0).toUpperCase();

  /* ── JSX ──────────────────────────────────────── */
  return (
    <>
      <Box component="header" className="navbar">

        {/* LEFT — Greeting or Page Title */}
        <Box className="navbar-left" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <IconButton
            className="mobile-nav-toggle-navbar"
            onClick={() => setCollapsed && setCollapsed((prev) => !prev)}
            sx={{ display: { xs: 'flex', md: 'none' }, color: 'var(--color-text-primary)', p: 0.5 }}
          >
            <MenuRounded sx={{ fontSize: '1.75rem' }} />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {title === 'Dashboard' || title === 'Dashboard ' ? (
              <>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, minHeight: '1.5rem' }}>
                  <TypingText text={`Hi, ${user.name || "User"}`} delay={40} startDelay={100} />
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#8b5cf6', fontWeight: 500, mt: 0.3, minHeight: '1.35rem' }}>
                  <TypingText text="Let's finish your task today!" delay={30} startDelay={700} />
                </Typography>
              </>
            ) : (
              <Typography className="nb-page" sx={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {title}
              </Typography>
            )}
          </Box>
        </Box>

        {/* CENTER — Empty space to push right elements */}
        <Box className="navbar-center" sx={{ flex: 1 }} />

        {/* RIGHT */}
        <Box className="navbar-right">

          {/* Theme Toggle Button */}
          <Tooltip title={isDark ? "Light Mode" : "Dark Mode"} placement="bottom">
            <IconButton
              className="navbar-icon-btn"
              onClick={toggleTheme}
              sx={{
                color: "var(--color-text-placeholder)",
                "&:hover": {
                  color: "#7C3AED",
                }
              }}
            >
              {isDark ? <LightModeRounded sx={{ fontSize: 20 }} /> : <DarkModeRounded sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Notification bell */}
          <Box className="navbar-notif-wrap">
            <Tooltip title="Notifications" placement="bottom">
              <ButtonBase
                className={`navbar-icon-btn${notifOpen ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setNotifOpen((v) => !v); setUserOpen(false); }}
                disableRipple
              >
                <NotificationsRounded sx={{ fontSize: 20 }} />
                {notificationsList.length > 0 && (
                  <Box className="notif-badge">{notificationsList.length}</Box>
                )}
              </ButtonBase>
            </Tooltip>

            {/* Notification dropdown */}
            <Fade in={notifOpen}>
              <Box className="notif-dropdown">
                <Box className="notif-header">
                  <Typography className="notif-header-title">Notifications</Typography>
                  <Typography className="notif-count">{notificationsList.length} new</Typography>
                </Box>

                <List className="notif-list" disablePadding>
                  {notificationsList.map(({ id, Icon, text, time: t, color, onClick }) => (
                    <ListItem
                      key={id}
                      className="notif-item"
                      onClick={() => {
                        if (onClick) onClick();
                        setNotifOpen(false);
                      }}
                      disablePadding
                    >
                      <Box
                        className="notif-item-icon"
                        sx={{ background: `${color}18`, color }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box className="notif-item-body">
                        <Typography component="p">{text}</Typography>
                        <Typography component="span">{t}</Typography>
                      </Box>
                      <Box className="notif-dot" sx={{ bgcolor: color }} />
                    </ListItem>
                  ))}
                </List>

                <Box className="notif-footer" onClick={() => { navigate("/notifications"); setNotifOpen(false); }}>
                  View all notifications
                </Box>
              </Box>
            </Fade>
          </Box>

          {/* User button */}
          <Box className="navbar-user-wrap">
            <ButtonBase
              className={`navbar-user${userOpen ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setUserOpen((v) => !v); setNotifOpen(false); }}
              disableRipple
            >
              <Avatar
                className="user-avatar"
                src={getAvatarUrl(user.profilePicture) || undefined}
                sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #f43f5e, #fda4af)" }}
              >
                {!user.profilePicture && initials}
              </Avatar>

              <Box className="user-info" sx={{ display: { xs: "none", md: "flex" } }}>
                <Typography className="user-name">{user.name || "User"}</Typography>
                <Typography className="user-role">{user.role || "User"}</Typography>
              </Box>

              <Box className="user-chevron">
                <KeyboardArrowDownRounded
                  sx={{
                    fontSize: 18,
                    color: "#f43f5e",
                    transform: userOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </Box>
            </ButtonBase>

            {/* User dropdown */}
            <Fade in={userOpen}>
              <Box className="user-dropdown">

                {/* Header */}
                <Box className="user-dropdown-header">
                  <Avatar
                    className="user-avatar lg"
                    src={getAvatarUrl(user.profilePicture) || undefined}
                    sx={{ width: 46, height: 46, background: "rgba(255,255,255,0.25)" }}
                  >
                    {!user.profilePicture && initials}
                  </Avatar>
                  <Box>
                    <Typography className="ud-name">{user.name}</Typography>
                    <Typography className="ud-role">{user.email}</Typography>
                  </Box>
                  <Box className="ud-status">
                    <Box className="ud-status-dot" />
                    Online
                  </Box>
                </Box>

                {/* Menu items */}
                <List component="ul" className="user-dropdown-menu" disablePadding>
                  <ListItem disablePadding sx={{ borderRadius: "12px", overflow: "hidden", mb: 0.5 }}>
                    <ListItemButton onClick={handleOpenProfile} sx={{ py: 1 }}>
                      <ListItemIcon className="udm-icon" sx={{ minWidth: 30 }}>
                        <PersonRounded sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <Typography sx={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "inherit", color: "var(--color-text-primary)" }}>
                        My Profile
                      </Typography>
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ borderRadius: "12px", overflow: "hidden" }}>
                    <ListItemButton onClick={() => { navigate('/settings'); setUserOpen(false); }} sx={{ py: 1 }}>
                      <ListItemIcon className="udm-icon" sx={{ minWidth: 30 }}>
                        <SettingsRounded sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <Typography sx={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "inherit", color: "var(--color-text-primary)" }}>
                        Settings
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                </List>

                <Divider sx={{ borderColor: "rgba(244,63,94,0.1)" }} />

                {/* Logout */}
                <Box className="user-dropdown-footer">
                  <ButtonBase
                    component="button"
                    onClick={handleLogout}
                    disableRipple
                    sx={{ width: "100%", textAlign: "left" }}
                  >
                    <Box className="udm-icon">
                      <LogoutRounded sx={{ fontSize: 18, color: "inherit" }} />
                    </Box>
                    Sign Out
                  </ButtonBase>
                </Box>

              </Box>
            </Fade>
          </Box>

        </Box>
      </Box>

      {/* Profile Drawer */}
      <ModernProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />
    </>
  );
};

export default Navbar;
