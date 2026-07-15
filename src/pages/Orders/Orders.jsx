import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert, IconButton, Paper,
  Grid, Stack, Divider, Tabs, Tab, useTheme
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  AddRounded, SearchRounded, EditRounded,
  CheckRounded, ShoppingCartRounded, PendingRounded,
  ThumbUpRounded, ThumbDownRounded, LocalShippingRounded,
  DeleteRounded, CloseRounded, VisibilityRounded,
  InventoryRounded, PendingActionsRounded, CalendarMonthRounded,
  ArrowBackRounded
} from "@mui/icons-material";
import { orderService } from "../../services/orderService";
import { outletService } from "../../services/outletService";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { useWebSocketContext } from "../../context/WebSocketContext";
import { getCookie } from "../../utils/cookieUtils";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatOrderData } from "../../utils/exportUtils";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "./Orders.css";
import "../UserManagement/UserManagement.css";



const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.2s ease",
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#faf5ff',
  "&:hover": {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f3e8ff',
    "& td": { borderColor: theme.palette.divider },
  },
  "& td": {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: "16px 12px",
    transition: "border-color 0.2s ease",
  },
}));

const STATUS_META = {
  PENDING: { label: "Pending", cls: "pending", Icon: PendingRounded },
  PARTIALLY_APPROVED: { label: "Partially Approved", cls: "pending", Icon: PendingRounded },
  APPROVED: { label: "Approved", cls: "approved", Icon: ThumbUpRounded },
  COMPLETED: { label: "Completed", cls: "completed", Icon: LocalShippingRounded },
  REJECTED: { label: "Rejected", cls: "rejected", Icon: ThumbDownRounded },
  CANCELLED: { label: "Cancelled", cls: "cancelled", Icon: CloseRounded },
};

const TIMELINE = ["PENDING", "PARTIALLY_APPROVED", "APPROVED", "COMPLETED"];

const emptyOrder = { outletId: "", items: [] };
const emptyItem = { productId: "", quantity: 1, price: 0 };

