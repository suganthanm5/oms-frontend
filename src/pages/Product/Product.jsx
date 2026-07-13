import { useEffect, useState, useMemo } from "react";
import { useFormHandler } from "../../hooks/useFormHandler";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { getProducts, addProduct, updateProduct, deleteProduct, bulkCreateProducts } from "../../services/productService";
import { getDivisions } from "../../services/divisionService";
import { orderService } from "../../services/orderService";
import API, { ENDPOINTS } from '../../api/apiClient';
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatProductData } from "../../utils/exportUtils";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "./Product.css";

// Material UI imports
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Chip,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Stack,
  Divider,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import BulkUploadModal from "../../components/BulkUploadModal";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReChartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart,
} from "recharts";
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';

/* ── Chart Components ── */
const ChartCard = ({ title, subtitle, action, children }) => (
  <Paper
    elevation={0}
    sx={{
      border: "2px solid #e2e8f0",
      borderRadius: "16px",
      p: { xs: 2, sm: 3 },
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 20px 40px rgba(0,0,0,0.35)' : '0 20px 40px rgba(0,0,0,0.04)',
        borderColor: "primary.light",
        transform: "translateY(-4px)"
      }
    }}
  >
    <Box sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      justifyContent: "space-between",
      alignItems: { xs: "stretch", sm: "center" },
      gap: 2,
      mb: 3
    }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        justifyContent: { xs: "flex-start", sm: "flex-end" }
      }}>
        {action}
      </Box>
    </Box>
    <Box sx={{ flex: 1, minHeight: 240 }}>
      {children}
    </Box>
  </Paper>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", p: 1.5, borderRadius: 2, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", mb: 0.5 }}>{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.name}: <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{p.value}</span></Typography>
        </Box>
      ))}
    </Box>
  );
};



/* ── Styled Components ── */
const GlassCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : theme.palette.background.paper,
  borderRadius: "20px",
  border: `1.5px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'dark' ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
  position: "relative",
  overflow: "hidden",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.palette.mode === 'dark' ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(79,70,229,0.12)",
    borderColor: theme.palette.primary.main,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.mode === 'dark' ? 'var(--color-bg-secondary)' : "#f8fafc",
    "& td": { borderColor: theme.palette.mode === 'dark' ? 'var(--color-border-hr)' : "#c7d2fe" },
  },
  "& td": {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: "16px 12px",
    transition: "border-color 0.2s ease",
  },
}));

const PAGE_SIZES = [5, 10, 25, 50];
const EMPTY_FORM = { name: "", productCode: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "", divisionId: "", image: "" };

/* ── Stat Card ── */
const StatCard = ({ label, value, icon, gradient, iconBg, iconColor, accent }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1, minWidth: 200,
      borderRadius: "18px",
      border: `1.5px solid ${accent}33`,
      background: (theme) => theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : gradient,
      p: "20px 26px",
      display: "flex", alignItems: "center", gap: 2.5,
      cursor: "default",
      transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
      "&:hover": { transform: "translateY(-5px)", boxShadow: `0 14px 40px ${accent}22`, borderColor: accent },
    }}
  >
    <Box sx={{
      width: 46, height: 46, borderRadius: "13px",
      background: iconBg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 14px ${accent}33`,
      "& svg": { fontSize: 22 },
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: "text.primary", lineHeight: 1, letterSpacing: "-0.5px" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12, color: iconColor, fontWeight: 600, mt: "2px" }}>{label}</Typography>
    </Box>
  </Paper>
);

