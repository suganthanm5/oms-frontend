/* ══════════════════════════════════════════
   Notification Centre Page
   ══════════════════════════════════════════ */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TypingText from "../../components/TypingText";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  useTheme
} from "@mui/material";
import {
  NotificationsRounded,
  StoreRounded,
  PlaceRounded,
  AccountTreeRounded,
  WarningAmberRounded,
  SearchRounded,
  DeleteSweepRounded,
  ArrowForwardIosRounded,
  RefreshRounded,
  ArrowBackRounded,
} from "@mui/icons-material";
import { reportService } from "../../services/reportService";
import { getLocations } from "../../services/locationService";
import { getProducts } from "../../services/productService";
import { outletService } from "../../services/outletService";
import { orderService } from "../../services/orderService";
import { useWebSocketContext } from "../../context/WebSocketContext";
import "./NotificationPage.css";

const getNotifColor = (color, isDark) => {
  if (!isDark) return color;
  if (color === "#7d2ae8" || color === "#7c3aed") return "#c084fc";
  if (color === "#db2777") return "#f472b6";
  if (color === "#ef4444") return "#f87171";
  if (color === "#f59e0b") return "#fbbf24";
  if (color === "#ea580c") return "#fb923c";
  if (color === "#10b981") return "#4ade80";
  if (color === "#0ea5e9") return "#38bdf8";
  return color;
};

const NotificationPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { latestNotification } = useWebSocketContext();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Orders, 2: Stock, 3: Outlets & Locations, 4: Products
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("dismissed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* Dynamic Data Sources */
  const [summary, setSummary] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [outletsList, setOutletsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summ, ords, outs, locs, prods] = await Promise.all([
        reportService.getDashboardSummary().catch(() => null),
        orderService.getAll({ size: 20 }).catch(() => null),
        outletService.getAll(0, 20, "").catch(() => null),
        getLocations(0, 20, "").catch(() => null),
        getProducts(0, 20).catch(() => null),
      ]);

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
        if (Array.isArray(lList)) setLocationsList(lList);
      }
      
      if (prods) {
        const pList = prods.content ?? prods.data?.content ?? prods.data ?? prods;
        if (Array.isArray(pList)) setProductsList(pList);
      }
    } catch (err) {
      console.error("NotificationPage: Failed to load events feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* Save dismissed IDs */
  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    const allIds = notificationsList.map((n) => n.id);
    const updated = [...dismissedIds, ...allIds];
    setDismissedIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  /* Build dynamic activity stream */
  const notificationsList = useMemo(() => {
    const list = [];

    // 1. Stock warnings
    if (summary?.lowStockCount > 0) {
      list.push({
        id: "alert-low-stock",
        category: "stock",
        Icon: WarningAmberRounded,
        title: "Critically Low Stock Warning",
        text: `${summary.lowStockCount} inventory items are currently running critically low.`,
        time: "Requires restocking",
        color: "#f59e0b",
        badge: "Critical Alert",
        onClick: () => navigate("/stock"),
      });
    }

    // 2. Pending orders alert
    if (summary?.pendingOrdersCount > 0) {
      list.push({
        id: "alert-pending-orders",
        category: "orders",
        Icon: StoreRounded,
        title: "Pending Orders Approval",
        text: `${summary.pendingOrdersCount} orders require administrator review and approval.`,
        time: "Action required",
        color: "#ef4444",
        badge: "Requires Action",
        onClick: () => navigate("/orders"),
      });
    }

    // 3. Orders status log
    ordersList.forEach((order) => {
      const orderNo = order.orderNo || `ORD-${order.id}`;
      const status = (order.status || "").toUpperCase();
      let title = "Order Status Event";
      let text = `Order ${orderNo} status is set to ${status}.`;
      let color = "#7d2ae8";
      let badge = "Order Log";

      if (status === "PENDING") {
        title = "New Pending Order Placed";
        text = `Order ${orderNo} has been requested and is awaiting confirmation.`;
        color = "#ef4444";
        badge = "Awaiting Action";
      } else if (status === "REJECTED" || status === "CANCELLED") {
        title = "Order Rejected / Cancelled";
        text = `Order ${orderNo} has been marked as rejected or cancelled by operations.`;
        color = "#ea580c";
        badge = "Rejected";
      } else if (status === "COMPLETED" || status === "DELIVERED") {
        title = "Order Completed Successfully";
        text = `Order ${orderNo} has been successfully completed and fulfilled.`;
        color = "#10b981";
        badge = "Completed";
      }

      list.push({
        id: `order-${order.id}-${status}`,
        category: "orders",
        Icon: StoreRounded,
        title,
        text,
        time: `Fulfillment Node: ${order.outletName || "Central"}`,
        color,
        badge,
        onClick: () => navigate("/orders"),
      });
    });

    // 4. Outlets Registered
    outletsList.forEach((outlet) => {
      list.push({
        id: `outlet-${outlet.id}`,
        category: "outlets",
        Icon: StoreRounded,
        title: "New Outlet Operational Node",
        text: `The branch outlet "${outlet.outletName}" has been successfully initialized.`,
        time: `Code: ${outlet.outletCode} • Owner: ${outlet.ownerName || "Staff"}`,
        color: "#7c3aed",
        badge: "New Branch",
        onClick: () => navigate("/outlet"),
      });
    });

    // 5. Locations Added
    locationsList.forEach((location) => {
      list.push({
        id: `location-${location.id}`,
        category: "outlets",
        Icon: PlaceRounded,
        title: "New Geographic Node Added",
        text: `Location node "${location.name}" has been mapped to state: ${location.state || "Active"}.`,
        time: `City Coordinate: ${location.city || "Operational"}`,
        color: "#0ea5e9",
        badge: "New Location",
        onClick: () => navigate("/location"),
      });
    });

    // 6. Products Added
    productsList.forEach((product) => {
      list.push({
        id: `product-${product.id}`,
        category: "products",
        Icon: AccountTreeRounded,
        title: "New Inventory Product Registered",
        text: `Product model "${product.name}" is now active with MRP of $${Number(product.mrp || 0).toLocaleString()}.`,
        time: `Product Code: ${product.productCode}`,
        color: "#db2777",
        badge: "New Product",
        onClick: () => navigate("/product"),
      });
    });

    // 7. Stored Real-time notifications
    try {
      const savedRealtime = localStorage.getItem("realtime_notifications");
      if (savedRealtime) {
        const realtimeList = JSON.parse(savedRealtime);
        realtimeList.forEach((notif) => {
          let category = "notifications";
          let Icon = NotificationsRounded;
          let color = "#7d2ae8";
          let badge = "System Update";

          if (notif.type === "USER_REGISTERED") {
            category = "outlets";
            Icon = NotificationsRounded;
            color = "#10b981";
            badge = "New User";
          } else if (notif.type === "PRODUCT_DELETED") {
            category = "products";
            Icon = AccountTreeRounded;
            color = "#ef4444";
            badge = "Product Removed";
          } else if (notif.type === "OUTLET_DELETED") {
            category = "outlets";
            Icon = StoreRounded;
            color = "#ef4444";
            badge = "Outlet Removed";
          } else if (notif.type === "LOCATION_DELETED") {
            category = "outlets";
            Icon = PlaceRounded;
            color = "#ef4444";
            badge = "Location Removed";
          } else if (notif.type === "DIVISION_DELETED") {
            category = "products";
            Icon = AccountTreeRounded;
            color = "#ef4444";
            badge = "Division Removed";
          }

          list.push({
            id: notif.id,
            category,
            Icon,
            title: notif.message,
            text: `Recorded: ${new Date(notif.timestamp).toLocaleString()}`,
            time: "System Log",
            color,
            badge,
            onClick: null
          });
        });
      }
    } catch (e) {
      console.error("Failed to load real-time notifications history", e);
    }

    // Deduplicate by ID and exclude dismissed notifications
    const seen = new Set();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return !dismissedIds.includes(item.id);
    });
  }, [summary, ordersList, outletsList, locationsList, productsList, dismissedIds, navigate, latestNotification]);

  /* Filter and search operations */
  const filteredNotificationsList = useMemo(() => {
    return notificationsList.filter((item) => {
      // 1. Tab filters
      if (activeTab === 1 && item.category !== "orders") return false;
      if (activeTab === 2 && item.category !== "stock") return false;
      if (activeTab === 3 && item.category !== "outlets") return false;
      if (activeTab === 4 && item.category !== "products") return false;

      // 2. Text Search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(query);
        const inText = item.text.toLowerCase().includes(query);
        const inBadge = item.badge.toLowerCase().includes(query);
        if (!inTitle && !inText && !inBadge) return false;
      }
      return true;
    });
  }, [notificationsList, activeTab, search]);

  return (
    <Box className="notif-page-container">
      <Card className="notif-page-card">
        {/* Header */}
        <Box className="notif-page-header">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Tooltip title="Go Back">
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  color: isDark ? "#c084fc" : "#7d2ae8",
                  background: "background.paper",
                  boxShadow: isDark ? "none" : "0 8px 16px rgba(125,42,232,0.06)",
                  borderRadius: "14px",
                  width: 48,
                  height: 48,
                  mr: 0.5,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    background: isDark ? "rgba(255,255,255,0.08)" : "#7d2ae8",
                    color: isDark ? "#c084fc" : "#ffffff",
                    transform: "translateX(-3px)",
                    boxShadow: isDark ? "none" : "0 8px 20px rgba(125,42,232,0.25)"
                  },
                }}
              >
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
            <Box className="notif-page-bell-icon">
              <NotificationsRounded sx={{ fontSize: 24, color: "primary.main" }} />
            </Box>
            <Box>
              <Typography variant="h5" className="notif-page-title">
                <TypingText text="Notification Centre" />
              </Typography>
              <Typography variant="body2" className="notif-page-subtitle">
                Inspect real-time system events, order changes, and inventory alerts.
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Events Feed">
              <IconButton onClick={fetchData} size="medium" sx={{ color: "primary.main", background: "action.hover" }}>
                <RefreshRounded />
              </IconButton>
            </Tooltip>
            {filteredNotificationsList.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepRounded />}
                onClick={handleClearAll}
                sx={{
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  textTransform: "none",
                }}
              >
                Dismiss All
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(125,42,232,0.1)" }} />

        {/* Filters and Search Bar */}
        <Box className="notif-page-controls">
          <TextField
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ color: "primary.main" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "50px",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f5f0ff",
                fontFamily: "inherit",
                fontSize: "13px",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "rgba(125,42,232,0.25)" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
              },
            }}
          />
 
          <Tabs
            value={activeTab}
            onChange={(e, newTab) => setActiveTab(newTab)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: "1px solid",
              borderBottomColor: "divider",
              "& .MuiTabs-indicator": { backgroundColor: "primary.main", height: "3px", borderRadius: "10px" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                color: "text.secondary",
                "&.Mui-selected": { color: "primary.main" },
              },
            }}
          >
            <Tab label="All Events" />
            <Tab label="Orders" />
            <Tab label="Low Stock" />
            <Tab label="Nodes & Locations" />
            <Tab label="Products" />
          </Tabs>
        </Box>

        {/* Content Body */}
        <CardContent sx={{ p: 0 }} className="notif-page-body">
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={10}>
              <CircularProgress color="primary" />
            </Box>
          ) : filteredNotificationsList.length === 0 ? (
            <Fade in={true}>
              <Box className="notif-empty-state">
                <Box className="notif-empty-circle">
                  <NotificationsRounded sx={{ fontSize: 50, color: "#a78bfa" }} />
                </Box>
                <Typography className="notif-empty-title">All Caught Up!</Typography>
                <Typography className="notif-empty-desc">
                  There are no unread system events or critical warnings at this time.
                </Typography>
              </Box>
            </Fade>
          ) : (
            <List disablePadding className="notif-page-list">
              {filteredNotificationsList.map((item) => (
                <ListItem
                  key={item.id}
                  disablePadding
                  className="notif-page-item-wrap"
                >
                  <ListItemButton
                    onClick={() => {
                      if (item.onClick) item.onClick();
                    }}
                    className="notif-page-item"
                  >
                    <Box
                      className="notif-item-left-icon"
                      sx={{ background: `${getNotifColor(item.color, isDark)}15`, color: getNotifColor(item.color, isDark) }}
                    >
                      <item.Icon sx={{ fontSize: 22 }} />
                    </Box>

                    <Box className="notif-item-middle">
                      <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                        <Typography className="notif-item-title-text">
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.badge}
                          size="small"
                          sx={{
                            backgroundColor: `${getNotifColor(item.color, isDark)}12`,
                            color: getNotifColor(item.color, isDark),
                            fontWeight: 700,
                            fontSize: "10px",
                            height: "20px",
                            fontFamily: "inherit",
                          }}
                        />
                      </Box>
                      <Typography className="notif-item-desc-text">
                        {item.text}
                      </Typography>
                      <Typography className="notif-item-time-text">
                        {item.time}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5} className="notif-item-right-actions">
                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(item.id);
                        }}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontFamily: "inherit",
                          color: "#94a3b8",
                          fontWeight: 500,
                          "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.06)" },
                        }}
                      >
                        Dismiss
                      </Button>
                      <ArrowForwardIosRounded sx={{ fontSize: 13, color: "#a78bfa" }} />
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationPage;

