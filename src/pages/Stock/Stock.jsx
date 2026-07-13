import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert, IconButton, Paper,
  Grid, Stack, useTheme
} from "@mui/material";
import {
  SearchRounded, SwapHorizRounded, WarehouseRounded,
  TrendingUpRounded, TrendingDownRounded, CheckRounded,
  CloseRounded, AddRounded, VisibilityRounded, EditRounded, DeleteRounded
} from "@mui/icons-material";
import { stockService } from "../../services/stockService";
import API from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useWebSocketContext } from "../../context/WebSocketContext";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatStockData } from "../../utils/exportUtils";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "./Stock.css";
import "../UserManagement/UserManagement.css";


/* ── Stock level helper ── */
const stockLevel = (qty, max = 200) => {
  if (qty <= 0) return { cls: "critical", label: "Out of Stock", color: "#ef4444" };
  if (qty < 10) return { cls: "low", label: "Low Stock", color: "#f59e0b" };
  if (qty < 30) return { cls: "medium", label: "Moderate", color: "#3b82f6" };
  return { cls: "high", label: "Healthy", color: "#10b981" };
};



/* helper — extract flat outletId/productId from stock entry regardless of shape */
const stockOutletId = (s) => s.outletId ?? s.outlet?.id ?? "";
const stockProductId = (s) => s.productId ?? s.product?.id ?? "";
const stockBatchId = (s) => s.batchId ?? s.batch?.id ?? "";
const stockBatchNo = (s) => s.batchNo ?? s.batch?.batchNo ?? s.batchId ?? "";
const stockProductName = (s) => s.productName ?? s.product?.name ?? s.productId ?? "";
const stockOutletName = (s) => s.outletName ?? s.outlet?.outletName ?? s.outletId ?? "";

