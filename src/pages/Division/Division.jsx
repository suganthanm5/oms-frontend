import { useEffect, useState } from "react";
import { useFormHandler } from "../../hooks/useFormHandler";
import {
  getDivisions, createDivision, updateDivision, deleteDivision, bulkCreateDivisions,
} from "../../services/divisionService";
import {
  getProductsByDivision, createProduct, deleteProduct,
} from "../../services/productService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatDivisionData } from "../../utils/exportUtils";
import BulkUploadModal from "../../components/BulkUploadModal";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "../UserManagement/UserManagement.css";

import { styled, alpha } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, IconButton, Box, Typography, Grid, Stack,
  Card, CardContent, Avatar, Button, Select, MenuItem, Chip,
  TextField, CircularProgress, Paper, InputAdornment, Divider,
  LinearProgress, Badge,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

/* ─────────────────────────────────────────────
   THEME TOKENS
   ───────────────────────────────────────────── */
const C = {
  indigo: "#4f46e5",
  indigoLight: "#6366f1",
  indigoSoft: "var(--color-bg-secondary)",
  indigoBorder: "var(--color-border-hr)",
  sky: "#0ea5e9",
  skySoft: "var(--color-bg-secondary)",
  emerald: "#10b981",
  emeraldSoft: "var(--color-bg-secondary)",
  rose: "#ef4444",
  roseSoft: "var(--color-bg-secondary)",
  amber: "#f59e0b",
  amberSoft: "var(--color-bg-secondary)",
  slate900: "var(--color-text-primary)",
  slate800: "var(--color-text-primary)",
  slate600: "var(--color-text-secondary)",
  slate400: "var(--color-text-placeholder)",
  slate200: "var(--color-border-hr)",
  slate100: "var(--color-border-hr)",
  slate50: "var(--color-bg-primary)",
  white: "var(--color-bg-sidebar)",
};

/* ─────────────────────────────────────────────
   STYLED TABLE
   ───────────────────────────────────────────── */
const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    background: C.white,
    color: C.slate600,
    fontWeight: 700,
    fontSize: "0.78rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: `1px solid ${C.slate200}`,
    padding: "14px 16px",
    "@media (max-width: 600px)": {
      fontSize: "0.7rem",
      padding: "10px 8px",
      letterSpacing: "0.04em",
    },
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    color: C.slate800,
    borderBottom: `1px solid ${C.slate100}`,
    padding: "12px 16px",
    "@media (max-width: 600px)": {
      fontSize: "0.8rem",
      padding: "10px 8px",
    },
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  transition: "background 0.18s ease",
  "&:hover": {
    backgroundColor: C.indigoSoft,
    "& .action-cell": { opacity: 1 },
  },
  "&:last-child td": { border: 0 },
}));

/* ─────────────────────────────────────────────
   STAT CARD IS NOW IMPORTED VIA CSS
   ───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   MODAL WRAPPER
   ───────────────────────────────────────────── */