/* ══════════════════════════════════════════
   Orders Page
══════════════════════════════════════════ */
const Orders = () => {
  const { user, role } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { latestOrder } = useWebSocketContext();
  const userOutletId = user?.outletId || getCookie("outletId") || "";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isOutletManager = role === "OUTLET_MANAGER";

  const [filters, setFilters] = useState({ status: "", outletId: isAdmin ? "" : userOutletId });
  const [detail, setDetail] = useState(null);
  const [isFormView, setIsFormView] = useState(false);
  const [create, setCreate] = useState({ open: false, data: emptyOrder });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, title: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('ordersPageSize') || '10', 10));
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);

  /* ── Extract array from various response shapes ── */
  const extractArr = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.content)) return val.content;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.data?.content)) return val.data.content;
    return [];
  };

  /* ── Load Orders (Dynamic) ── */
  const loadOrders = useCallback(async (signal) => {
    setLoading(true);
    try {
      const activeFilters = {
        page: page,
        size: pageSize,
        sort: "id,desc"
      };
      if (filters.outletId) activeFilters.outletId = filters.outletId;
      if (search) activeFilters.orderNo = search;
      if (filters.status) activeFilters.status = filters.status;

      const oData = await orderService.getAll(activeFilters, signal);
      if (oData && Array.isArray(oData.content)) {
        setOrders(oData.content);
        setTotalPages(oData.totalPages || 1);
        setTotalElements(oData.totalElements || 0);
      } else {
        setOrders(extractArr(oData));
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.outletId, search, page, pageSize]);

  const loadCounts = useCallback(async (signal) => {
    try {
      const activeFilters = {};
      if (filters.outletId) activeFilters.outletId = filters.outletId;
      const countsData = await orderService.getCounts(activeFilters, signal);
      setCounts(countsData);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("Fetch counts error:", err);
    }
  }, [filters.outletId]);

  /* ── Load Metadata (Initial Only) ── */
  const loadMetadata = useCallback(async () => {
    const safe = (promise) => promise.catch((err) => {
      console.error("Fetch metadata error:", err);
      return [];
    });

    const [otData, pData] = await Promise.all([
      safe(outletService.getOutlets ? outletService.getOutlets(0, 1000) : Promise.resolve([])),
      safe(productService.getProducts ? productService.getProducts(0, 1000) : Promise.resolve([])),
    ]);

    const rawOutlets = extractArr(otData);
    const enrichedOutlets = rawOutlets.map((o) => {
      if (o.allProducts) return o;
      const divisionMap = new Map();
      (o.mappings || []).forEach((m) => {
        const divId = m.divisionId || m.division?.id;
        if (!divisionMap.has(divId)) divisionMap.set(divId, []);
        const prodId = m.productId || m.product?.id;
        const prodName = m.productName || m.product?.name;
        if (prodId) divisionMap.get(divId).push({ id: prodId, name: prodName, productCode: m.productCode });
      });
      const allProducts = [];
      divisionMap.forEach((prods) => allProducts.push(...prods));
      return { ...o, allProducts };
    });

    setOutlets(enrichedOutlets);
    setProducts(extractArr(pData));
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);
  
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadOrders(controller.signal);
      loadCounts(controller.signal);
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadOrders, loadCounts]);

  // Re-fetch or update orders list in real-time when a WebSocket event for orders is received
  useEffect(() => {
    if (latestOrder) {
      const isRelevant = isAdmin || isManager || 
                         (latestOrder.outletId && String(latestOrder.outletId) === String(userOutletId));
      if (isRelevant) {
        if (latestOrder.type === 'ORDER_STATUS_CHANGED') {
          // Update local state instantly instead of fetching to avoid backend transaction race conditions
          setOrders(prev => prev.map(o => String(o.id) === String(latestOrder.orderId) ? { ...o, status: latestOrder.status } : o));
          setDetail(prev => prev && String(prev.id) === String(latestOrder.orderId) ? { ...prev, status: latestOrder.status } : prev);
        } else {
          // For NEW_ORDER, add a small delay so backend transaction can commit before we fetch
          const timer = setTimeout(() => {
            loadOrders();
            loadCounts();
          }, 500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [latestOrder, loadOrders, loadCounts, isAdmin, isManager, userOutletId]);

  // Ensure filters and new order data reflect the user's outlet
  useEffect(() => {
    if (!isAdmin && userOutletId) {
      setFilters(prev => ({ ...prev, outletId: userOutletId }));
      setCreate(prev => ({ ...prev, data: { ...prev.data, outletId: userOutletId } }));
    }
  }, [userOutletId, isAdmin]);

  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const filtered = orders;
  const [submitLoading, setSubmitLoading] = useState(false);

  /* ── Create order ── */
  const handleCreate = async () => {
    if (!create.data.outletId || create.data.items.length === 0)
      return toast("Please select outlet and add items", "error");

    setSubmitLoading(true);
    try {
      await orderService.create(create.data);
      toast("Order created successfully");
      setCreate({ open: false, data: emptyOrder });
      setIsFormView(false);
      loadOrders();
      loadCounts();
    } catch (err) {
      toast(err.response?.data?.message || "Creation failed", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ── Delete order ── */
  const handleDelete = async () => {
    try {
      await orderService.delete(delDialog.id);
      toast("Order deleted");
      setDelDialog({ open: false, id: null, title: "" });
      loadOrders();
      loadCounts();
    } catch (err) {
      toast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  /* ── Status update ── */
  const updateStatus = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      toast(`Order ${status.toLowerCase()}`);
      setDetail(null);
      loadOrders();
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    }
  };

  /* ── Item helpers ── */
  const addItem = () =>
    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: [...prev.data.items, { ...emptyItem }] },
    }));

  const removeItem = (idx) =>
    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: prev.data.items.filter((_, i) => i !== idx) },
    }));

  const updateItem = (idx, key, val) => {
    const newItems = [...create.data.items];
    newItems[idx] = { ...newItems[idx], [key]: val };

    if (key === "productId") {
      const p = products.find((prod) => String(prod.id) === String(val));
      if (p) newItems[idx].price = p.sellingPrice ?? 0;
    }

    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: newItems },
    }));
  };

  const timelineIdx = (status) => TIMELINE.indexOf(status);

  /* ── Outlet display name helper ── */
  const outletName = (ot) => ot.outletName || ot.name || "Unknown";

  return (
    <Box className="orders-page">
      {/* ── Header ── */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title">
            <TypingText text="Orders" />
          </Typography>
          <Typography className="page-subtitle">Track and manage batch orders</Typography>
        </Box>
        {(isAdmin || isManager || (role === "USER" || role === "OUTLET_MANAGER")) && (
          <Button variant="contained" color="primary" startIcon={<AddRounded />}
            onClick={() => {
              let initialOutletId = "";
              if (!isAdmin) {
                const storedOutletId = getCookie("outletId");
                initialOutletId = storedOutletId || userOutletId || "";
              }
              setCreate({ open: true, data: { ...emptyOrder, outletId: initialOutletId, items: [{ ...emptyItem }] } });
              setIsFormView(true);
            }}
            sx={{ borderRadius: 2, boxShadow: "none" }}
          >
            Create Order
          </Button>
        )}
      </Box>

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <FormContainer>
            <FormHeader
              title="Create New Supply Order"
              subtitle="Select an outlet and add items to create a supply order"
              onClose={() => { setIsFormView(false); setCreate({ open: false, data: emptyOrder }); }}
              onSave={handleCreate}
              saveLabel="Submit Order"
              saving={submitLoading}
              saveIcon={<ShoppingCartRounded />}
              colorAccent="primary"
            />

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 4, p: 3, border: "1px solid", borderColor: "divider", borderRadius: 4, bgcolor: "background.paper" }}>
                    <FormSectionHeader title="Target Outlet" color="primary.main" />
                    <SearchableSelect
                      options={
                        (isAdmin || isManager) 
                          ? outlets.map((ot) => ({ id: ot.id, name: outletName(ot) }))
                          : outlets.filter((ot) => String(ot.id) === String(userOutletId)).map((ot) => ({ id: ot.id, name: outletName(ot) }))
                      }
                      value={create.data.outletId}
                      onChange={(id) => setCreate((p) => ({ ...p, data: { ...p.data, outletId: id, items: [{ ...emptyItem }] } }))}
                      placeholder={userOutletId && !isAdmin && !isManager ? "Assigned Outlet" : "— Select Outlet —"}
                      searchPlaceholder="Search outlets..."
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "text.primary", fontFamily: "inherit" }}>Order Items</Typography>
                    <Button variant="text" startIcon={<AddRounded />} onClick={addItem} sx={{ color: "primary.main", fontWeight: 700 }}>Add Item</Button>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {create.data.items.map((item, idx) => (
                      <Box key={idx} sx={{ position: "relative", p: 3, border: "1px solid", borderColor: "divider", borderRadius: 4, bgcolor: "background.paper", transition: "all 0.2s", "&:hover": { borderColor: "primary.main", boxShadow: "0 4px 12px rgba(125,42,232,0.05)" } }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={5}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Product *</Typography>
                            <SearchableSelect
                              options={(() => {
                                const selectedOutlet = outlets.find(o => String(o.id) === String(create.data.outletId));
                                if (selectedOutlet && selectedOutlet.allProducts && selectedOutlet.allProducts.length > 0) {
                                  return selectedOutlet.allProducts.map((p) => ({ id: p.id, name: p.name || p.productName || `Product ${p.id}` }));
                                }
                                return products.map((p) => ({ id: p.id, name: p.name || p.productName || `Product ${p.id}` }));
                              })()}
                              value={item.productId}
                              onChange={(id) => updateItem(idx, "productId", id)}
                              placeholder="Select product"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Qty *</Typography>
                            <TextField fullWidth size="small" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} inputProps={{ min: 1 }} />
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Price ₹</Typography>
                            <TextField fullWidth size="small" type="number" value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)} inputProps={{ min: 0 }} />
                          </Grid>
                          <Grid item xs={12} sm={1} sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton onClick={() => removeItem(idx)} color="error" size="small" disabled={create.data.items.length === 1}>
                              <DeleteRounded />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 4, bgcolor: "background.default", borderRadius: 4, border: "1px solid", borderColor: "divider", height: "100%", position: "sticky", top: 24 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                      <ShoppingCartRounded sx={{ color: "primary.main" }} /> Order Summary
                    </Typography>
 
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Destination Outlet</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {outlets.find(o => String(o.id) === String(create.data.outletId))?.outletName || "Not Selected"}
                        </Typography>
                      </Box>
 
                      <Divider />
 
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Items</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>{create.data.items.length}</Typography>
                      </Box>
 
                      <Box sx={{ p: 2, bgcolor: "primary.main", borderRadius: 3, color: "#fff" }}>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Estimated Value</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          ₹{create.data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </FormContainer>
        </Box>
      ) : !detail && (
        <>
          {/* ── Stat Cards ── */}
          <Box className="stat-cards-row">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const theme = 
                key === "PENDING" || key === "PARTIALLY_APPROVED" ? "orange" :
                key === "APPROVED" ? "green" :
                key === "REJECTED" ? "rose" :
                key === "COMPLETED" ? "blue" : "indigo";
              
              const isPending = key === "PENDING" || key === "PARTIALLY_APPROVED";
              const isApproved = key === "APPROVED";
              const isRejected = key === "REJECTED";
              
              const iconBg = isDark ? (
                isPending ? "rgba(245, 158, 11, 0.2)" :
                isApproved ? "rgba(22, 163, 74, 0.2)" :
                isRejected ? "rgba(239, 68, 68, 0.2)" : "rgba(2, 132, 199, 0.2)"
              ) : (
                isPending ? "#fef9c3" :
                isApproved ? "#dcfce7" :
                isRejected ? "#fee2e2" : "#e0f2fe"
              );

              const iconColor = isDark ? (
                isPending ? "#fbbf24" :
                isApproved ? "#4ade80" :
                isRejected ? "#f87171" : "#60a5fa"
              ) : (
                isPending ? "#ca8a04" :
                isApproved ? "#16a34a" :
                isRejected ? "#ef4444" : "#0284c7"
              );

              return (
                <Box className={`stat-card stat-${theme}`} key={key}>
                  <Box className="stat-card-icon" sx={{ background: iconBg }}>
                    <meta.Icon sx={{ color: iconColor, fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography className="stat-card-value">{counts[key] || 0}</Typography>
                    <Typography className="stat-card-label">{meta.label}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ── Table ── */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontFamily: "inherit" }}>
                  All Orders
                </Typography>
                <ExportMenu getData={() => formatOrderData(filtered)} filename="orders" title="Orders Report" backendType="orders" />
 
                {/* Outlet Filter - Admin or global Manager */}
                {(isAdmin || (isManager && !userOutletId)) && (
                  <Select
                    size="small" displayEmpty value={filters.outletId}
                    onChange={(e) => setFilters((f) => ({ ...f, outletId: e.target.value }))}
                    sx={{ minWidth: 150, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "inherit", bgcolor: "background.default" }}
                  >
                    <MenuItem value="">All Outlets</MenuItem>
                    {outlets.map((ot) => (
                      <MenuItem key={ot.id} value={ot.id}>{outletName(ot)}</MenuItem>
                    ))}
                  </Select>
                )}
 
                <Button
                  size="small"
                  onClick={() => setFilters({ status: "", outletId: isAdmin ? "" : userOutletId })}
                  sx={{ fontSize: "0.75rem", fontWeight: 600, color: "primary.main" }}
                >
                  Clear Filters
                </Button>
              </Box>
 
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", display: { xs: "none", sm: "block" } }}>Show:</Typography>
                  <Select
                    size="small"
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = e.target.value;
                      setPageSize(newSize);
                      localStorage.setItem('ordersPageSize', newSize);
                      setPage(0);
                    }}
                    sx={{ height: 36, fontSize: "0.875rem", minWidth: 70 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={1000}>100+</MenuItem>
                  </Select>
                </Box>
                <Box className="table-search">
                  <SearchRounded sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                  <InputBase placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "inherit", color: "text.primary" }} />
                </Box>
              </Box>
            </Box>

            {/* Dynamic Status Tabs */}
            <Tabs
              value={filters.status}
              onChange={(e, newVal) => setFilters((f) => ({ ...f, status: newVal }))}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                borderBottom: "1px solid",
                borderBottomColor: "divider",
                "& .MuiTabs-indicator": { backgroundColor: "primary.main", height: "3px", borderRadius: "10px" },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  color: "text.secondary",
                  pb: 1.5,
                  pt: 1.5,
                  minWidth: 100,
                  "&.Mui-selected": { color: "primary.main" },
                },
              }}
            >
              <Tab label={`All Orders (${totalElements || filtered.length})`} value="" />
              {Object.entries(STATUS_META).map(([k, v]) => (
                <Tab key={k} label={`${v.label} (${counts[k] || 0})`} value={k} />
              ))}
            </Tabs>
 
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    {["Order No", "Outlet", "Items", "Status", "Date", "Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: "inherit" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress color="primary" size={32} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary", fontFamily: "inherit" }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((o) => {
                      const meta = STATUS_META[o.status] || STATUS_META.PENDING;
                      return (
                        <TableRow
                          key={o.id} hover
                          sx={{ "&:hover": { background: "action.hover" }, "&:last-child td": { borderBottom: 0 }, cursor: "pointer" }}
                          onClick={() => setDetail(o)}
                        >
                          <TableCell sx={{ fontWeight: 700, color: "primary.main", fontFamily: "inherit", fontSize: "0.875rem" }}>
                            {o.orderNo || `ORD-${o.id}`}
                          </TableCell>
                          <TableCell sx={{ color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>
                            {o.outlet?.outletName || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>
                            {o.items?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Typography className={`order-status ${meta.cls}`}>
                              <meta.Icon sx={{ fontSize: 16 }} /> {meta.label}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", fontFamily: "inherit" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="View Details">
                                <IconButton size="small" className="action-btn edit" onClick={() => setDetail(o)}>
                                  <VisibilityRounded sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title={o.status === "PENDING" ? "Edit Order" : "Cannot edit processed orders"}>
                                <span>
                                  <IconButton size="small" className="action-btn edit" disabled={o.status !== "PENDING"} onClick={() => {
                                    setCreate({ open: true, data: { ...o } });
                                    setIsFormView(true);
                                  }}>
                                    <EditRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              {(isAdmin || isManager) && (o.status === "PENDING" || o.status === "PARTIALLY_APPROVED") && (
                                <>
                                  <Tooltip title="Approve & Complete">
                                    <IconButton size="small" className="action-btn edit" onClick={() => updateStatus(o.id, "APPROVED")}>
                                      <CheckRounded sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton size="small" className="action-btn delete" onClick={() => updateStatus(o.id, "REJECTED")}>
                                      <ThumbDownRounded sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              
                              {o.status === "APPROVED" && (isAdmin || isManager || isOutletManager) && (
                                <Tooltip title="Mark Completed (Goods Received)">
                                  <IconButton size="small" className="action-btn edit" onClick={() => updateStatus(o.id, "COMPLETED")}>
                                    <CheckRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title={o.status === "PENDING" || isAdmin ? "Delete Order" : "Cannot delete processed orders"}>
                                <span>
                                  <IconButton size="small" className="action-btn delete" disabled={!(o.status === "PENDING" || isAdmin)} onClick={() => setDelDialog({ open: true, id: o.id, title: o.orderNo || `ORD-${o.id}` })}>
                                    <DeleteRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}>
                <ButtonBase
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid", borderColor: "divider", opacity: page === 0 ? 0.5 : 1, color: "text.primary" }}
                >
                  Previous
                </ButtonBase>
                <Typography sx={{ display: "flex", alignItems: "center", px: 2, fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}>
                  Page {page + 1} of {totalPages}
                </Typography>
                <ButtonBase
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid", borderColor: "divider", opacity: page >= totalPages - 1 ? 0.5 : 1, color: "text.primary" }}
                >
                  Next
                </ButtonBase>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ── Order Detail Full View ── */}
      {detail && (
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "20px", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.4)" : "0 24px 64px rgba(0,0,0,0.08)", mb: 4 }}>
            {/* Elegant Header */}
            <Box sx={{ 
              bgcolor: isDark ? "rgba(125,42,232,0.05)" : "#f9f8ff",
              borderBottom: "1px solid",
              borderBottomColor: "divider",
              p: { xs: 3, md: 4 }, 
              position: "relative" 
            }}>
              <Box sx={{ mb: 2 }}>
                <ButtonBase 
                  onClick={() => setDetail(null)} disableRipple
                  sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "all 0.2s", "&:hover": { color: "primary.main", transform: "translateX(-4px)" }, fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.5px" }}
                >
                  <ArrowBackRounded fontSize="small" /> BACK TO ORDERS
                </ButtonBase>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Typography sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, bgcolor: "background.paper", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "1px", border: "1px solid", borderColor: "divider", color: "text.primary" }}>
                  {detail.orderNo || `ORD-${detail.id}`}
                </Typography>
                <Typography sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, background: detail.status === "COMPLETED" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: detail.status === "COMPLETED" ? "#10b981" : "#d97706", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                  {detail.status}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.75rem", color: "text.primary", fontFamily: "inherit", mt: 1 }}>
                {detail.outlet?.outletName || "Outlet Order"}
              </Typography>
            </Box>

            {/* Timeline */}
            <Box sx={{ display: "flex", p: { xs: 3, md: 5 }, bgcolor: "background.default", borderBottom: "1px solid", borderBottomColor: "divider", overflowX: "auto" }}>
              {TIMELINE.map((step, i) => {
                const done = timelineIdx(detail.status) >= i;
                const active = timelineIdx(detail.status) === i;
                const StepIcon = STATUS_META[step]?.Icon || CheckRounded;
                return (
                  <Box key={step} sx={{ display: "flex", alignItems: "center", flex: 1, position: "relative", minWidth: "120px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 2 }}>
                      <Box sx={{ 
                        width: 56, height: 56, borderRadius: "16px", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: done ? "linear-gradient(135deg, var(--color-primary-light), var(--color-primary-main))" : "background.paper",
                        color: done ? "#fff" : "text.secondary",
                        border: done ? "none" : "2px dashed",
                        borderColor: "divider",
                        boxShadow: done ? "0 8px 20px rgba(125,42,232,0.3)" : "none",
                        transition: "all 0.3s ease",
                        transform: active ? "scale(1.1)" : "scale(1)"
                      }}>
                        <StepIcon sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ 
                        fontSize: "0.8rem", fontWeight: 800, mt: 2, textTransform: "uppercase", letterSpacing: "0.5px",
                        color: active ? "primary.main" : done ? "text.primary" : "text.secondary" 
                      }}>
                        {STATUS_META[step]?.label}
                      </Typography>
                    </Box>
                    {i < TIMELINE.length - 1 && (
                      <Box sx={{ 
                        position: "absolute", top: 28, left: "50%", width: "100%", height: "4px",
                        background: done && timelineIdx(detail.status) > i ? "linear-gradient(90deg, var(--color-primary-light), var(--color-primary-main))" : "divider",
                        transform: "translateY(-50%)", zIndex: 1, borderRadius: "2px"
                      }} />
                    )}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 }, position: "relative" }}>
              <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "1.2rem", mb: 2, fontFamily: "inherit" }}>Order Items</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", overflowX: 'auto', mb: 4 }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {["Product Details", "Quantity", "Price", "Total"].map((h) => (
                        <TableCell key={h} sx={{ fontFamily: "inherit" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detail.items || []).map((item, idx) => {
                      const matchedProduct = products.find(p => String(p.id) === String(item.productId));
                      const displayImg = item.image || item.product?.imageUrl || item.product?.image || matchedProduct?.image;
                      
                      return (
                      <StyledTableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "1rem" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: "10px", overflow: "hidden", bgcolor: "background.default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: "divider" }}>
                              {displayImg ? (
                                <img src={displayImg} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <Typography sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 700 }}>IMG</Typography>
                              )}
                            </Box>
                            <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.95rem" }}>
                              {item.product?.name || item.productName || item.productId || "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: isDark ? "#818cf8" : "#4f46e5", display: "inline-block", bgcolor: isDark ? "rgba(79, 70, 229, 0.15)" : "#eef2ff", px: 2, py: 0.5, borderRadius: "8px", fontSize: "0.95rem" }}>
                            {item.quantity}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, fontWeight: 600 }}>
                            (Fulfilled: {item.fulfilledQuantity || 0})
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.95rem" }}>₹{item.price ?? "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#10b981", fontSize: "1rem" }}>₹{(item.quantity * (item.price || 0)).toLocaleString()}</TableCell>
                      </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
 
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pt: 3, borderTop: "1px solid", borderTopColor: "divider" }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setDetail(null)}
                  sx={{ borderRadius: "50px", px: 4 }}
                >
                  Back to Orders
                </Button>
                {(isAdmin || isManager) && (detail.status === "PENDING" || detail.status === "PARTIALLY_APPROVED") && (
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => updateStatus(detail.id, "REJECTED")}
                      sx={{ borderRadius: "50px", px: 4, boxShadow: "none" }}
                    >
                      Reject Order
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => updateStatus(detail.id, "APPROVED")}
                      sx={{ borderRadius: "50px", px: 5, boxShadow: "none" }}
                    >
                      Approve Order
                    </Button>
                  </>
                )}
                {detail.status === "APPROVED" && (isAdmin || isManager || isOutletManager) && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => updateStatus(detail.id, "COMPLETED")}
                    sx={{ borderRadius: "50px", px: 5, boxShadow: "none" }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null, title: "" })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "text.primary" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "inherit", color: "text.secondary", fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{delDialog.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDelDialog({ open: false, id: null, title: "" })}
            sx={{ borderRadius: 2, color: "text.secondary", borderColor: "divider" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ borderRadius: 2, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "inherit" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;