/* ══════════════════════════════════════════
   Stock Management Page
══════════════════════════════════════════ */
const Stock = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [stock, setStock] = useState([]);
  const [mainStock, setMainStock] = useState([]);
  const [txns, setTxns] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user, role } = useAuth();
  const { latestStockUpdate } = useWebSocketContext();
  const userOutletId = user?.outletId || "";
  const isAdmin = role === "ADMIN";
  const isOutletUser = (role === "USER" || role === "OUTLET_MANAGER");

  const [filters, setFilters] = useState({ productId: "", outletId: userOutletId, type: "" });
  const [tab, setTab] = useState("stock");
  const [isFormView, setIsFormView] = useState(false);
  const [detailDialog, setDetailDialog] = useState({ open: false, data: null });
  const [addStockData, setAddStockData] = useState({ id: null, productId: "", quantity: "", purchasePrice: "", sellingPrice: "", expiryDate: "", batchNo: "" });
  const [formErrors, setFormErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // Pagination state
  const [stockPage, setStockPage] = useState(0);
  const [mainStockPage, setMainStockPage] = useState(0);
  const [txnPage, setTxnPage] = useState(0);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('stockPageSize') || '10', 10));
  const [totalStockPages, setTotalStockPages] = useState(0);
  const [totalMainStockPages, setTotalMainStockPages] = useState(0);
  const [totalTxnPages, setTotalTxnPages] = useState(0);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0 });

  // Ensure filters are updated if user changes (rare)
  useEffect(() => {
    if (!isAdmin && userOutletId) {
      setFilters(prev => ({ ...prev, outletId: userOutletId }));
    }
  }, [userOutletId, isAdmin]);

  /* ── Load Dynamic Data (Stock/Txns) ── */
  const loadDynamicData = useCallback(async (signal) => {
    setLoading(true);
    try {
      const activeFilters = {
        page: tab === "stock" ? stockPage : txnPage,
        size: pageSize,
        sort: "id,desc"
      };

      if (tab === "stock") {
        if (search) activeFilters.search = search;
        if (filters.productId) activeFilters.productId = filters.productId;
        if (filters.outletId) activeFilters.outletId = filters.outletId;

        const sData = await stockService.getAll(activeFilters, signal);
        if (sData && sData.content) {
          setStock(sData.content);
          setTotalStockPages(sData.totalPages);
        } else {
          setStock(Array.isArray(sData) ? sData : []);
        }
      } else if (tab === "main") {
        if (search) activeFilters.search = search;
        if (filters.productId) activeFilters.productId = filters.productId;

        const bData = await API.get("/api/batches", { params: { ...activeFilters, page: mainStockPage } }).then(res => res.data.data);
        if (bData && bData.content) {
          setMainStock(bData.content);
          setTotalMainStockPages(bData.totalPages);
        } else {
          setMainStock(Array.isArray(bData) ? bData : []);
        }
      } else {
        if (filters.productId) activeFilters.productId = filters.productId;
        if (filters.outletId) activeFilters.outletId = filters.outletId;
        if (filters.type) activeFilters.type = filters.type;
        const tData = await stockService.getTransactions(activeFilters, signal);
        if (tData && tData.content) {
          setTxns(tData.content);
          setTotalTxnPages(tData.totalPages);
        } else {
          setTxns(Array.isArray(tData) ? tData : []);
        }
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("Dynamic data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, filters, search, stockPage, mainStockPage, txnPage, pageSize]);

  const loadStats = useCallback(async (signal) => {
    if (tab === "history") {
      try {
        const activeFilters = {};
        if (filters.productId) activeFilters.productId = filters.productId;
        if (filters.outletId) activeFilters.outletId = filters.outletId;
        const statsData = await stockService.getStats(activeFilters, signal);
        setStats(statsData);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error("Fetch stats error:", err);
      }
    }
  }, [tab, filters]);

  /* ── Load Metadata (Initial Only) ── */
  const loadMetadata = useCallback(async () => {
    try {
      const { outletService } = await import("../../services/outletService");
      const { productService } = await import("../../services/productService");

      const [otData, pData] = await Promise.all([
        outletService.getOutlets ? outletService.getOutlets(0, 1000) : Promise.resolve([]),
        productService.getProducts ? productService.getProducts(0, 1000) : Promise.resolve([]),
      ]);

      const outletList = Array.isArray(otData) ? otData : (otData?.content || []);
      const productList = Array.isArray(pData) ? pData : (pData?.content || []);

      setOutlets(outletList);
      setProducts(productList);
    } catch (err) {
      console.error("Metadata load error:", err);
    }
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadDynamicData(controller.signal);
      loadStats(controller.signal);
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadDynamicData, loadStats]);

  // Real-time stock update handler via WebSocket
  useEffect(() => {
    if (latestStockUpdate) {
      const isRelevant = isAdmin || 
                         (latestStockUpdate.outletId && String(latestStockUpdate.outletId) === String(userOutletId));
      if (isRelevant) {
        loadDynamicData();
      }
    }
  }, [latestStockUpdate, loadDynamicData, isAdmin, userOutletId]);

  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const aggregatedStock = useMemo(() => {
    if (!stock || stock.length === 0) return [];
    const map = {};
    stock.forEach(s => {
      const key = `${s.outletId || 'system'}-${s.productId || 'unknown'}`;
      if (!map[key]) {
        map[key] = { ...s, availableQty: 0, reservedQty: 0 };
      }
      map[key].availableQty += (s.availableQty || 0);
      map[key].reservedQty += (s.reservedQty || 0);
    });
    return Object.values(map);
  }, [stock]);

  const filteredStock = aggregatedStock; // Backend handles filtering, frontend aggregates batches

  const handleFillStock = async () => {
    const { productId, quantity, purchasePrice, sellingPrice, expiryDate } = addStockData;

    // Frontend Validation
    const errors = {};
    if (!productId) errors.productId = "Please select a product";

    if (!quantity) errors.quantity = "Please enter quantity";
    else if (isNaN(quantity) || Number(quantity) < 1) errors.quantity = "Only positive numbers are allowed";

    if (!purchasePrice) errors.purchasePrice = "Please enter purchase price";
    else if (isNaN(purchasePrice) || Number(purchasePrice) <= 0) errors.purchasePrice = "Only positive numbers are allowed";

    if (!sellingPrice) errors.sellingPrice = "Please enter selling price";
    else if (isNaN(sellingPrice) || Number(sellingPrice) <= 0) errors.sellingPrice = "Only positive numbers are allowed";

    if (!expiryDate) errors.expiryDate = "Please select an expiry date";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        productId: Number(productId),
        batchNo: addStockData.batchNo || `STK-${Date.now()}`,
        manufactureDate: new Date().toISOString().split("T")[0],
        expiryDate,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice)
      };

      if (addStockData.id) {
        await API.put(`/api/batches/${addStockData.id}`, payload);
        toast("Main stock updated successfully");
      } else {
        await API.post("/api/batches", payload);
        toast("Stock filled successfully");
      }

      setIsFormView(false);
      setAddStockData({ id: null, productId: "", quantity: "", purchasePrice: "", sellingPrice: "", expiryDate: "", batchNo: "" });
      loadDynamicData();
    } catch (err) {
      // Check if backend returned validation errors
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to fill stock";
        toast(msg, "error");
      }
    }
  };

  const totalIn = stats.totalIn || 0;
  const totalOut = stats.totalOut || 0;

  return (
    <Box className="stock-page">
      {/* Header */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title">
            <TypingText text={isOutletUser ? "Available Stock" : "Stock Management"} />
          </Typography>
          <Typography className="page-subtitle">
            {isOutletUser ? "View available inventory and request stock additions" : "Monitor outlet stock"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          {isAdmin && (
            <Button variant="contained" color="primary" onClick={() => { setAddStockData({ id: null, productId: "", quantity: "", purchasePrice: "", sellingPrice: "", expiryDate: "", batchNo: "" }); setIsFormView(true); }}
              startIcon={<AddRounded />}
              sx={{ borderRadius: "50px", px: 2.5, boxShadow: "none" }}>
              Fill Stock
            </Button>
          )}
        </Box>
      </Box>

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <FormContainer>
            <FormHeader
              title={addStockData.id ? "Edit Main Stock" : "Fill Main Stock"}
              subtitle="Add or update inventory in the main warehouse"
              onClose={() => { setIsFormView(false); setFormErrors({}); }}
              onSave={handleFillStock}
              saveLabel="Confirm"
              saveIcon={<AddRounded />}
              colorAccent="primary"
            />

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box>
                      <FormSectionHeader title="Product Details" color="#7d2ae8" />
                      <SearchableSelect
                        options={products.map(p => ({ id: p.id, name: p.name }))}
                        value={addStockData.productId}
                        onChange={(id) => {
                          const p = products.find(x => String(x.id) === String(id));
                          setAddStockData(t => ({ ...t, productId: id, purchasePrice: p?.purchasePrice || "", sellingPrice: p?.sellingPrice || "" }));
                          if (formErrors.productId) setFormErrors(e => ({ ...e, productId: null }));
                        }}
                        placeholder="— Select Product —"
                        error={!!formErrors.productId}
                      />
                      {formErrors.productId && <Typography sx={{ color: "#ef4444", fontSize: "0.75rem", mt: 0.5 }}>{formErrors.productId}</Typography>}
                    </Box>

                    <Box>
                      <FormSectionHeader title="Pricing" color="#10b981" />
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                        <Box>
                          <Typography className="dialog-field-label" sx={{ mb: 1, color: formErrors.purchasePrice ? "#ef4444" : "inherit" }}>Purchase Price *</Typography>
                          <TextField fullWidth size="small" type="text" placeholder="0"
                            value={addStockData.purchasePrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && !/^\d*\.?\d*$/.test(val)) {
                                setFormErrors(er => ({ ...er, purchasePrice: "Only numbers are allowed" }));
                              } else {
                                setAddStockData(t => ({ ...t, purchasePrice: val }));
                                if (formErrors.purchasePrice) setFormErrors(er => ({ ...er, purchasePrice: null }));
                              }
                            }}
                            error={!!formErrors.purchasePrice} helperText={formErrors.purchasePrice} />
                        </Box>
                        <Box>
                          <Typography className="dialog-field-label" sx={{ mb: 1, color: formErrors.sellingPrice ? "#ef4444" : "inherit" }}>Selling Price *</Typography>
                          <TextField fullWidth size="small" type="text" placeholder="0"
                            value={addStockData.sellingPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && !/^\d*\.?\d*$/.test(val)) {
                                setFormErrors(er => ({ ...er, sellingPrice: "Only numbers are allowed" }));
                              } else {
                                setAddStockData(t => ({ ...t, sellingPrice: val }));
                                if (formErrors.sellingPrice) setFormErrors(er => ({ ...er, sellingPrice: null }));
                              }
                            }}
                            error={!!formErrors.sellingPrice} helperText={formErrors.sellingPrice} />
                        </Box>
                      </Box>
                    </Box>

                    <Box>
                      <FormSectionHeader title="Inventory & Logistics" color="#0284c7" />
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                        <Box>
                          <Typography className="dialog-field-label" sx={{ mb: 1, color: formErrors.quantity ? "#ef4444" : "inherit" }}>Quantity *</Typography>
                          <TextField fullWidth size="small" type="text" placeholder="Enter Quantity"
                            value={addStockData.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && !/^\d*$/.test(val)) {
                                setFormErrors(er => ({ ...er, quantity: "Only numbers are allowed" }));
                              } else {
                                setAddStockData(t => ({ ...t, quantity: val }));
                                if (formErrors.quantity) setFormErrors(er => ({ ...er, quantity: null }));
                              }
                            }}
                            error={!!formErrors.quantity} helperText={formErrors.quantity} />
                        </Box>
                        <Box>
                          <Typography className="dialog-field-label" sx={{ mb: 1, color: formErrors.expiryDate ? "#ef4444" : "inherit" }}>Expiry Date *</Typography>
                          <TextField fullWidth size="small" type="date"
                            value={addStockData.expiryDate} onChange={(e) => { setAddStockData(t => ({ ...t, expiryDate: e.target.value })); if (formErrors.expiryDate) setFormErrors(er => ({ ...er, expiryDate: null })); }}
                            InputLabelProps={{ shrink: true }}
                            error={!!formErrors.expiryDate} helperText={formErrors.expiryDate} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </FormContainer>
        </Box>
      ) : (
        <>
          {/* Stat Cards */}
          {!isOutletUser && (
            <Box className="stat-cards-row">
              {[
                { label: "Stock Entries", value: stock.length, bg: isDark ? "rgba(125, 42, 232, 0.2)" : "#f5f0ff", color: isDark ? "#c084fc" : "#7d2ae8", Icon: WarehouseRounded, theme: "purple" },
                { label: "Total IN", value: totalIn, bg: isDark ? "rgba(22, 163, 74, 0.2)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a", Icon: TrendingUpRounded, theme: "green" },
                { label: "Total OUT", value: totalOut, bg: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2", color: isDark ? "#f87171" : "#ef4444", Icon: TrendingDownRounded, theme: "rose" },
                { label: "Transactions", value: txns.length, bg: isDark ? "rgba(2, 132, 199, 0.2)" : "#e0f2fe", color: isDark ? "#60a5fa" : "#0284c7", Icon: SwapHorizRounded, theme: "blue" },
              ].map(({ label, value, bg, color, Icon, theme }) => (
                <Box className={`stat-card stat-${theme}`} key={label}>
                  <Box className="stat-card-icon" sx={{ background: bg }}><Icon sx={{ color, fontSize: 22 }} /></Box>
                  <Box>
                    <Typography className="stat-card-value">{value}</Typography>
                    <Typography className="stat-card-label">{label}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Tab Row */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {["stock", "main", "history"].map((t) => (
              <ButtonBase key={t} onClick={() => setTab(t)} disableRipple
                sx={{ px: 2.5, py: 1, borderRadius: "50px", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg,#7d2ae8,#a855f7)" : "action.hover", color: tab === t ? "#fff" : "primary.main", boxShadow: tab === t ? "0 4px 12px rgba(125,42,232,0.3)" : "none" }}>
                {t === "stock" ? "Outlet Stock" : t === "main" ? "Main Warehouse Stock" : "Transaction History"}
              </ButtonBase>
            ))}
          </Box>

          {/* Table */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontFamily: "inherit" }}>
                  {tab === "stock" ? "Current Stock" : tab === "main" ? "Main Warehouse Stock" : "Transaction History"}
                </Typography>
                <ExportMenu
                  getData={() => tab === "stock" ? formatStockData(filteredStock) : txns.map(t => ({ Type: t.transactionType, Product: t.productName || t.productId, Outlet: t.outletName || t.outletId, Qty: t.quantity, By: t.createdBy, Date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—' }))}
                  filename={tab === "stock" ? "stock" : "transactions"}
                  title={tab === "stock" ? "Stock Report" : "Transaction History"}
                  backendType={tab === "stock" ? "stock" : undefined}
                />

                {tab === "history" && (
                  <>
                    <Select
                      size="small" displayEmpty value={filters.type}
                      onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                      sx={{ minWidth: 100, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "inherit" }}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="IN">IN</MenuItem>
                      <MenuItem value="OUT">OUT</MenuItem>
                      <MenuItem value="TRANSFER">TRANSFER</MenuItem>
                    </Select>

                    <Select
                      size="small" displayEmpty value={filters.productId}
                      onChange={(e) => setFilters(f => ({ ...f, productId: e.target.value }))}
                      sx={{ minWidth: 140, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "inherit" }}
                    >
                      <MenuItem value="">All Products</MenuItem>
                      {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>

                    <Select
                      size="small" displayEmpty value={filters.outletId}
                      onChange={(e) => setFilters(f => ({ ...f, outletId: e.target.value }))}
                      disabled={!(isAdmin || (role === "MANAGER" && !userOutletId))}
                      sx={{ minWidth: 140, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "inherit" }}
                    >
                      <MenuItem value="">{(isAdmin || (role === "MANAGER" && !userOutletId)) ? "All Outlets" : "Select Outlet"}</MenuItem>
                      {outlets.map(ot => <MenuItem key={ot.id} value={ot.id}>{ot.outletName}</MenuItem>)}
                    </Select>

                    <ButtonBase onClick={() => setFilters({ productId: "", outletId: userOutletId, type: "" })} sx={{ color: "primary.main", fontSize: "0.75rem", fontWeight: 600 }}>Clear</ButtonBase>
                  </>
                )}
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
                      localStorage.setItem('stockPageSize', newSize);
                      setStockPage(0); setMainStockPage(0); setTxnPage(0);
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

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflowX: 'auto' }}>
              {tab === "stock" ? (
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {isOutletUser
                        ? ["Product Name", "Available Stock", "Action"].map((h) => (
                          <TableCell key={h} sx={{ fontFamily: "inherit" }}>{h}</TableCell>
                        ))
                        : ["Outlet", "Product", "Available", "Reserved", "Level"].map((h) => (
                          <TableCell key={h} sx={{ fontFamily: "inherit" }}>{h}</TableCell>
                        ))
                      }
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={isOutletUser ? 3 : 6} align="center" sx={{ py: 6 }}><CircularProgress color="primary" size={32} /></TableCell></TableRow>
                    ) : filteredStock.length === 0 ? (
                      <TableRow><TableCell colSpan={isOutletUser ? 3 : 6} align="center" sx={{ py: 6, color: "text.secondary", fontFamily: "inherit" }}>No stock found</TableCell></TableRow>
                    ) : (
                      filteredStock.map((s) => {
                        const lvl = stockLevel(s.availableQty);
                        const isLow = s.availableQty < 10;
                        return (
                          <TableRow
                            key={s.id} hover
                            sx={{
                              "&:hover": { background: isLow ? "rgba(239,68,68,0.12)" : "action.hover" },
                              "&:last-child td": { borderBottom: 0 },
                              background: isLow ? "rgba(239,68,68,0.08)" : "inherit"
                            }}
                          >
                            {isOutletUser ? (
                              <>
                                <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.productName || s.productId}</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: isLow ? "#ef4444" : "text.primary", fontFamily: "inherit" }}>{s.availableQty}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Tooltip title="View Stock Detail">
                                      <IconButton size="small" sx={{ color: "#3b82f6", background: "rgba(59,130,246,0.12)" }} onClick={() => setDetailDialog({ open: true, data: s })}>
                                        <VisibilityRounded sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      size="small"
                                      onClick={() => navigate("/orders", { state: { prefillProduct: { id: s.productId, name: s.productName || s.productId } } })}
                                      sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontFamily: "inherit",
                                        fontSize: "0.75rem",
                                        borderRadius: "20px",
                                        boxShadow: "none"
                                      }}
                                    >
                                      Request Product
                                    </Button>
                                  </Box>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.outletName || s.outletId}</TableCell>
                                <TableCell sx={{ color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.productName || s.productId}</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: isLow ? "#ef4444" : "text.primary", fontFamily: "inherit" }}>{s.availableQty}</TableCell>
                                <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.reservedQty || 0}</TableCell>
                                <TableCell>
                                  <Box className="stock-level">
                                    <Box className="stock-level-bar">
                                      <Box className={`stock-level-fill ${lvl.cls}`} sx={{ width: `${Math.min((s.availableQty / 200) * 100, 100)}%`, backgroundColor: lvl.color }} />
                                    </Box>
                                    <Typography className={`stock-level-text ${lvl.cls}`} sx={{ color: lvl.color }}>{lvl.label}</Typography>
                                  </Box>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              ) : tab === "main" ? (
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {["Ref No", "Product", "Available", "Purchase Price", "Selling Price", "Expiry", "Actions"].map((h) => (
                        <TableCell key={h} sx={{ fontFamily: "inherit" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress color="primary" size={32} /></TableCell></TableRow>
                    ) : mainStock.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary", fontFamily: "inherit" }}>No main stock found</TableCell></TableRow>
                    ) : (
                      mainStock.map((s) => {
                        return (
                          <TableRow
                            key={s.id} hover
                            sx={{ "&:hover": { background: "action.hover" }, "&:last-child td": { borderBottom: 0 } }}
                          >
                            <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.batchNo}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.productName || s.product?.name || s.productId}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: "text.primary", fontFamily: "inherit" }}>{s.quantity}</TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>₹{s.purchasePrice}</TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>₹{s.sellingPrice}</TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{s.expiryDate}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.75 }}>
                                <Tooltip title="View Batch Details">
                                  <IconButton size="small" sx={{ color: "#3b82f6", background: "rgba(59,130,246,0.12)" }} onClick={() => setDetailDialog({ open: true, data: s })}>
                                    <VisibilityRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                {!isOutletUser && (
                                  <>
                                    <Tooltip title="Edit Stock Batch">
                                      <IconButton size="small" sx={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)" }} onClick={() => {
                                        setAddStockData({ id: s.id, productId: s.product?.id || s.productId, quantity: s.quantity, purchasePrice: s.purchasePrice, sellingPrice: s.sellingPrice, expiryDate: s.expiryDate, batchNo: s.batchNo });
                                        setIsFormView(true);
                                      }}>
                                        <EditRounded sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Batch">
                                      <IconButton size="small" sx={{ color: "#ef4444", background: "rgba(239,68,68,0.12)" }} onClick={async () => {
                                        if (window.confirm(`Are you sure you want to delete batch ${s.batchNo}?`)) {
                                          try {
                                            await API.delete(`/api/batches/${s.id}`);
                                            toast("Batch deleted successfully");
                                            loadDynamicData();
                                          } catch (err) {
                                            toast("Failed to delete batch", "error");
                                          }
                                        }
                                      }}>
                                        <DeleteRounded sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {isOutletUser && (
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => navigate("/orders", { state: { prefillProduct: { id: s.product?.id || s.productId, name: s.productName || s.product?.name || s.productId } } })}
                                    sx={{
                                      ml: 1,
                                      textTransform: "none",
                                      fontWeight: 600,
                                      fontFamily: "inherit",
                                      fontSize: "0.75rem",
                                      borderRadius: "20px",
                                      boxShadow: "none"
                                    }}
                                  >
                                    Request Product
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {["Type", "Product", "Outlet", "Qty", "By", "Date"].map((h) => (
                        <TableCell key={h} sx={{ fontFamily: "inherit" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress color="primary" size={32} /></TableCell></TableRow>
                    ) : txns.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary", fontFamily: "inherit" }}>No transactions</TableCell></TableRow>
                    ) : (
                      txns.map((t) => (
                        <TableRow key={t.id} hover sx={{ "&:hover": { background: "action.hover" }, "&:last-child td": { borderBottom: 0 } }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              {t.transactionType === "IN"
                                ? <TrendingUpRounded sx={{ fontSize: 16, color: "#16a34a" }} />
                                : <TrendingDownRounded sx={{ fontSize: 16, color: "#ef4444" }} />
                              }
                              <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: t.transactionType === "IN" ? "#16a34a" : "#ef4444", fontFamily: "inherit" }}>{t.transactionType}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{t.productName || t.productId}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{t.outletName || t.outletId}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>{t.quantity}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{t.createdBy}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", fontFamily: "inherit" }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TableContainer>

            {/* Pagination */}
            {((tab === "stock" && totalStockPages > 1) || (tab === "main" && totalMainStockPages > 1) || (tab === "history" && totalTxnPages > 1)) && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}>
                <ButtonBase
                  disabled={tab === "stock" ? stockPage === 0 : tab === "main" ? mainStockPage === 0 : txnPage === 0}
                  onClick={() => tab === "stock" ? setStockPage(p => p - 1) : tab === "main" ? setMainStockPage(p => p - 1) : setTxnPage(p => p - 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid", borderColor: "divider", opacity: (tab === "stock" ? stockPage === 0 : tab === "main" ? mainStockPage === 0 : txnPage === 0) ? 0.5 : 1 }}
                >
                  Previous
                </ButtonBase>
                <Typography sx={{ display: "flex", alignItems: "center", px: 2, fontSize: "0.875rem", fontWeight: 600 }}>
                  Page {(tab === "stock" ? stockPage : tab === "main" ? mainStockPage : txnPage) + 1} of {tab === "stock" ? totalStockPages : tab === "main" ? totalMainStockPages : totalTxnPages}
                </Typography>
                <ButtonBase
                  disabled={tab === "stock" ? stockPage >= totalStockPages - 1 : tab === "main" ? mainStockPage >= totalMainStockPages - 1 : txnPage >= totalTxnPages - 1}
                  onClick={() => tab === "stock" ? setStockPage(p => p + 1) : tab === "main" ? setMainStockPage(p => p + 1) : setTxnPage(p => p + 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid", borderColor: "divider", opacity: (tab === "stock" ? stockPage >= totalStockPages - 1 : tab === "main" ? mainStockPage >= totalMainStockPages - 1 : txnPage >= totalTxnPages - 1) ? 0.5 : 1 }}
                >
                  Next
                </ButtonBase>
              </Box>
            )}
          </Box>
        </>
      )}

      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, data: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "text.primary" }}>Stock Details</DialogTitle>
        <DialogContent>
          {detailDialog.data && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>Product</Typography>
                <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{detailDialog.data.productName || detailDialog.data.product?.name || detailDialog.data.productId}</Typography>
              </Box>
              {detailDialog.data.batchNo && (
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>Batch No</Typography>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{detailDialog.data.batchNo}</Typography>
                </Box>
              )}
              {detailDialog.data.outletName && (
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>Outlet</Typography>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{detailDialog.data.outletName}</Typography>
                </Box>
              )}
              <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>Available Quantity</Typography>
                  <Typography sx={{ fontWeight: 700, color: "#10b981", fontSize: "1.2rem" }}>{detailDialog.data.quantity ?? detailDialog.data.availableQty}</Typography>
                </Box>
                {detailDialog.data.reservedQty !== undefined && (
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>Reserved Quantity</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#f59e0b", fontSize: "1.2rem" }}>{detailDialog.data.reservedQty}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDetailDialog({ open: false, data: null })} sx={{ borderRadius: "50px", px: 3 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "inherit" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Stock;