/* ── Modal Header Icon ── */
const ModalIconHeader = ({ icon, title, subtitle, accent, onClose }) => (
  <DialogTitle sx={{ p: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: "20px 24px 16px", borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}20`, color: accent, "& svg": { fontSize: 20 } }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary" }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  </DialogTitle>
);

const Product = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [pageSize, setPageSize] = useState(() => {
    const stored = localStorage.getItem('productPageSize');
    const parsed = parseInt(stored, 10);
    return PAGE_SIZES.includes(parsed) ? parsed : 10;
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [view, setView] = useState("table");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [existingProductNames, setExistingProductNames] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("Weekly");

  const { register, handleSubmit, formState: { errors: formErrors }, reset, setValue, getValues, watch } = useFormHandler(EMPTY_FORM);

  useEffect(() => {
    register("divisionId", { required: "Division is required" });
    register("image");
  }, [register]);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  const fetchAllProductNames = async () => {
    try {
      const res = await getProducts(0, 1000, "");
      const list = res?.content || [];
      setExistingProductNames(list.map(p => p.name?.toLowerCase().trim()).filter(Boolean));
    } catch (e) {
      console.error("Failed to pre-fetch product names:", e);
    }
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    localStorage.setItem('productPageSize', newSize.toString());
    setPage(1);
  };

  useEffect(() => {
    if (isFormView) {
      fetchAllProductNames();
    }
  }, [isFormView]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadata(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [page, pageSize, activeSearch, divisionFilter, priceRangeFilter]);

  const fetchMetadata = async (signal) => {
    try {
      const [divRes, orderData] = await Promise.all([
        getDivisions(0, 200, "", null, null, null, signal),
        orderService.getAll({ size: 1000 }, signal).catch(() => [])
      ]);

      const divList = divRes?.content ?? [];
      setDivisions(divList);

      let orderList = [];
      if (Array.isArray(orderData)) orderList = orderData;
      else if (Array.isArray(orderData?.content)) orderList = orderData.content;
      else if (Array.isArray(orderData?.data)) orderList = orderData.data;
      else if (Array.isArray(orderData?.data?.content)) orderList = orderData.data.content;
      setOrders(orderList);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      console.error("fetchMetadata error:", e);
    }
  };

  const fetchProducts = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const filters = {};
      if (divisionFilter) filters.divisionId = divisionFilter;
      if (priceRangeFilter) {
        if (priceRangeFilter === "0-100") { filters.minSellingPrice = 0; filters.maxSellingPrice = 100; }
        else if (priceRangeFilter === "101-500") { filters.minSellingPrice = 101; filters.maxSellingPrice = 500; }
        else if (priceRangeFilter === "501-1000") { filters.minSellingPrice = 501; filters.maxSellingPrice = 1000; }
        else if (priceRangeFilter === "1000+") { filters.minSellingPrice = 1001; }
      }

      const prodRes = await getProducts(page - 1, pageSize, activeSearch, filters, signal);

      const productList = prodRes?.content ?? [];


      try {
        const batchRes = await API.get('/api/batches', { params: { size: 10000 }, signal });
        const batches = batchRes?.data?.data?.content || batchRes?.data?.data || [];
        const stockMap = {};
        batches.forEach(b => {

          if (b.status === "ACTIVE" || !b.status) {
            const pid = b.productId || b.product?.id;
            if (pid) stockMap[pid] = (stockMap[pid] || 0) + (b.quantity || 0);
          }
        });

        productList.forEach(p => {
          if (p.totalStock === undefined || p.totalStock === null) {
            p.totalStock = stockMap[p.id] || 0;
          }
        });
      } catch (err) {
        console.warn("Failed to fetch batches for stock calculation", err);
      }

      setProducts(productList);
      setTotalPages(prodRes?.totalPages || 1);
      setTotalElements(prodRes?.totalElements || 0);
    } catch (e) {
      console.error("fetchProducts error:", e);
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load products. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = () => {
    const existing = products.map((p) => p.productCode).filter(Boolean);
    let counter = 1, code;
    do { code = `MKL${String(counter++).padStart(3, "0")}`; } while (existing.includes(code));
    return code;
  };

  const divMap = useMemo(() => Object.fromEntries(divisions.map((d) => [d.id, d.name])), [divisions]);
  const divNameOf = (p) => p.divisionName ?? p.division?.name ?? divMap[p.divisionId] ?? "—";
  const fmt = (v) => (v == null || v === "" ? "—" : Number(v).toLocaleString());

  const buildPayload = (data) => ({
    name: data.name.trim(),
    productCode: (data.productCode || "").trim(),
    uimPrice: Number(data.uimPrice) || 0,
    mrp: Number(data.mrp) || 0,
    sellingPrice: Number(data.sellingPrice) || 0,
    purchasePrice: Number(data.purchasePrice) || 0,
    image: data.image || "",
    ...(data.divisionId ? { divisionId: Number(data.divisionId), division: { id: Number(data.divisionId) } } : {}),
  });

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await addProduct({ ...buildPayload(data), productCode: generateProductCode() });
      await fetchProducts();
      setIsFormView(false);
      reset(EMPTY_FORM);
      showToast("Product added successfully!", "success");
    } catch (e) {
      let errMsg = e.response?.data?.message || e.message;
      if (e.response?.data?.data && typeof e.response.data.data === 'object') {
        const validationErrors = Object.values(e.response.data.data).join(", ");
        if (validationErrors) errMsg = `${errMsg}: ${validationErrors}`;
      }
      showToast("Failed to add product: " + errMsg, "error");
    } finally { setSaving(false); }
  };

  const openEdit = (p) => {
    reset({
      name: p.name ?? "",
      productCode: p.productCode ?? "",
      uimPrice: p.uimPrice ?? "",
      mrp: p.mrp ?? "",
      sellingPrice: p.sellingPrice ?? "",
      purchasePrice: p.purchasePrice ?? "",
      divisionId: String(p.divisionId ?? p.division?.id ?? ""),
      image: p.image ?? "",
    });
    setEditModal(p);
    setIsFormView(true);
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await updateProduct(editModal.id, buildPayload(data));
      await fetchProducts();
      setEditModal(null);
      setIsFormView(false);
      reset(EMPTY_FORM);
      showToast("Product updated successfully!", "success");
    } catch (e) {
      let errMsg = e.response?.data?.message || e.message;
      if (e.response?.data?.data && typeof e.response.data.data === 'object') {
        const validationErrors = Object.values(e.response.data.data).join(", ");
        if (validationErrors) errMsg = `${errMsg}: ${validationErrors}`;
      }
      showToast("Failed to update product: " + errMsg, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProduct(deleteModal.id);
      await fetchProducts();
      setDeleteModal(null);
      showToast("Product deleted successfully!", "success");
    } catch (e) {
      showToast("Failed to delete product: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const filtered = products; // Backend handles filtering

  const paginated = products; // Backend handles pagination
  const start = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalElements);

  const performanceData = useMemo(() => {
    const counts = {};
    filtered.forEach((p) => {
      const name = divNameOf(p);
      if (name && name !== "—") {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [filtered, divisions, divMap]);

  const parseDateStr = (dateVal) => {
    if (!dateVal) return new Date();
    if (Array.isArray(dateVal)) {
      const [y, m, d] = dateVal;
      return new Date(y, m - 1, d);
    }
    return new Date(dateVal);
  };

  const revenueTrend = useMemo(() => {
    const matchesFilter = (item) => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) return false;
      if (divisionFilter && (p.division?.id ?? p.divisionId) != divisionFilter) return false;
      if (priceRangeFilter) {
        const mrp = Number(p.mrp) || 0;
        if (priceRangeFilter === "0-100" && mrp > 100) return false;
        if (priceRangeFilter === "101-500" && (mrp < 101 || mrp > 500)) return false;
        if (priceRangeFilter === "501-1000" && (mrp < 501 || mrp > 1000)) return false;
        if (priceRangeFilter === "1000+" && mrp <= 1000) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const divName = divNameOf(p);
        const nameMatch = p.name?.toLowerCase().includes(q);
        const codeMatch = p.productCode?.toLowerCase().includes(q);
        const divMatch = divName?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !divMatch) return false;
      }
      return true;
    };

    if (trendPeriod === "Monthly") {
      const weeklyMap = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
      orders.forEach(order => {
        const oDate = parseDateStr(order.createdAt);
        const diffDays = Math.floor((new Date() - oDate) / (1000 * 60 * 60 * 24));
        let weekKey = "Week 4";
        if (diffDays <= 7) weekKey = "Week 4";
        else if (diffDays <= 14) weekKey = "Week 3";
        else if (diffDays <= 21) weekKey = "Week 2";
        else weekKey = "Week 1";

        const matchingRevenue = (order.items || []).reduce((sum, item) => {
          if (matchesFilter(item)) {
            return sum + (item.quantity * Number(item.price || 0));
          }
          return sum;
        }, 0);
        weeklyMap[weekKey] += matchingRevenue;
      });
      return Object.entries(weeklyMap).map(([name, revenue]) => ({
        name,
        revenue
      }));
    }

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[dateStr] = 0;
    }

    orders.forEach(order => {
      const oDate = parseDateStr(order.createdAt);
      const dateStr = oDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const matchingRevenue = (order.items || []).reduce((sum, item) => {
        if (matchesFilter(item)) {
          return sum + (item.quantity * Number(item.price || 0));
        }
        return sum;
      }, 0);
      if (dateStr in dailyMap) {
        dailyMap[dateStr] += matchingRevenue;
      }
    });

    return Object.entries(dailyMap).map(([name, revenue]) => ({
      name,
      revenue
    }));
  }, [orders, products, divisionFilter, priceRangeFilter, search, trendPeriod]);



  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Hero ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
          <TypingText text="Product Management" />
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="primary" startIcon={<UploadFileIcon />}
            onClick={() => setBulkOpen(true)}>
            Bulk Upload
          </Button>
          <ExportMenu
            getData={async () => {
              const filters = {};
              if (divisionFilter) filters.divisionId = divisionFilter;
              if (priceRangeFilter) {
                if (priceRangeFilter === "0-100") { filters.minSellingPrice = 0; filters.maxSellingPrice = 100; }
                else if (priceRangeFilter === "101-500") { filters.minSellingPrice = 101; filters.maxSellingPrice = 500; }
                else if (priceRangeFilter === "501-1000") { filters.minSellingPrice = 501; filters.maxSellingPrice = 1000; }
                else if (priceRangeFilter === "1000+") { filters.minSellingPrice = 1001; }
              }
              const res = await getProducts(0, 10000, activeSearch, filters);
              return formatProductData(res?.content ?? []);
            }}
            filename="products"
            title="Products Report"
          />
          <Button variant="contained" color="primary" startIcon={<AddIcon />}
            onClick={() => { reset(EMPTY_FORM); setEditModal(null); setIsFormView(true); }}>
            Add Product
          </Button>
        </Box>
      </Box>

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <FormContainer>
            <FormHeader
              title={editModal ? "Edit Product" : "Add New Product"}
              subtitle={editModal ? `Updating details for ${editModal.name}` : "Fill in the details to create a new product"}
              onClose={() => { setIsFormView(false); setEditModal(null); reset(EMPTY_FORM); }}
              onSave={handleSubmit(editModal ? handleUpdate : handleAdd)}
              saving={saving}
              saveDisabled={false}
              saveLabel={editModal ? "Save Changes" : "Create Product"}
              saveIcon={editModal ? <EditIcon /> : <AddIcon />}
              colorAccent={editModal ? "primary" : "success"}
            />

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                {/* Left Column: Image & Basic Info */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    <Box>
                      <FormSectionHeader title="Product Image" color="#f59e0b" />
                      <Box sx={{
                        width: "100%",
                        aspectRatio: "1/1",
                        borderRadius: 4,
                        bgcolor: "background.default",
                        border: "2px dashed #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                        transition: "all 0.3s",
                        "&:hover": { borderColor: "#f59e0b", bgcolor: "#fffbeb" }
                      }}>
                        {watch("image") ? (
                          <>
                            <img src={watch("image")} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 1 }}>
                              <IconButton size="small" component="label" sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "background.paper" } }}>
                                <EditIcon fontSize="small" />
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 1024 * 1024) { showToast("Max size 1MB", "error"); return; }
                                    const reader = new FileReader();
                                    reader.onloadend = () => setValue("image", reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => setValue("image", "")} sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#ef4444", "&:hover": { bgcolor: "#fee2e2" } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ textAlign: "center", p: 3 }}>
                            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                              <PhotoCameraIcon sx={{ fontSize: 32, color: "text.secondary" }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>Click to upload product image</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>PNG, JPG or GIF up to 1MB</Typography>
                            <Button variant="contained" color="primary" component="label" size="small" sx={{ mt: 2, borderRadius: 2 }}>
                              Browse Files
                              <input type="file" hidden accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) { showToast("Max size 1MB", "error"); return; }
                                  const reader = new FileReader();
                                  reader.onloadend = () => setValue("image", reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column: Form Fields */}
                <Grid item xs={12} md={7}>
                  <Stack spacing={4}>
                    <Box>
                      <FormSectionHeader title="Basic Information" color="#f59e0b" />
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={editModal ? 6 : 12}>
                          <TextField
                            fullWidth
                            label="Product Name"
                            {...register("name", {
                              required: "Product Name is required",
                              validate: (val) => {
                                if (!val.trim()) return "Product Name is required";
                                const trimLower = val.trim().toLowerCase();
                                if (existingProductNames.includes(trimLower)) {
                                  if (editModal && editModal.name?.toLowerCase().trim() === trimLower) {
                                    return true;
                                  }
                                  return `Product already exists: ${val.trim()}`;
                                }
                                return true;
                              }
                            })}
                            required
                            placeholder="e.g. Milk 1L"
                            error={!!formErrors.name}
                            helperText={formErrors.name?.message}
                          />
                        </Grid>
                        {editModal && (
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Product Code" value={watch("productCode")} disabled sx={{ bgcolor: "background.default" }} />
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 1, display: "block" }}>Division *</Typography>
                          <SearchableSelect
                            options={divisions}
                            value={watch("divisionId")}
                            onChange={(id) => setValue("divisionId", id, { shouldValidate: true })}
                            placeholder="Select Division"
                          />
                          {formErrors.divisionId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                              {formErrors.divisionId.message}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <FormSectionHeader title="Pricing & Inventory" color="#10b981" />
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="MRP"
                            {...register("mrp", {
                              required: "MRP is required",
                              min: { value: 0.01, message: "MRP must be greater than 0" }
                            })}
                            required
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            error={!!formErrors.mrp}
                            helperText={formErrors.mrp?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Selling Price"
                            {...register("sellingPrice", {
                              required: "Selling Price is required",
                              min: { value: 0.01, message: "Selling Price must be greater than 0" },
                              validate: (value) => Number(value) <= Number(getValues("mrp")) || "Selling price should be smaller than MRP"
                            })}
                            required
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            error={!!formErrors.sellingPrice}
                            helperText={formErrors.sellingPrice?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Purchase Price"
                            {...register("purchasePrice", {
                              required: "Purchase Price is required",
                              min: { value: 0.01, message: "Purchase Price must be greater than 0" },
                              validate: (value) => Number(value) <= Number(getValues("mrp")) || "Purchase price should be smaller than MRP"
                            })}
                            required
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            error={!!formErrors.purchasePrice}
                            helperText={formErrors.purchasePrice?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="UIM Price"
                            {...register("uimPrice", {
                              required: "UIM Price is required",
                              min: { value: 0.01, message: "UIM Price must be greater than 0" }
                            })}
                            required
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            error={!!formErrors.uimPrice}
                            helperText={formErrors.uimPrice?.message}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </FormContainer>
        </Box>
      ) : (
        /* ── List View ── */
        <>
          {/* ── 1. Insights Row (Graphs) ── */}
          <Box className="cards-container" sx={{ 
            display: "grid", 
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, 
            gap: "20px", 
            width: "100%", 
            mb: 4 
          }}>
            <ChartCard 
              className="card" 
              title="Products by Division" 
              subtitle="Division-wise distribution"
              action={
                <Select
                  size="small"
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(e.target.value)}
                  sx={{ height: 28, fontSize: "0.7rem", bgcolor: "background.paper" }}
                >
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    height={40}
                    angle={-12}
                    textAnchor="end"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReChartsTooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="count" name="Product Count" fill="#3a7f85" radius={[6, 6, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard
              className="card"
              title="Order Summary"
              subtitle="Revenue by day"
              action={
                <Select
                  size="small"
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(e.target.value)}
                  sx={{ height: 28, fontSize: "0.7rem", bgcolor: "background.paper" }}
                >
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="muiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3a7f85" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3a7f85" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v) => v === 0 ? "0" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <ReChartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="natural"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3a7f85"
                    fill="url(#muiAreaGradient)"
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>

          {/* ── 2. Stats Row (Top Cards) ── */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
            <StatCard label="Total Products" value={loading ? "—" : products.length}
              icon={<Inventory2Icon />}
              gradient="linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
              iconBg="linear-gradient(135deg, #4f46e5, #7c3aed)" iconColor="#4f46e5" accent="#4f46e5" />
            <StatCard label="Filtered Results" value={loading ? "—" : filtered.length}
              icon={<SearchIcon />}
              gradient="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
              iconBg="linear-gradient(135deg, #10b981, #059669)" iconColor="#10b981" accent="#10b981" />
            <StatCard label="Total Pages" value={loading ? "—" : totalPages}
              icon={<GridViewIcon />}
              gradient="linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
              iconBg="linear-gradient(135deg, #0ea5e9, #0284c7)" iconColor="#0ea5e9" accent="#0ea5e9" />
          </Stack>

          {/* ── 3. Table View ── */}
          {error && (
            <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2, mb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              {/* Search */}
              <TextField
                size="small" placeholder="Search products…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveSearch(search.trim());
                    setPage(1);
                  }
                }}
                sx={{ minWidth: 240, flex: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} /></InputAdornment>,
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearch(""); setActiveSearch(""); setPage(1); }}><CloseIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Filters */}
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>All Divisions</InputLabel>
                  <Select label="All Divisions" value={divisionFilter}
                    onChange={(e) => { setDivisionFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">All Divisions</MenuItem>
                    {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>All Prices</InputLabel>
                  <Select label="All Prices" value={priceRangeFilter}
                    onChange={(e) => { setPriceRangeFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">All Prices</MenuItem>
                    <MenuItem value="0-100">₹0 – ₹100</MenuItem>
                    <MenuItem value="101-500">₹101 – ₹500</MenuItem>
                    <MenuItem value="501-1000">₹501 – ₹1,000</MenuItem>
                    <MenuItem value="1000+">₹1,000+</MenuItem>
                  </Select>
                </FormControl>

                {(divisionFilter || priceRangeFilter || search) && (
                  <Button size="small" variant="outlined" color="inherit"
                    sx={{ color: "text.secondary", borderColor: "#e2e8f0", height: 40 }}
                    onClick={() => { setDivisionFilter(""); setPriceRangeFilter(""); setSearch(""); setPage(1); }}>
                    Clear
                  </Button>
                )}
              </Stack>

              {/* Show entries + View toggle */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: { md: "auto" } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>Show</Typography>
                  <FormControl size="small" sx={{ minWidth: 72 }}>
                    <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                      {PAGE_SIZES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>entries</Typography>
                </Stack>

                <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}
                  sx={{ "& .MuiToggleButton-root": { px: 1.5, border: "1px solid #e2e8f0" } }}>
                  <ToggleButton value="table"><Tooltip title="Table"><TableChartIcon fontSize="small" /></Tooltip></ToggleButton>
                  <ToggleButton value="card"><Tooltip title="Cards"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Paper>

          {/* ── Table / Card View ── */}
          {view === "table" && (
            <GlassCard elevation={0} sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    {["#", "Image", "Name", "Division", "Code", "UIM Price", "MRP", "Selling Price", "Purchase Price", "Stock", "Actions"].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <StyledTableRow key={i}>
                        {Array(10).fill(0).map((_, j) => (
                          <TableCell key={j}><Skeleton variant="text" width={j === 2 ? 140 : 70} /></TableCell>
                        ))}
                      </StyledTableRow>
                    ))
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 60, height: 60, borderRadius: "18px", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Inventory2Icon sx={{ fontSize: 30, color: "#cbd5e1" }} />
                          </Box>
                          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>{activeSearch ? "No products match your search" : "No products yet"}</Typography>
                          {!activeSearch && (
                            <Button variant="contained" color="primary" size="small" startIcon={<AddIcon />}
                              sx={{ borderRadius: "10px", boxShadow: "none" }}
                              onClick={() => { reset(EMPTY_FORM); setEditModal(null); setIsFormView(true); }}>
                              Add First Product
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((p, i) => (
                      <StyledTableRow key={p.id}>
                        <TableCell sx={{ color: "text.secondary", fontWeight: 700, fontSize: "12px" }}>{(page - 1) * pageSize + i + 1}</TableCell>
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={p.image}
                            sx={{ width: 40, height: 40, bgcolor: "background.default", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "text.secondary" }}>{p.name?.charAt(0).toUpperCase()}</Typography>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "13.5px" }}>{p.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={divNameOf(p)} size="small"
                            sx={{ bgcolor: "#e0f2fe", color: "#075985", fontWeight: 700, fontSize: "11px", borderRadius: "6px" }} />
                        </TableCell>
                        <TableCell>
                          {p.productCode
                            ? <Box sx={{ display: "inline-block", bgcolor: "background.default", border: "1px solid #e2e8f0", borderRadius: "7px", px: "8px", py: "2px", fontFamily: "monospace", fontSize: "11.5px", color: "text.secondary", fontWeight: 700 }}>{p.productCode}</Box>
                            : "—"}
                        </TableCell>
                        {[p.uimPrice, p.mrp].map((v, idx) => (
                          <TableCell key={idx} sx={{ fontWeight: 600, color: "text.secondary", fontSize: "13px" }}>{fmt(v)}</TableCell>
                        ))}
                        <TableCell sx={{ fontWeight: 700, color: "#10b981", fontSize: "13.5px" }}>{fmt(p.sellingPrice)}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "13px" }}>{fmt(p.purchasePrice)}</TableCell>
                        <TableCell>
                          <Box sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5,
                            bgcolor: (p.totalStock || 0) > 0 ? "#ecfdf5" : "#fef2f2",
                            color: (p.totalStock || 0) > 0 ? "#10b981" : "#ef4444",
                            px: 1.5, py: 0.5, borderRadius: "6px", fontWeight: 700, fontSize: "12px"
                          }}>
                            {(p.totalStock || 0) > 0 ? <Inventory2Icon sx={{ fontSize: 14 }} /> : <WarningAmberIcon sx={{ fontSize: 14 }} />}
                            {p.totalStock || 0}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => setViewModal(p)}
                                sx={{ color: "#0ea5e9", bgcolor: "#e0f2fe", borderRadius: 1.5, "&:hover": { bgcolor: "#bae6fd" } }}>
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(p)}
                                sx={{ color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 1.5, "&:hover": { bgcolor: "#e0e7ff" } }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => setDeleteModal(p)}
                                sx={{ color: "#ef4444", bgcolor: "#fef2f2", borderRadius: 1.5, "&:hover": { bgcolor: "#fee2e2" } }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </GlassCard>
          )}

          {/* ── Card View ── */}
          {view === "card" && (
            <Grid container spacing={2}>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={i}>
                    <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5 }}>
                      <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1 }} />
                      <Skeleton width="60%" height={24} sx={{ mb: 0.5 }} />
                      <Skeleton width="40%" height={18} />
                    </Paper>
                  </Grid>
                ))
              ) : paginated.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <Inventory2Icon sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
                    <Typography color="text.secondary">{activeSearch ? "No products match your search" : "No products yet"}</Typography>
                  </Box>
                </Grid>
              ) : (
                paginated.map((p, i) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={p.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 4,
                        border: "1px solid #f1f5f9",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-6px)",
                          boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
                          borderColor: "#e2e8f0"
                        }
                      }}
                    >
                      <Box sx={{ position: "relative", mb: 2 }}>
                        <Avatar
                          variant="rounded"
                          src={p.image}
                          sx={{ width: "100%", height: 180, bgcolor: "background.default", borderRadius: 3, fontSize: "3rem", border: "1px solid #f1f5f9" }}
                        >
                          {p.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(255,255,255,0.9)", px: 1, py: 0.5, borderRadius: 1.5, color: "text.secondary", fontWeight: 600, backdropFilter: "blur(4px)" }}>#{(page - 1) * pageSize + i + 1}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary", mb: 0.75 }}>{p.name}</Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
                        <Chip label={divNameOf(p)} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: "0.7rem" }} />
                        {p.productCode && <Chip label={p.productCode} size="small" sx={{ bgcolor: "background.default", color: "text.secondary", fontFamily: "monospace", fontSize: "0.7rem" }} />}
                      </Stack>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack spacing={0.5} sx={{ mb: 2 }}>
                        {[["MRP", fmt(p.mrp), "#475569"], ["Selling", fmt(p.sellingPrice), "#10b981"], ["Purchase", fmt(p.purchasePrice), "#475569"]].map(([label, val, color]) => (
                          <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>{label}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color }}>₹{val}</Typography>
                          </Box>
                        ))}
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                        <IconButton size="small" onClick={() => setViewModal(p)}
                          sx={{ flex: 1, color: "#0ea5e9", bgcolor: "#e0f2fe", borderRadius: 2, "&:hover": { bgcolor: "#bae6fd" } }}><VisibilityIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => openEdit(p)}
                          sx={{ flex: 1, color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 2, "&:hover": { bgcolor: "#e0e7ff" } }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteModal(p)}
                          sx={{ flex: 1, color: "#ef4444", bgcolor: "#fef2f2", borderRadius: 2, "&:hover": { bgcolor: "#fee2e2" } }}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          )}

          {/* ── Pagination ── */}
          {!loading && totalElements > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
              </Typography>
              <Pagination
                count={totalPages} page={page} onChange={(_, v) => setPage(v)}
                shape="rounded" size="small"
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* ── Add Modal (REPLACED BY FULL PAGE BUT KEEPING LOGIC IF NEEDED, REMOVING NOW) ── */}
      {/* Removing lines 695-708 */}

      {/* ── Edit Modal (REPLACED BY FULL PAGE) ── */}
      {/* Removing lines 711-724 */}

      {/* ── Delete Modal ── */}
      <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth>
        <ModalIconHeader icon={<WarningAmberIcon />} title="Delete Product" subtitle="This action cannot be undone" accent="#ef4444"
          onClose={() => setDeleteModal(null)} />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to delete <strong>"{deleteModal?.name}"</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5, display: "block" }}>
            This product will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} disabled={saving}
            onClick={handleDelete}>
            {saving ? "Deleting…" : "Delete Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Modal ── */}
      <Dialog open={!!viewModal} onClose={() => setViewModal(null)} maxWidth="xs" fullWidth>
        <ModalIconHeader icon={<VisibilityIcon />} title="Product Details" subtitle={viewModal ? `Viewing: ${viewModal.name}` : ""} accent="#0ea5e9"
          onClose={() => setViewModal(null)} />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Avatar
              variant="rounded"
              src={viewModal?.image}
              sx={{ width: 120, height: 120, bgcolor: "background.default", border: "1px solid #f1f5f9", fontSize: "3rem" }}
            >
              {viewModal?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
          <Stack spacing={1.5}>
            {viewModal && [
              ["Product Name", viewModal.name],
              ["Product Code", viewModal.productCode || "—"],
              ["Division", divNameOf(viewModal)],
              ["UIM Price", `₹${fmt(viewModal.uimPrice)}`],
              ["MRP", `₹${fmt(viewModal.mrp)}`],
              ["Selling Price", `₹${fmt(viewModal.sellingPrice)}`],
              ["Purchase Price", `₹${fmt(viewModal.purchasePrice)}`],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>{val}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" sx={{ color: "text.secondary", borderColor: "#e2e8f0" }}
            onClick={() => setViewModal(null)}>Close</Button>
          <Button variant="contained" color="info" startIcon={<EditIcon />}
            onClick={() => { setViewModal(null); openEdit(viewModal); }}>
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast?.type === "success" ? "success" : toast?.type === "warning" ? "warning" : "error"}
          onClose={() => setToast(null)} sx={{ borderRadius: 2, fontWeight: 500 }}>
          {toast?.message}
        </Alert>
      </Snackbar>

      {/* ── Bulk Upload Modal ── */}
      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Products"
        accent="#f59e0b"
        templateHeaders={["name", "divisionName", "uimPrice", "mrp", "sellingPrice", "purchasePrice", "image"]}
        templateRows={[
          ["Milk 1L", "Groceries", "40", "50", "48", "38", ""],
          ["Cheese 500g", "Groceries", "80", "100", "95", "75", ""],
        ]}
        parseRow={(row) => {
          const name = (row["name"] || "").trim();
          const divisionName = (row["divisionname"] || row["divisionName"] || "").trim();
          const mrp = Number(row["mrp"] || 0);
          const sellingPrice = Number(row["sellingprice"] || row["sellingPrice"] || 0);
          const purchasePrice = Number(row["purchaseprice"] || row["purchasePrice"] || 0);
          const uimPrice = Number(row["uimprice"] || row["uimPrice"] || 0);
          const image = (row["image"] || "").trim();

          if (!name) return { valid: false, error: "Name is required" };
          if (!divisionName) return { valid: false, error: "divisionName is required" };
          if (mrp <= 0) return { valid: false, error: "MRP must be > 0" };
          if (sellingPrice > mrp) return { valid: false, error: "Selling price must be ≤ MRP" };
          if (purchasePrice > mrp) return { valid: false, error: "Purchase price must be ≤ MRP" };

          const div = divisions.find(d => d.name.toLowerCase() === divisionName.toLowerCase());
          if (!div) return { valid: false, error: `Division not found: ${divisionName}` };

          return {
            valid: true,
            data: {
              name, uimPrice, mrp, sellingPrice, purchasePrice, image,
              divisionId: div.id,
              division: { id: div.id },
            },
          };
        }}
        onUpload={(rows) => bulkCreateProducts(rows)}
        onDone={() => fetchProducts()}
      />

    </Box>
  );
};

export default Product;