const AppModal = ({ title, subtitle, icon, onClose, children, actions, accent = C.indigo }) => (
  <Dialog open onClose={onClose} fullWidth maxWidth="sm"
    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.16)" } }}
  >
    <DialogTitle sx={{ p: 0 }}>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 2,
        px: 3, py: 2.5,
        background: `linear-gradient(135deg, ${alpha(accent, 0.06)} 0%, ${alpha(accent, 0.02)} 100%)`,
        borderBottom: `3px solid ${accent}`,
      }}>
        <Avatar sx={{ bgcolor: alpha(accent, 0.12), color: accent, borderRadius: 2, width: 44, height: 44 }}>
          {icon}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={800} sx={{ color: C.slate900, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: C.slate400, display: "block" }}>{subtitle}</Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", bgcolor: "background.default", borderRadius: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent sx={{ pt: 3, pb: actions ? 1 : 2 }}>{children}</DialogContent>
    {actions && (
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

/* ─────────────────────────────────────────────
   ACTION BUTTON (icon)
   ───────────────────────────────────────────── */
const ActionBtn = ({ title, onClick, icon, color, bg, hoverBg }) => (
  <Tooltip title={title} arrow>
    <IconButton onClick={onClick} size="small" sx={{
      color, bgcolor: bg, borderRadius: 1.5,
      "&:hover": { bgcolor: hoverBg, transform: "scale(1.1)" },
      transition: "all 0.15s ease",
    }}>
      {icon}
    </IconButton>
  </Tooltip>
);

/* ─────────────────────────────────────────────
   DIVISION AVATAR
   ───────────────────────────────────────────── */
const DivAvatar = ({ name, size = 36 }) => {
  const colors = [C.indigo, C.sky, C.emerald, C.amber, "#8b5cf6", "#ec4899", "#06b6d4"];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <Avatar sx={{
      width: size, height: size, fontSize: size * 0.42,
      fontWeight: 800, bgcolor: alpha(colors[idx], 0.12),
      color: colors[idx], borderRadius: 1.5,
      border: `2px solid ${alpha(colors[idx], 0.2)}`,
    }}>
      {name?.charAt(0).toUpperCase()}
    </Avatar>
  );
};

/* ─────────────────────────────────────────────
   PAGE SIZES
   ───────────────────────────────────────────── */
const PAGE_SIZES = [5, 10, 25, 50];
const EMPTY_PROD = { name: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "" };

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const Division = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(() => {
    const stored = localStorage.getItem('divisionPageSize');
    const parsed = parseInt(stored, 10);
    return PAGE_SIZES.includes(parsed) ? parsed : 10;
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isFormView, setIsFormView] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [productCountFilter, setProductCountFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [view, setView] = useState("table");
  const [productModal, setProductModal] = useState(null);
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodSaving, setProdSaving] = useState(false);
  const [existingNames, setExistingNames] = useState([]);

  // Form hook for division form
  const { register: registerDivision, handleSubmit: handleDivisionSubmit, formState: { errors: divisionErrors }, reset: resetDivision } = useFormHandler({
    name: ""
  });

  // Form hook for product form
  const { register: registerProduct, handleSubmit: handleProductSubmit, formState: { errors: productErrors }, reset: resetProduct } = useFormHandler(EMPTY_PROD);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllDivisionNames = async () => {
    try {
      const res = await getDivisions(0, 1000, "");
      const list = res?.content || [];
      setExistingNames(list.map(d => d.name?.toLowerCase().trim()).filter(Boolean));
    } catch (e) {
      console.error("Failed to pre-fetch division names:", e);
    }
  };

  useEffect(() => {
    if (isFormView) {
      fetchAllDivisionNames();
    }
  }, [isFormView]);

  const handleInputChange = (value) => {
    if (/[^a-zA-Z\s,]/.test(value)) {
      return "Only letters, spaces, and commas are allowed.";
    }
    if (value.startsWith(" ") || value.startsWith(",")) {
      return "Division name cannot start with a space or comma.";
    }

    const names = value.split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
    const dupes = names.filter(n => {
      if (editModal && editModal.name?.toLowerCase().trim() === n) {
        return false;
      }
      return existingNames.includes(n);
    });

    if (dupes.length > 0) {
      const dupOriginals = value.split(",")
        .map(n => n.trim())
        .filter(n => dupes.includes(n.toLowerCase()));
      return `Division already exists: ${dupOriginals.join(", ")}`;
    }
    return true;
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    localStorage.setItem('divisionPageSize', newSize.toString());
    setPage(1);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDivisions(controller.signal);
    return () => controller.abort();
  }, [page, pageSize, searchTerm, productCountFilter, dateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchTerm(search); setPage(1); }, 800);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDivisions = async (signal) => {
    setLoading(true); setError("");
    try {
      let minProd = null, maxProd = null;
      if (productCountFilter === "0") { minProd = 0; maxProd = 0; }
      else if (productCountFilter === "1-5") { minProd = 1; maxProd = 5; }
      else if (productCountFilter === "6-10") { minProd = 6; maxProd = 10; }
      else if (productCountFilter === "10+") { minProd = 10; }

      const res = await getDivisions(page - 1, pageSize, searchTerm, minProd, maxProd, dateFilter, signal);
      let list = [], tPages = 1, tElements = 0;
      if (Array.isArray(res)) { list = res; tElements = list.length; }
      else if (res?.content) { list = res.content; tPages = res.totalPages || 1; tElements = res.totalElements || list.length; }
      else if (res?.data?.content) { list = res.data.content; tPages = res.data.totalPages || 1; tElements = res.data.totalElements || list.length; }
      setDivisions(list); setTotalPages(tPages); setTotalElements(tElements);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load divisions. Check API connection.");
    } finally { setLoading(false); }
  };

  const handleAdd = async (data) => {
    const names = data.name.split(",").map(n => n.trim()).filter(Boolean);
    if (!names.length) { showToast("Enter at least one valid name.", "warning"); return; }
    
    const dupes = names.filter(n => existingNames.includes(n.toLowerCase()));
    if (dupes.length) {
      showToast(`Already exists: ${dupes.join(", ")}`, "warning");
      return;
    }

    const unique = [...new Set(names)];
    if (!unique.length) return;
    setSaving(true);
    let ok = 0; const failed = [];
    try {
      for (const name of unique) {
        try { await createDivision({ name }); ok++; } catch { failed.push(name); }
      }
      if (ok) showToast(ok === 1 ? `"${unique[0]}" added!` : `${ok} divisions added!`, "success");
      if (failed.length) showToast(`Failed: ${failed.join(", ")}`, "error");
      resetDivision();
      setIsFormView(false);
      page === 1 ? fetchDivisions() : setPage(1);
    } catch (e) {
      showToast("Error: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data) => {
    const trimmed = data.name.trim();
    if (editModal && editModal.name?.toLowerCase().trim() !== trimmed.toLowerCase()) {
      if (existingNames.includes(trimmed.toLowerCase())) {
        showToast(`Division "${trimmed}" already exists.`, "warning");
        return;
      }
    }

    setSaving(true);
    try {
      await updateDivision(editModal.id, { name: trimmed });
      setEditModal(null); setIsFormView(false); fetchDivisions();
    } catch (e) {
      showToast("Update failed: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteDivision(deleteModal.id);
      setDeleteModal(null);
      divisions.length === 1 && page > 1 ? setPage(p => p - 1) : fetchDivisions();
    } catch (e) { showToast("Delete failed: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const openProducts = async (d) => {
    setProductModal(d); resetProduct(EMPTY_PROD); setProdLoading(true);
    try {
      const res = await getProductsByDivision(d.id);
      const data = res?.data;
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.content) ? data.content : [];
      setProducts(list);
      setDivisions(prev => prev.map(div => div.id === d.id ? { ...div, products: list } : div));
    } catch { setProducts([]); } finally { setProdLoading(false); }
  };

  const generateProductCode = () => {
    const existing = products.map(p => p.productCode).filter(Boolean);
    let c = 1, code;
    do { code = `MKL${String(c).padStart(3, "0")}`; c++; } while (existing.includes(code));
    return code;
  };

  const handleAddProduct = async (data) => {
    setProdSaving(true);
    try {
      const payload = {
        name: data.name.trim(), productCode: generateProductCode(),
        uimPrice: Number(data.uimPrice) || 0, mrp: Number(data.mrp) || 0,
        sellingPrice: Number(data.sellingPrice) || 0, purchasePrice: Number(data.purchasePrice) || 0,
      };
      const res = await createProduct(productModal.id, payload);
      const p = res?.data?.data ?? res?.data;
      const updated = [...products, p];
      setProducts(updated);
      setDivisions(prev => prev.map(d => d.id === productModal.id ? { ...d, products: updated } : d));
      resetProduct();
    } catch (e) { showToast("Failed to add product: " + (e.response?.data?.message || e.message)); }
    finally { setProdSaving(false); }
  };

  const handleDeleteProduct = async (pid) => {
    try {
      await deleteProduct(pid);
      const updated = products.filter(p => p.id !== pid);
      setProducts(updated);
      setDivisions(prev => prev.map(d => d.id === productModal.id ? { ...d, products: updated } : d));
    } catch (e) { showToast("Failed to delete: " + (e.response?.data?.message || e.message)); }
  };

  const openEdit = d => { 
    setEditModal(d); 
    resetDivision({ name: d.name }); 
    setIsFormView(true); 
  };
  const safePage = Math.min(page, totalPages || 1);
  const hasActiveFilters = productCountFilter || dateFilter || search;

  /* ── FORM VIEW ── */
  if (isFormView) return (
    <Box sx={{ animation: "fadeIn 0.3s ease", "@keyframes fadeIn": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } } }}>
      <FormContainer>
        <FormHeader
          title={editModal ? "Edit Division" : "Add New Division"}
          subtitle={editModal ? `Updating: ${editModal.name}` : "Create one or multiple divisions at once"}
          onClose={() => { setIsFormView(false); setEditModal(null); resetDivision(); }}
          onSave={handleDivisionSubmit(editModal ? handleUpdate : handleAdd)}
          saving={saving}
          saveDisabled={!!divisionErrors.name}
          saveLabel={editModal ? "Save Changes" : "Create Division"}
          saveIcon={editModal ? <EditIcon /> : <AddIcon />}
          colorAccent="primary"
        />

        {/* Form Body */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <FormSectionHeader
                title="Division Details"
                color={C.indigoLight}
              />
              <TextField
                fullWidth
                label="Division Name *"
                variant="outlined"
                {...registerDivision("name", {
                  required: "Division name is required",
                  validate: handleInputChange
                })}
                error={!!divisionErrors.name}
                helperText={divisionErrors.name?.message || (!editModal ? "Separate multiple division names with commas to add them at once" : "")}
                placeholder={editModal ? "" : "e.g. Dairy, Electronics (comma-separated)"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryRoundedIcon sx={{ color: C.slate400, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 2.5, bgcolor: C.indigoSoft, borderRadius: 3, border: `1px solid ${C.indigoBorder}` }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: C.indigo, mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 16 }} /> Quick Tips
                </Typography>
                {["Division names must be unique.", "Only letters and spaces are allowed.", "Use commas to bulk-add multiple divisions."].map((tip, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.indigoLight, mt: 0.8, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: C.slate600, fontSize: "0.82rem" }}>{tip}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </FormContainer>
    </Box>
  );

  /* ── MAIN VIEW ── */
  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: C.slate900, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
            <TypingText text="Division Management" />
          </Typography>
          <Typography variant="body2" sx={{ color: C.slate400, mt: 0.5 }}>
            Manage and organize your business division units
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Button variant="outlined" color="primary" onClick={() => setBulkOpen(true)} startIcon={<UploadFileIcon />}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 2.5, width: { xs: "100%", sm: "auto" } }}>
            Bulk Upload
          </Button>
          <Box sx={{ width: { xs: "100%", sm: "auto" }, "& > button": { width: "100%", justifyContent: "center" } }}>
            <ExportMenu getData={() => formatDivisionData(divisions)} filename="divisions" title="Divisions Report" backendType="divisions" />
          </Box>
          <Button variant="contained" color="primary" onClick={() => { resetDivision({ name: "" }); setIsFormView(true); setEditModal(null); }}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, px: 3, boxShadow: "none", width: { xs: "100%", sm: "auto" } }}>
            Add Division
          </Button>
        </Stack>
      </Box>

      {/* ── Stat Cards ── */}
      <Box className="stat-cards-row">
        {[
          { label: "Total Divisions", value: totalElements, icon: FolderOpenRoundedIcon, theme: "indigo", color: C.indigo, bg: C.indigoSoft },
          { label: "Current Page", value: safePage, icon: TrendingUpIcon, theme: "green", color: C.emerald, bg: C.emeraldSoft },
          { label: "Total Pages", value: totalPages, icon: GridViewIcon, theme: "blue", color: C.sky, bg: C.skySoft },
        ].map((s, i) => (
          <Box className={`stat-card stat-${s.theme}`} key={i}>
            <Box className="stat-card-icon" sx={{ background: s.bg }}>
              <s.icon sx={{ fontSize: 22, color: s.color }} />
            </Box>
            <Box>
              <Typography className="stat-card-value">{loading ? "—" : s.value}</Typography>
              <Typography className="stat-card-label">{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Error Banner ── */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Toolbar ── */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${C.slate200}`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        {/* Search */}
        <TextField
          placeholder="Search divisions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: "100%", md: 280 }, "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: C.slate50 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: C.slate400, fontSize: 20 }} /></InputAdornment>,
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSearch(""); setSearchTerm(""); setPage(1); }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <FilterAltOutlinedIcon sx={{ color: C.slate400, fontSize: 20 }} />
          <Select value={productCountFilter} onChange={e => { setProductCountFilter(e.target.value); setPage(1); }}
            displayEmpty size="small"
            sx={{ minWidth: 150, borderRadius: 2, fontSize: "0.85rem", bgcolor: C.slate50 }}>
            <MenuItem value="">All Counts</MenuItem>
            <MenuItem value="0">No Products (0)</MenuItem>
            <MenuItem value="1-5">1–5 Products</MenuItem>
            <MenuItem value="6-10">6–10 Products</MenuItem>
            <MenuItem value="10+">10+ Products</MenuItem>
          </Select>
          <Select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            displayEmpty size="small"
            sx={{ minWidth: 140, borderRadius: 2, fontSize: "0.85rem", bgcolor: C.slate50 }}>
            <MenuItem value="">All Time</MenuItem>
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
          </Select>
          {hasActiveFilters && (
            <Button size="small" onClick={() => { setProductCountFilter(""); setDateFilter(""); setSearch(""); setSearchTerm(""); setPage(1); }}
              sx={{ textTransform: "none", color: C.rose, fontWeight: 600, fontSize: "0.8rem" }}>
              Clear All
            </Button>
          )}
        </Stack>

        {/* View toggle + page size */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" fontWeight={600} sx={{ color: C.slate400 }}>Show</Typography>
            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              size="small" sx={{ minWidth: 70, borderRadius: 2, fontSize: "0.85rem", height: 34 }}>
              {PAGE_SIZES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </Stack>
          <Box sx={{ display: "flex", bgcolor: C.slate100, p: 0.5, borderRadius: 2, gap: 0.5 }}>
            {[{ v: "table", icon: <TableChartIcon fontSize="small" /> }, { v: "card", icon: <GridViewIcon fontSize="small" /> }].map(({ v, icon }) => (
              <IconButton key={v} size="small" onClick={() => setView(v)}
                sx={{
                  borderRadius: 1.5, px: 1.5,
                  bgcolor: view === v ? C.white : "transparent",
                  color: view === v ? C.indigo : C.slate400,
                  boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}>
                {icon}
              </IconButton>
            ))}
          </Box>
        </Stack>
      </Paper>

      {/* Loading progress bar */}
      {loading && <LinearProgress sx={{ borderRadius: 1, mb: 1, "& .MuiLinearProgress-bar": { bgcolor: C.indigo } }} />}

      {/* ── TABLE VIEW ── */}
      {view === "table" && (
        <Paper elevation={0} sx={{ border: `1px solid ${C.slate200}`, borderRadius: 3, overflow: "hidden" }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center" sx={{ width: 60 }}>#</StyledTableCell>
                  <StyledTableCell>Division Name</StyledTableCell>
                  <StyledTableCell align="center" sx={{ width: 120 }}>Products</StyledTableCell>
                  <StyledTableCell align="center" sx={{ width: 200 }}>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <StyledTableRow key={i}>
                      {[60, "60%", 40, 120].map((w, j) => (
                        <StyledTableCell key={j} align={j === 0 || j === 2 || j === 3 ? "center" : "left"}>
                          <Skeleton variant="text" width={w} sx={{ mx: j !== 1 ? "auto" : 0 }} />
                        </StyledTableCell>
                      ))}
                    </StyledTableRow>
                  ))
                ) : divisions.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4}>
                      <Box sx={{ py: 10, textAlign: "center" }}>
                        <FolderOpenRoundedIcon sx={{ fontSize: 64, color: C.slate200, mb: 2, display: "block", mx: "auto" }} />
                        <Typography variant="h6" sx={{ color: C.slate400, mb: 1 }}>
                          {searchTerm ? "No divisions match your search" : "No divisions yet"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: C.slate400, mb: 3 }}>
                          {searchTerm ? "Try adjusting your filters" : "Create your first division to get started"}
                        </Typography>
                        {!searchTerm && (
                          <Button onClick={() => { resetDivision({ name: "" }); setIsFormView(true); setEditModal(null); }}
                            variant="contained" color="primary" startIcon={<AddIcon />}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, boxShadow: "none" }}>
                            Add First Division
                          </Button>
                        )}
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  divisions.map((d, i) => (
                    <StyledTableRow key={d.id}>
                      <StyledTableCell align="center">
                        <Typography variant="body2" fontWeight={700} sx={{ color: C.slate400 }}>
                          {(safePage - 1) * pageSize + i + 1}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <DivAvatar name={d.name} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: C.slate800 }}>{d.name}</Typography>
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          label={d.products?.length || 0}
                          size="small"
                          sx={{
                            bgcolor: d.products?.length ? C.indigoSoft : C.slate100,
                            color: d.products?.length ? C.indigo : C.slate400,
                            fontWeight: 700, fontSize: "0.78rem", height: 24,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center" className="action-cell">
                        <Stack direction="row" spacing={0.75} justifyContent="center">
                          <ActionBtn title="View Details" onClick={() => setViewModal(d)} icon={<VisibilityIcon sx={{ fontSize: 16 }} />} color={C.sky} bg={C.skySoft} hoverBg="#bae6fd" />
                          <ActionBtn title="Manage Products" onClick={() => openProducts(d)} icon={<InventoryIcon sx={{ fontSize: 16 }} />} color={C.emerald} bg={C.emeraldSoft} hoverBg="#bbf7d0" />
                          <ActionBtn title="Edit Division" onClick={() => openEdit(d)} icon={<EditIcon sx={{ fontSize: 16 }} />} color={C.indigo} bg={C.indigoSoft} hoverBg={C.indigoBorder} />
                          <ActionBtn title="Delete Division" onClick={() => setDeleteModal(d)} icon={<DeleteIcon sx={{ fontSize: 16 }} />} color={C.rose} bg={C.roseSoft} hoverBg="#fecaca" />
                        </Stack>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── CARD VIEW ── */}
      {view === "card" && (
        <Grid container spacing={2}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          ) : divisions.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ py: 10, textAlign: "center", bgcolor: C.white, borderRadius: 3, border: `1px dashed ${C.slate200}` }}>
                <FolderOpenRoundedIcon sx={{ fontSize: 64, color: C.slate200, mb: 2, display: "block", mx: "auto" }} />
                <Typography variant="h6" sx={{ color: C.slate400, mb: 2 }}>
                  {searchTerm ? "No divisions match" : "No divisions yet"}
                </Typography>
                {!searchTerm && (
                  <Button onClick={() => { resetDivision({ name: "" }); setIsFormView(true); setEditModal(null); }}
                    variant="contained" color="primary" startIcon={<AddIcon />}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, boxShadow: "none" }}>
                    Add First Division
                  </Button>
                )}
              </Box>
            </Grid>
          ) : (
            divisions.map((d, i) => (
              <Grid item xs={12} sm={6} lg={4} key={d.id}>
                <Paper elevation={0} sx={{
                  border: `1.5px solid ${C.slate200}`, borderRadius: 3, p: 2.5, height: "100%",
                  display: "flex", flexDirection: "column", transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: `0 12px 32px ${alpha(C.indigo, 0.1)}`, borderColor: C.indigoBorder },
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <DivAvatar name={d.name} size={44} />
                      <Box>
                        <Typography fontWeight={700} sx={{ color: C.slate900, fontSize: "0.95rem" }}>{d.name}</Typography>
                        <Chip label={`${d.products?.length || 0} Products`} size="small"
                          sx={{ bgcolor: C.indigoSoft, color: C.indigo, fontWeight: 700, fontSize: "0.7rem", height: 20, mt: 0.25 }} />
                      </Box>
                    </Stack>
                    <Typography variant="caption" fontWeight={700} sx={{ color: C.slate400 }}>
                      #{(safePage - 1) * pageSize + i + 1}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" sx={{ color: C.slate400, mb: 1.5 }}>Division Node</Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={1} sx={{ mt: "auto" }}>
                    {[
                      { label: "View", icon: <VisibilityIcon />, color: C.sky, bg: C.skySoft, action: () => setViewModal(d) },
                      { label: "Products", icon: <InventoryIcon />, color: C.emerald, bg: C.emeraldSoft, action: () => openProducts(d) },
                      { label: "Edit", icon: <EditIcon />, color: C.indigo, bg: C.indigoSoft, action: () => openEdit(d) },
                      { label: "Delete", icon: <DeleteIcon />, color: C.rose, bg: C.roseSoft, action: () => setDeleteModal(d) },
                    ].map(({ label, icon, color, bg, action }) => (
                      <Grid item xs={6} key={label}>
                        <Button fullWidth size="small" onClick={action}
                          startIcon={icon}
                          sx={{
                            color, bgcolor: bg, fontWeight: 700, fontSize: "0.75rem",
                            textTransform: "none", borderRadius: 1.5,
                            "&:hover": { filter: "brightness(0.94)" },
                          }}>
                          {label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* ── Pagination ── */}
      {!loading && divisions.length > 0 && (
        <Paper elevation={0} sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 2, p: 2, borderRadius: 3, mt: 2,
          border: `1px solid ${C.slate200}`,
        }}>
          <Typography variant="body2" sx={{ color: C.slate400 }}>
            Showing <Box component="span" fontWeight={700} sx={{ color: C.slate800 }}>
              {totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalElements)}
            </Box> of <Box component="span" fontWeight={700} sx={{ color: C.slate800 }}>{totalElements}</Box> entries
          </Typography>

          <Stack direction="row" spacing={0.75} alignItems="center">
            {[
              { icon: <FirstPageIcon />, onClick: () => setPage(1), disabled: safePage === 1 },
              { icon: <NavigateBeforeIcon />, onClick: () => setPage(p => p - 1), disabled: safePage === 1 },
            ].map(({ icon, onClick, disabled }, i) => (
              <IconButton key={i} size="small" onClick={onClick} disabled={disabled}
                sx={{ borderRadius: 1.5, border: `1px solid ${C.slate200}`, color: disabled ? C.slate200 : C.slate600, "&:hover:not(:disabled)": { bgcolor: C.indigoSoft, borderColor: C.indigoLight, color: C.indigo } }}>
                {icon}
              </IconButton>
            ))}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…" ? (
                <Typography key={`e${i}`} variant="body2" sx={{ color: C.slate400, px: 0.5 }}>…</Typography>
              ) : (
                <Button key={p} onClick={() => setPage(p)} size="small" variant={safePage === p ? "contained" : "outlined"}
                  sx={{
                    minWidth: 34, height: 34, p: 0, borderRadius: 1.5, fontWeight: 700,
                    ...(safePage === p
                      ? { bgcolor: C.indigo, color: C.white, border: "none", boxShadow: `0 2px 8px ${alpha(C.indigo, 0.4)}`, "&:hover": { bgcolor: "#3730a3" } }
                      : { color: C.slate600, borderColor: C.slate200, "&:hover": { bgcolor: C.indigoSoft, borderColor: C.indigoLight, color: C.indigo } }
                    ),
                  }}>
                  {p}
                </Button>
              ))}

            {[
              { icon: <NavigateNextIcon />, onClick: () => setPage(p => p + 1), disabled: safePage === totalPages },
              { icon: <LastPageIcon />, onClick: () => setPage(totalPages), disabled: safePage === totalPages },
            ].map(({ icon, onClick, disabled }, i) => (
              <IconButton key={i} size="small" onClick={onClick} disabled={disabled}
                sx={{ borderRadius: 1.5, border: `1px solid ${C.slate200}`, color: disabled ? C.slate200 : C.slate600, "&:hover:not(:disabled)": { bgcolor: C.indigoSoft, borderColor: C.indigoLight, color: C.indigo } }}>
                {icon}
              </IconButton>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <AppModal
          title="Division Details"
          subtitle={`Viewing: ${viewModal.name}`}
          icon={<VisibilityIcon />}
          onClose={() => setViewModal(null)}
          accent={C.sky}
          actions={
            <>
              <Button onClick={() => setViewModal(null)} variant="outlined" color="inherit"
                sx={{ borderRadius: 2, textTransform: "none", color: "text.secondary", borderColor: "divider" }}>Close</Button>
              <Button onClick={() => { setViewModal(null); openEdit(viewModal); }} variant="contained" color="info" startIcon={<EditIcon />}
                sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>
                Edit Division
              </Button>
            </>
          }
        >
          <Stack spacing={0}>
            {[
              { label: "Division ID", value: viewModal.id },
              { label: "Division Name", value: viewModal.name },
              { label: "Total Products", value: <Chip label={viewModal.products?.length || 0} size="small" sx={{ bgcolor: C.indigoSoft, color: C.indigo, fontWeight: 700 }} /> },
              { label: "Created", value: new Date(viewModal.createdAt || viewModal.created_at || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
              { label: "Last Updated", value: new Date(viewModal.updatedAt || viewModal.updated_at || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
              { label: "Status", value: <Chip label="Active" size="small" sx={{ bgcolor: C.emeraldSoft, color: C.emerald, fontWeight: 700, fontSize: "0.72rem" }} /> },
            ].map((row, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: idx < 5 ? `1px solid ${C.slate100}` : "none" }}>
                <Typography variant="body2" sx={{ color: C.slate400, fontWeight: 500 }}>{row.label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: C.slate800 }}>{row.value}</Typography>
              </Box>
            ))}
          </Stack>
        </AppModal>
      )}

      {/* ── PRODUCTS MODAL ── */}
      {productModal && (
        <AppModal title={`Products — ${productModal.name}`} subtitle="Manage products in this division" icon={<InventoryIcon />} onClose={() => setProductModal(null)} accent={C.emerald}>
          <Stack spacing={2}>
            {/* Add product form */}
            <Box sx={{ p: 2.5, bgcolor: C.slate50, borderRadius: 2.5, border: `1px solid ${C.slate200}` }} component="form" onSubmit={handleProductSubmit(handleAddProduct)}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: C.slate800, mb: 2 }}>Add New Product</Typography>
              <Stack spacing={1.5}>
                <TextField fullWidth size="small" label="Product Name *" placeholder="e.g. Cheese 500g"
                  {...registerProduct("name", { required: "Product name is required" })}
                  error={!!productErrors.name}
                  helperText={productErrors.name?.message}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: C.white } }} />
                <Grid container spacing={1.5}>
                  {[["uimPrice", "UIM Price"], ["mrp", "MRP"], ["sellingPrice", "Selling Price"], ["purchasePrice", "Purchase Price"]].map(([key, label]) => (
                    <Grid item xs={6} key={key}>
                      <TextField fullWidth size="small" label={label} type="number" placeholder="0"
                        {...registerProduct(key, { required: `${label} is required`, min: { value: 0, message: "Must be positive" } })}
                        error={!!productErrors[key]}
                        helperText={productErrors[key]?.message}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="caption" sx={{ color: C.slate400 }}>₹</Typography></InputAdornment> }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: C.white } }} />
                    </Grid>
                  ))}
                </Grid>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" type="button" onClick={() => resetProduct()} sx={{ textTransform: "none", color: C.slate400 }}>Clear</Button>
                  <Button size="small" type="submit" variant="contained" color="primary"
                    disabled={prodSaving}
                    startIcon={prodSaving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
                    sx={{ textTransform: "none", borderRadius: 2, boxShadow: "none", fontWeight: 700 }}>
                    {prodSaving ? "Adding…" : "Add Product"}
                  </Button>
                </Stack>
              </Stack>
            </Box>

            {/* Product list */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: C.slate800 }}>Existing Products</Typography>
                <Chip label={products.length} size="small" sx={{ height: 18, fontSize: "0.7rem", fontWeight: 700, bgcolor: C.indigoSoft, color: C.indigo }} />
              </Stack>
              <Stack spacing={1} sx={{ maxHeight: 280, overflowY: "auto", pr: 0.5 }}>
                {prodLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: 2 }} />)
                ) : products.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center", bgcolor: C.slate50, borderRadius: 2, border: `2px dashed ${C.slate200}` }}>
                    <Typography variant="body2" sx={{ color: C.slate400 }}>No products in this division</Typography>
                  </Box>
                ) : (
                  products.map(p => (
                    <Box key={p.id} sx={{
                      display: "flex", alignItems: "center", gap: 2, p: 1.5,
                      bgcolor: C.white, border: `1px solid ${C.slate100}`, borderRadius: 2,
                      transition: "all 0.15s", "&:hover": { borderColor: C.emerald, bgcolor: C.emeraldSoft },
                    }}>
                      <Avatar sx={{ bgcolor: C.emeraldSoft, color: C.emerald, borderRadius: 1.5, width: 36, height: 36 }}>
                        <InventoryIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: C.slate800 }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ color: C.slate400 }}>{p.productCode}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: C.emerald }}>₹{p.sellingPrice || 0}</Typography>
                      <IconButton size="small" onClick={() => handleDeleteProduct(p.id)}
                        sx={{ color: C.rose, bgcolor: C.roseSoft, borderRadius: 1.5, "&:hover": { bgcolor: "#fecaca" } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          </Stack>
        </AppModal>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModal && (
        <AppModal
          title="Delete Division"
          subtitle="This action cannot be undone"
          icon={<WarningAmberRoundedIcon />}
          onClose={() => setDeleteModal(null)}
          accent={C.rose}
          actions={
            <>
              <Button onClick={() => setDeleteModal(null)} variant="outlined" color="inherit"
                sx={{ borderRadius: 2, textTransform: "none", color: "text.secondary", borderColor: "divider" }}>Cancel</Button>
              <Button onClick={handleDelete} disabled={saving} variant="contained" color="error"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, boxShadow: "none" }}>
                {saving ? "Deleting…" : "Delete Division"}
              </Button>
            </>
          }
        >
          <Box sx={{ p: 2, bgcolor: C.roseSoft, borderRadius: 2, border: `1px solid #fecaca`, mb: 1 }}>
            <Typography variant="body2" sx={{ color: C.slate700 }}>
              You're about to permanently delete <Box component="span" fontWeight={700} sx={{ color: C.slate900 }}>"{deleteModal.name}"</Box>. Any associated data may be affected.
            </Typography>
          </Box>
        </AppModal>
      )}

      {/* ── BULK UPLOAD MODAL ── */}
      <BulkUploadModal
        open={bulkOpen} onClose={() => setBulkOpen(false)}
        title="Bulk Upload Divisions" accent={C.indigo}
        templateHeaders={["name"]}
        templateRows={[["North Region"], ["South Region"], ["East Region"]]}
        parseRow={row => {
          const name = (row["name"] || "").trim();
          if (!name) return { valid: false, error: "Name is required" };
          if (/[^a-zA-Z\s,]/.test(name)) return { valid: false, error: "Only letters and spaces allowed" };
          return { valid: true, data: { name } };
        }}
        onUpload={rows => bulkCreateDivisions(rows.map(r => r.name))}
        onDone={() => { page === 1 ? fetchDivisions() : setPage(1); }}
      />

      {/* ── TOAST ── */}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        {toast && (
          <Alert onClose={() => setToast(null)}
            severity={toast.type === "success" ? "success" : toast.type === "warning" ? "warning" : "error"}
            sx={{ width: "100%", borderRadius: 2.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default Division;