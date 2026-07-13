import { useEffect, useState, useMemo } from "react";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import {
  getOutlets, createOutlet, updateOutlet, deleteOutlet, bulkCreateOutlets,
} from "../../services/outletService";
import { getLocations } from "../../services/locationService";
import { getDivisions, getDivisionById } from "../../services/divisionService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatOutletData } from "../../utils/exportUtils";
import BulkUploadModal from "../../components/BulkUploadModal";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";

import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, InputAdornment, MenuItem, Paper, Select, Skeleton,
  Snackbar, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Grid, Chip, Avatar,
  Tooltip, FormControl, InputLabel, ToggleButton, ToggleButtonGroup,
  Pagination, Stack, Divider, Collapse, Badge, LinearProgress,
  alpha,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import MapIcon from "@mui/icons-material/Map";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterListIcon from "@mui/icons-material/FilterList";
import TuneIcon from "@mui/icons-material/Tune";
import DomainIcon from "@mui/icons-material/Domain";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LanguageIcon from "@mui/icons-material/Language";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import BusinessIcon from "@mui/icons-material/Business";


/* ─── Styled components ─── */
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "background 0.15s",
  "&:hover": { background: theme.palette.mode === 'dark' ? 'var(--color-bg-secondary)' : "#fafbff" },
  "&:last-child td": { borderBottom: "none" },
}));

const ExpandedRow = styled(TableRow)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : "linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%)",
  "& td": { borderBottom: `1px solid ${theme.palette.divider} !important` },
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
  border: `1.5px solid ${theme.palette.divider}`,
  borderRadius: 18,
  transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.palette.mode === 'dark' ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(79,70,229,0.12)",
    borderColor: theme.palette.primary.main,
  },
}));

/* ─── Constants ─── */
const OUTLET_TYPES = [
  "Retail", "Wholesale", "Franchise", "Online",
  "Distribution", "Warehouse", "Corporate", "Branch Office",
];

const TYPE_META = {
  Retail:        { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed", icon: StorefrontIcon, iconBg: "linear-gradient(135deg, #7c3aed, #4f46e5)", shadow: "rgba(124,58,237,0.3)" },
  Wholesale:     { bg: "#d1fae5", color: "#065f46", dot: "#10b981", icon: Inventory2Icon, iconBg: "linear-gradient(135deg, #10b981, #0ea5e9)", shadow: "rgba(16,185,129,0.3)" },
  Franchise:     { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", icon: HomeWorkIcon, iconBg: "linear-gradient(135deg, #f59e0b, #ea580c)", shadow: "rgba(245,158,11,0.3)" },
  Online:        { bg: "#e0f2fe", color: "#075985", dot: "#0ea5e9", icon: LanguageIcon, iconBg: "linear-gradient(135deg, #0ea5e9, #2563eb)", shadow: "rgba(14,165,233,0.3)" },
  Distribution:  { bg: "#fae8ff", color: "#6b21a8", dot: "#a855f7", icon: LocalShippingIcon, iconBg: "linear-gradient(135deg, #a855f7, #d946ef)", shadow: "rgba(168,85,247,0.3)" },
  Warehouse:     { bg: "#ffedd5", color: "#9a3412", dot: "#f97316", icon: WarehouseIcon, iconBg: "linear-gradient(135deg, #f97316, #ef4444)", shadow: "rgba(249,115,22,0.3)" },
  Corporate:     { bg: "#dcfce7", color: "#166534", dot: "#22c55e", icon: DomainIcon, iconBg: "linear-gradient(135deg, #22c55e, #16a34a)", shadow: "rgba(34,197,94,0.3)" },
  "Branch Office":{ bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", icon: BusinessIcon, iconBg: "linear-gradient(135deg, #ef4444, #b91c1c)", shadow: "rgba(239,68,68,0.3)" },
};

const EMPTY_FORM = {
  outletName: "", address: "", locationId: "", locationName: "",
  mappings: {}, outletType: "", ownerName: "",
};

const PAGE_SIZES = [5, 10, 25, 50];

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon, gradient, iconBg, iconColor, accent }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1, minWidth: 155,
      borderRadius: "18px",
      border: `1.5px solid ${accent}33`,
      background: (theme) => theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : gradient,
      p: "18px 20px",
      display: "flex", alignItems: "center", gap: 2,
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

/* ─── Type Badge ─── */
const TypeBadge = ({ type }) => {
  const m = TYPE_META[type] ?? { bg: "#f1f5f9", color: "text.secondary", dot: "#94a3b8" };
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px",
      bgcolor: m.bg, color: m.color,
      px: "10px", py: "3px", borderRadius: "20px",
      fontSize: "11.5px", fontWeight: 700, whiteSpace: "nowrap" }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: m.dot, flexShrink: 0 }} />
      {type}
    </Box>
  );
};

/* ─── Delete Modal Header ─── */
const ModalIconHeader = ({ icon, title, subtitle, accent, onClose }) => (
  <DialogTitle sx={{ p: 0 }}>
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: "20px 24px 16px",
      borderBottom: "1px solid",
      borderColor: "divider",
    }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${accent}18`, color: accent, "& svg": { fontSize: 20 },
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "text.primary" }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary", bgcolor: "background.default", borderRadius: "9px" }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  </DialogTitle>
);

/* ─── Expandable Row Details (Redesigned) ─── */
const OutletDetailRow = ({ outlet, colSpan }) => (
  <ExpandedRow>
    <TableCell colSpan={colSpan} sx={{ py: 0, px: 0, borderBottom: "none !important" }}>
      <Collapse in timeout="auto" unmountOnExit>
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", borderBottom: "1px solid", borderBottomColor: "divider" }}>
          <Paper elevation={0} sx={{ 
            display: "flex", flexDirection: { xs: "column", md: "row" }, 
            border: "1px solid", borderColor: "divider", borderRadius: "16px", overflow: "hidden",
            boxShadow: "0 4px 20px rgba(15,23,42,0.03)", bgcolor: "background.paper" 
          }}>
            
            {/* Column 1: Division Breakdown */}
            <Box sx={{ flex: 1, p: 3, borderRight: { md: "1px solid" }, borderRightColor: { md: "divider" }, borderBottom: { xs: "1px solid", md: "none" }, borderBottomColor: { xs: "divider", md: "none" } }}>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "rgba(22, 163, 74, 0.12)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DomainIcon sx={{ fontSize: 16 }} />
                </Box>
                Division Breakdown
              </Typography>
              <Stack spacing={1.5}>
                {(outlet.divisions ?? []).map((d) => (
                  <Box key={d.id} sx={{ p: 1.5, bgcolor: "background.default", borderRadius: "10px", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", mb: 0.75 }}>{d.name}</Typography>
                    {d.products?.length > 0 ? (
                      <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {d.products.map((p) => (
                          <Chip key={p.id} label={p.name} size="small" 
                            icon={<Inventory2Icon sx={{ fontSize: "12px !important", color: "text.secondary" }} />} 
                            sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", color: "text.secondary", fontWeight: 600, fontSize: "11px", height: 22 }} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>No products</Typography>
                    )}
                  </Box>
                ))}
                {(!outlet.divisions || outlet.divisions.length === 0) && (
                  <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", textAlign: "center", py: 2 }}>No divisions linked to this outlet.</Typography>
                )}
              </Stack>
            </Box>

            {/* Column 2: Contact & Address */}
            <Box sx={{ flex: 1, p: 3, borderRight: { md: "1px solid" }, borderRightColor: { md: "divider" }, borderBottom: { xs: "1px solid", md: "none" }, borderBottomColor: { xs: "divider", md: "none" }, bgcolor: "background.paper" }}>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "rgba(124, 58, 237, 0.12)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Box>
                Contact Details
              </Typography>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Outlet Owner</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary", mt: 0.25 }}>{outlet.ownerName || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Address</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.5, display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: "#ef4444", mt: "2px", flexShrink: 0 }} />
                    {outlet.address || "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Column 3: Quick Stats */}
            <Box sx={{ flex: 1, p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <StorefrontIcon sx={{ fontSize: 16 }} />
                </Box>
                Outlet Profile
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, bgcolor: "background.default", borderRadius: "10px" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>System Code</Typography>
                  <Typography sx={{ fontWeight: 700, color: "text.primary", fontFamily: "monospace", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", px: 1, py: 0.25, borderRadius: "6px" }}>
                    {outlet.outletCode || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, bgcolor: "background.default", borderRadius: "10px" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>Total Divisions</Typography>
                  <Typography sx={{ fontWeight: 800, color: "#16a34a", fontSize: "1rem" }}>{outlet.divisions?.length ?? 0}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, bgcolor: "background.default", borderRadius: "10px" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>Total Products</Typography>
                  <Typography sx={{ fontWeight: 800, color: "#7c3aed", fontSize: "1rem" }}>{outlet.productNames?.length ?? 0}</Typography>
                </Box>
              </Stack>
            </Box>
            
          </Paper>
        </Box>
      </Collapse>
    </TableCell>
  </ExpandedRow>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Outlet() {
  const [outlets, setOutlets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem("outletPageSize") || "10", 10));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [view, setView] = useState("table");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [isFormView, setIsFormView] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const showToast = (message, type = "error") => setToast({ message, type });

  /* ── Validation ── */
  const handleOutletNameChange = (e) => {
    const v = e.target.value;
    if (v.startsWith(" ")) { showToast("Outlet name cannot start with a space.", "warning"); return; }
    if (/\d/.test(v)) { showToast("Outlet name cannot contain numbers.", "warning"); return; }
    if (/[\u0900-\u097F]/.test(v)) { showToast("Please enter outlet name in English only.", "warning"); return; }
    setForm((f) => ({ ...f, outletName: v }));
  };

  const handleOwnerNameChange = (e) => {
    const v = e.target.value;
    if (v.startsWith(" ")) { showToast("Owner name cannot start with a space.", "warning"); return; }
    if (/\d/.test(v)) { showToast("Owner name cannot contain numbers.", "warning"); return; }
    if (/[\u0900-\u097F]/.test(v)) { showToast("Please enter owner name in English only.", "warning"); return; }
    setForm((f) => ({ ...f, ownerName: v }));
  };

  const handleAddressChange = (e) => {
    const v = e.target.value;
    if (v.startsWith(" ")) { showToast("Address cannot start with a space.", "warning"); return; }
    setForm((f) => ({ ...f, address: v }));
  };

  const validateForm = () => {
    if (!form.outletName.trim()) { showToast("Outlet name is required.", "error"); return false; }
    if (!form.locationId) { showToast("Location is required.", "error"); return false; }
    if (!form.outletType) { showToast("Outlet type is required.", "error"); return false; }
    if (!form.ownerName.trim()) { showToast("Owner name is required.", "error"); return false; }
    if (!form.address.trim()) { showToast("Address is required.", "error"); return false; }
    if (!Object.values(form.mappings).some((p) => p.length > 0)) {
      showToast("At least one division and product must be selected.", "error"); return false;
    }
    return true;
  };

  useEffect(() => {
    const c = new AbortController();
    fetchMetadata(c.signal);
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    const t = setTimeout(() => fetchOutletsData(false, c.signal), 600);
    return () => { clearTimeout(t); c.abort(); };
  }, [page, pageSize, search, locationFilter, typeFilter, divisionFilter, productFilter]);

  const extractList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.content)) return val.content;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.data?.content)) return val.data.content;
    return [];
  };

  const fetchMetadata = async (signal) => {
    const [lRes, dRes] = await Promise.allSettled([
      getLocations(0, 1000, "", signal),
      getDivisions(0, 1000, "", null, null, null, signal),
    ]);
    if (lRes.status === "fulfilled") setLocations(extractList(lRes.value).map((l) => ({ ...l, name: l.name || l.locationName })));
    if (dRes.status === "fulfilled") setDivisions(extractList(dRes.value).map((d) => ({ ...d, name: d.name || d.divisionName })));
  };

  const fetchOutletsData = async (silent = false, signal) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const filters = {
        locationId: locationFilter || undefined,
        outletType: typeFilter || undefined,
        divisionId: divisionFilter || undefined,
      };
      const oRes = await getOutlets(page - 1, pageSize, search, filters, signal);
      setTotalPages(oRes.totalPages || 1);
      setTotalElements(oRes.totalElements || 0);

      const raw = extractList(oRes);
      const enriched = raw.map((o) => {
        let divObjs = [];
        if (Array.isArray(o.divisions)) {
          divObjs = o.divisions;
        } else if (Array.isArray(o.mappings) && o.mappings.length > 0) {
          const dm = new Map();
          o.mappings.forEach((m) => {
            const divId = m.divisionId || m.division?.id;
            const divName = m.divisionName || m.division?.name;
            if (divId) {
              if (!dm.has(divId)) dm.set(divId, { id: divId, name: divName, products: [] });
              const pId = m.productId || m.product?.id;
              const pName = m.productName || m.product?.name;
              const pCode = m.productCode || m.product?.productCode;
              if (pId) dm.get(divId).products.push({ id: pId, name: pName, productCode: pCode });
            }
          });
          divObjs = Array.from(dm.values());
        } else if (o.division) {
          divObjs = [o.division];
        }

        let allProducts = [];
        divObjs.forEach((d) => {
          if (Array.isArray(d.products))
            allProducts = allProducts.concat(d.products.map((p) => ({ ...p, divisionName: d.name })));
        });

        return {
          ...o,
          locationName: o.locationName || o.location?.name || null,
          divisions: divObjs,
          divisionIds: divObjs.map((d) => d.id).filter(Boolean),
          divisionNames: divObjs.map((d) => d.name).filter(Boolean),
          productNames: allProducts.map((p) => p.name).filter(Boolean),
          allProducts,
          ownerName: o.ownerName ?? null,
          address: o.address ?? null,
        };
      });
      setOutlets(enriched);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAll = (silent = false) => fetchOutletsData(silent);

  const handleDivisionSelect = async (divisionId) => {
    if (!divisionId) return;
    let division = divisions.find((d) => d.id == divisionId);
    if (!division || selectedDivisions.find((d) => d.id == divisionId)) return;
    if (!division.products || division.products.length === 0) {
      try {
        const full = await getDivisionById(divisionId);
        if (full) division = { ...division, products: full.products || [] };
      } catch { /* empty */ }
    }
    const next = [...selectedDivisions, division];
    setSelectedDivisions(next);
    setForm((f) => ({ ...f, mappings: { ...f.mappings, [divisionId]: [] } }));
    updateAvailableProducts(next);
  };

  const removeDivision = (divisionId) => {
    const next = selectedDivisions.filter((d) => d.id != divisionId);
    setSelectedDivisions(next);
    setForm((f) => { const m = { ...f.mappings }; delete m[divisionId]; return { ...f, mappings: m }; });
    updateAvailableProducts(next);
  };

  const updateAvailableProducts = (list) => {
    setAvailableProducts(list.flatMap((d) =>
      (d.products || []).map((p) => ({ ...p, divisionId: d.id, divisionName: d.name, displayName: `${p.name} (${d.name})` }))
    ));
  };

  const handleProductSelect = (productId) => {
    if (!productId) return;
    const product = availableProducts.find((p) => p.id == productId);
    if (!product) return;
    const divisionId = product.divisionId;
    setForm((f) => {
      const curr = f.mappings[divisionId] || [];
      if (!curr.includes(Number(productId)))
        return { ...f, mappings: { ...f.mappings, [divisionId]: [...curr, Number(productId)] } };
      return f;
    });
  };

  const removeProduct = (divisionId, productId) => {
    setForm((f) => ({
      ...f,
      mappings: { ...f.mappings, [divisionId]: (f.mappings[divisionId] || []).filter((pid) => pid != productId) },
    }));
  };

  const buildPayload = (id = null) => {
    const locId = form.locationId
      ? Number(form.locationId)
      : locations.find((l) => l.name === form.locationName)?.id ?? null;
    const mappings = Object.entries(form.mappings).flatMap(([divId, prodIds]) =>
      prodIds.map((pid) => ({ divisionId: Number(divId), productId: Number(pid) }))
    );
    const payload = {
      outletName: form.outletName.trim(), address: form.address.trim(),
      locationId: locId, outletType: form.outletType,
      ownerName: form.ownerName.trim(), mappings,
    };
    if (id) payload.id = id;
    return payload;
  };

  const refreshLocations = async () => {
    try {
      const res = await getLocations(0, 100);
      const list = extractList(res);
      setLocations(list);
      return list;
    } catch { return []; }
  };

  const openAddModal = async () => {
    setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
    setIsFormView(true); setEditModal(null); await refreshLocations();
  };

  const openEditModal = async (o) => {
    const locs = await refreshLocations();
    const locId = o.locationId
      ? String(o.locationId)
      : String(locs.find((l) => l.name === (o.locationName || ""))?.id ?? "");
    const mappings = {};
    const selectedDivs = [];
    for (const d of (o.divisions ?? [])) {
      mappings[d.id] = (d.products ?? []).map((p) => p.id);
      try {
        const full = await getDivisionById(d.id);
        selectedDivs.push(full ? { ...d, products: full.products || [] } : d);
      } catch { selectedDivs.push(d); }
    }
    setSelectedDivisions(selectedDivs);
    updateAvailableProducts(selectedDivs);
    setForm({
      outletName: o.outletName ?? "", address: o.address ?? "", locationId: locId,
      locationName: o.locationName ?? "", mappings, outletType: o.outletType ?? "",
      ownerName: o.ownerName ?? "",
    });
    setEditModal(o);
    setIsFormView(true);
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createOutlet(buildPayload());
      await fetchAll(true);
      setIsFormView(false); setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
      showToast("Outlet added successfully!", "success");
    } catch (e) {
      showToast("Failed to add outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateOutlet(editModal.id, buildPayload(editModal.id));
      await fetchAll(true);
      setEditModal(null); setIsFormView(false); setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
      showToast("Outlet updated successfully!", "success");
    } catch (e) {
      showToast("Failed to update outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteOutlet(deleteModal.id);
      await fetchAll(true);
      setDeleteModal(null);
      showToast("Outlet deleted successfully!", "success");
    } catch (e) {
      showToast("Failed to delete outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const allFilterProducts = useMemo(() => {
    const list = divisions.flatMap((d) =>
      (d.products || []).map((p) => ({ ...p, name: `${p.name} (${d.name})` }))
    );
    const unique = [];
    const seen = new Set();
    list.forEach((p) => { if (!seen.has(p.id)) { seen.add(p.id); unique.push(p); } });
    return unique;
  }, [divisions]);

  const filtered = outlets;
  const paginated = outlets;
  const start = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalElements);
  const hasActiveFilters = !!(locationFilter || typeFilter || divisionFilter || productFilter || search);
  const isEdit = !!editModal;

  /* ─── Form Fields (shared) ─── */
  const renderDivisionSection = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "block" }}>Add Division</Typography>
          <SearchableSelect
            options={divisions.filter((d) => !selectedDivisions.find((sd) => sd.id === d.id))}
            value="" onChange={handleDivisionSelect}
            placeholder="— Select division —" searchPlaceholder="Search divisions..."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "block" }}>Add Product</Typography>
          <SearchableSelect
            options={availableProducts.filter((p) => !(form.mappings[p.divisionId] || []).includes(p.id))}
            value="" onChange={handleProductSelect}
            placeholder="— Select product —" searchPlaceholder="Search products..."
            disabled={selectedDivisions.length === 0}
          />
        </Grid>
      </Grid>

      {selectedDivisions.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center", border: "2px dashed", borderColor: "divider", borderRadius: 3, bgcolor: "background.default" }}>
          <GridViewIcon sx={{ fontSize: 36, color: "#c7d2fe", mb: 1 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>No divisions added. Select one above.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {selectedDivisions.map((div) => {
            const selProds = (form.mappings[div.id] || [])
              .map((pid) => availableProducts.find((p) => p.id === pid))
              .filter(Boolean);
            return (
              <Paper key={div.id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", overflow: "hidden" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 2, py: 1.25, bgcolor: "background.default", borderBottom: "1px solid", borderBottomColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4f46e5" }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>{div.name}</Typography>
                    <Chip label={`${selProds.length} product${selProds.length !== 1 ? "s" : ""}`} size="small"
                      sx={{ bgcolor: "#ede9fe", color: "#4f46e5", fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
                  </Box>
                  <IconButton size="small" onClick={() => removeDivision(div.id)}
                    sx={{ color: "#ef4444", "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)" }, borderRadius: "8px" }}>
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
                <Box sx={{ p: 2 }}>
                  {selProds.length === 0
                    ? <Typography variant="caption" sx={{ color: "text.secondary" }}>No products selected for this division</Typography>
                    : (
                      <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {selProds.map((p) => (
                          <Chip key={p.id} label={p.name} size="small"
                            onDelete={() => removeProduct(div.id, p.id)}
                            sx={{ bgcolor: "#ede9fe", color: "#4f46e5", fontWeight: 600, fontSize: "0.74rem" }} />
                        ))}
                      </Stack>
                    )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );

  /* ─── Full-page Form ─── */
  const renderFormPage = () => (
    <Box>
      <FormHeader
        title={isEdit ? `Edit — ${editModal.outletName}` : "Add New Outlet"}
        subtitle={isEdit ? "Update the outlet details below" : "Fill in the details to register a new outlet"}
        onClose={() => { setIsFormView(false); setEditModal(null); setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]); }}
        onSave={isEdit ? handleUpdate : handleAdd}
        saving={saving}
        saveLabel={isEdit ? "Save Changes" : "Add Outlet"}
        saveIcon={isEdit ? <SaveIcon /> : <AddIcon />}
        colorAccent="primary"
      />

      {/* Scrollable Content */}
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>

          {/* Section 1 */}
          <Box sx={{ mb: 4 }}>
            <FormSectionHeader
              title="Basic Information"
              color="#4f46e5"
            />
            <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1.5px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StorefrontIcon sx={{ fontSize: 14, color: "#4f46e5" }} /> Outlet Name <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <TextField fullWidth size="small"
                    value={form.outletName} onChange={handleOutletNameChange}
                    placeholder="e.g. Main Branch" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 14, color: "#7c3aed" }} /> Owner Name <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <TextField fullWidth size="small"
                    value={form.ownerName} onChange={handleOwnerNameChange}
                    placeholder="e.g. John Doe" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <MapIcon sx={{ fontSize: 14, color: "#10b981" }} /> Location <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <SearchableSelect
                    options={locations} value={form.locationId}
                    onChange={(id, name) => setForm((f) => ({ ...f, locationId: id, locationName: name }))}
                    placeholder="— Select location —" searchPlaceholder="Search locations..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CategoryIcon sx={{ fontSize: 14, color: "#f59e0b" }} /> Outlet Type <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <SearchableSelect
                    options={OUTLET_TYPES.map((t) => ({ id: t, name: t }))} value={form.outletType}
                    onChange={(id) => setForm((f) => ({ ...f, outletType: id }))}
                    placeholder="— Select type —" searchPlaceholder="Search types..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LocationOnIcon sx={{ fontSize: 14, color: "#ef4444" }} /> Address <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <TextField fullWidth size="small" multiline rows={3}
                    value={form.address} onChange={handleAddressChange}
                    placeholder="e.g. 123 Main St, City" />
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Section 2 */}
          <Box>
            <FormSectionHeader
              title="Divisions & Products *"
              color="#10b981"
            />
            <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1.5px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              {renderDivisionSection()}
            </Paper>
          </Box>

        </Box>
      </Box>
    </Box>
  );

  /* ─── Card component ─── */
  const OutletCard = ({ o, i }) => {
    const tc = TYPE_META[o.outletType] ?? { bg: "#f1f5f9", color: "text.secondary", dot: "#94a3b8", icon: StorefrontIcon, iconBg: "linear-gradient(135deg, #94a3b8, #64748b)", shadow: "rgba(100,116,139,0.3)" };
    const IconComponent = tc.icon;

    return (
      <GlassCard elevation={0} sx={{ p: "22px 20px 18px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{
            width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center",
            background: tc.iconBg,
            color: "#fff", borderRadius: "13px",
            boxShadow: `0 4px 12px ${tc.shadow}`,
          }}>
            <IconComponent sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{
              color: "text.secondary", fontWeight: 700,
              bgcolor: "background.default", border: "1px solid #e2e8f0",
              borderRadius: "20px", px: "9px", py: "2px",
            }}>
              #{(page - 1) * pageSize + i + 1}
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "0.96rem", color: "text.primary", mb: "3px" }}>
          {o.outletName}
        </Typography>
        {o.outletCode && (
          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", display: "block", mb: 0.75 }}>
            {o.outletCode}
          </Typography>
        )}

        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1 }}>
          {o.outletType && <TypeBadge type={o.outletType} />}
          {o.locationName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>{o.locationName}</Typography>
            </Box>
          )}
        </Stack>

        {o.divisionNames?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 0.75 }}>
            {o.divisionNames.map((d, idx) => (
              <Chip key={idx} label={d} size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontSize: "0.7rem" }} />
            ))}
          </Stack>
        )}
        {o.productNames?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 0.75 }}>
            {o.productNames.slice(0, 3).map((p, idx) => (
              <Chip key={idx} label={p} size="small" sx={{ bgcolor: "#ede9fe", color: "#4f46e5", fontSize: "0.7rem" }} />
            ))}
            {o.productNames.length > 3 && (
              <Chip label={`+${o.productNames.length - 3}`} size="small" sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: "0.7rem" }} />
            )}
          </Stack>
        )}
        {o.ownerName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>{o.ownerName}</Typography>
          </Box>
        )}
        {o.address && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {o.address}
          </Typography>
        )}

        <Divider sx={{ my: 1.25 }} />
        <Stack direction="row" spacing={1}>
          <Button size="small" fullWidth startIcon={<EditIcon sx={{ fontSize: 14 }} />} onClick={() => openEditModal(o)}
            sx={{ borderRadius: "9px" }}>
            Edit
          </Button>
          <Button size="small" fullWidth startIcon={<DeleteIcon sx={{ fontSize: 14 }} />} onClick={() => setDeleteModal(o)}
            color="error" sx={{ borderRadius: "9px" }}>
            Delete
          </Button>
        </Stack>
      </GlassCard>
    );
  };

  /* ═══ RENDER ═══ */
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>

        {/* ─── Hero ─── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", letterSpacing: "-0.4px" }}>
              <TypingText text="Outlet Management" />
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Manage and monitor all your outlet locations
            </Typography>
          </Box>
          {!isFormView && (
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button variant="outlined" color="primary" startIcon={<UploadFileIcon />}
                onClick={() => setBulkOpen(true)}
                sx={{ borderRadius: "12px" }}>
                Bulk Upload
              </Button>
              <ExportMenu getData={() => formatOutletData(filtered)} filename="outlets" title="Outlets Report" backendType="outlets" />
              <Button variant="contained" color="primary" startIcon={<AddIcon />}
                sx={{ borderRadius: "12px", boxShadow: "none" }}
                onClick={openAddModal}>
                Add Outlet
              </Button>
            </Box>
          )}
        </Box>

        {isFormView ? (
          /* ─── Form page (Full Page with Animation) ─── */
          <Box className="animate-fade-in">
            <Paper elevation={0} sx={{ mb: 4, borderRadius: "20px", border: "1.5px solid", borderColor: "divider", overflow: "hidden" }}>
              {renderFormPage()}
            </Paper>
          </Box>
        ) : (
          <Box className="animate-fade-in">
            {/* ─── Stats ─── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
              <StatCard label="Total Outlets" value={loading ? "—" : totalElements}
            icon={<HomeWorkIcon />}
            gradient="linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
            iconBg="linear-gradient(135deg, #4f46e5, #7c3aed)" iconColor="#4f46e5" accent="#4f46e5" />
          <StatCard label="Filtered" value={loading ? "—" : filtered.length}
            icon={<FilterListIcon />}
            gradient="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
            iconBg="linear-gradient(135deg, #10b981, #059669)" iconColor="#10b981" accent="#10b981" />
          <StatCard label="Locations Used" value={loading ? "—" : [...new Set(outlets.map((o) => o.locationName).filter(Boolean))].length}
            icon={<LocationOnIcon />}
            gradient="linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)"
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)" iconColor="#f59e0b" accent="#f59e0b" />
          <StatCard label="Types" value={loading ? "—" : [...new Set(outlets.map((o) => o.outletType).filter(Boolean))].length}
            icon={<CategoryIcon />}
            gradient="linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
            iconBg="linear-gradient(135deg, #0ea5e9, #0284c7)" iconColor="#0ea5e9" accent="#0ea5e9" />
        </Stack>

        {/* ─── Error ─── */}
        {error && (
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>
        )}

        {/* ─── Toolbar ─── */}
        <Paper elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: "16px", p: "14px 18px", mb: 2, bgcolor: "background.paper" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>

            {/* Search */}
            <TextField size="small" placeholder="Search by name, type, location…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
              sx={{ minWidth: 260, flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} /></InputAdornment>,
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }} />

            {/* Filter Toggle */}
            <Button
              size="small" startIcon={<TuneIcon />}
              variant={showFilters ? "contained" : "outlined"}
              onClick={() => setShowFilters((v) => !v)}
              sx={{
                borderRadius: "10px", fontWeight: 700, height: 40, px: 2,
                ...(showFilters
                  ? { bgcolor: "#4f46e5", color: "#fff", "&:hover": { bgcolor: "#4338ca" } }
                  : { borderColor: "#e2e8f0", color: "text.secondary" }),
              }}>
              Filters {hasActiveFilters && !showFilters ? `(${[locationFilter, typeFilter, divisionFilter, productFilter].filter(Boolean).length})` : ""}
            </Button>

            {hasActiveFilters && (
              <Button size="small" onClick={() => { setLocationFilter(""); setTypeFilter(""); setDivisionFilter(""); setProductFilter(""); setSearch(""); setSearchInput(""); setPage(1); }}
                sx={{ color: "#ef4444", bgcolor: "#fef2f2", borderRadius: "10px", fontWeight: 700, height: 40, px: 2 }}>
                Clear All
              </Button>
            )}

            <Box sx={{ ml: { md: "auto" }, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>Show</Typography>
                <FormControl size="small" sx={{ minWidth: 72 }}>
                  <Select value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    sx={{ borderRadius: "10px" }}>
                    {PAGE_SIZES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>entries</Typography>
              </Stack>

              <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}
                sx={{ "& .MuiToggleButton-root": { px: 1.5, border: "1.5px solid #e8eaf6", borderRadius: "10px !important" } }}>
                <ToggleButton value="table"><Tooltip title="Table"><TableChartIcon fontSize="small" /></Tooltip></ToggleButton>
                <ToggleButton value="card"><Tooltip title="Cards"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>

          {/* Collapsible Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f1f5f9" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
                {[
                  { options: locations, value: locationFilter, onChange: (id) => { setLocationFilter(id); setPage(1); }, placeholder: "All Locations" },
                  { options: OUTLET_TYPES.map((t) => ({ id: t, name: t })), value: typeFilter, onChange: (id) => { setTypeFilter(id); setPage(1); }, placeholder: "All Types" },
                  { options: divisions, value: divisionFilter, onChange: (id) => { setDivisionFilter(id); setPage(1); }, placeholder: "All Divisions" },
                  { options: allFilterProducts, value: productFilter, onChange: (id) => { setProductFilter(id); setPage(1); }, placeholder: "All Products" },
                ].map((f, idx) => (
                  <Box key={idx} sx={{ minWidth: 160 }}>
                    <SearchableSelect
                      options={f.options} value={f.value} onChange={f.onChange}
                      placeholder={f.placeholder} searchPlaceholder={`Search ${f.placeholder.toLowerCase()}...`}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </Paper>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {search && <Chip label={`Search: "${search}"`} size="small" onDelete={() => setSearch("")} sx={{ bgcolor: "#ede9fe", color: "#4f46e5" }} />}
            {locationFilter && <Chip label={`Location: ${locations.find((l) => l.id == locationFilter)?.name ?? locationFilter}`} size="small" onDelete={() => setLocationFilter("")} sx={{ bgcolor: "#d1fae5", color: "#065f46" }} />}
            {typeFilter && <Chip label={`Type: ${typeFilter}`} size="small" onDelete={() => setTypeFilter("")} sx={{ bgcolor: "#fef3c7", color: "#92400e" }} />}
            {divisionFilter && <Chip label={`Division: ${divisions.find((d) => d.id == divisionFilter)?.name ?? divisionFilter}`} size="small" onDelete={() => setDivisionFilter("")} sx={{ bgcolor: "#e0f2fe", color: "#075985" }} />}
          </Stack>
        )}

        {/* ─── Loading bar ─── */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: "4px", bgcolor: "#ede9fe", "& .MuiLinearProgress-bar": { bgcolor: "#4f46e5" } }} />}

        {/* ─── Table View ─── */}
        {view === "table" && (
          <Paper elevation={0} sx={{ borderRadius: "16px", border: "1.5px solid #e8eaf6", overflow: "hidden", mb: 2 }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {["", "#", "Outlet", "Code", "Type", "Location", "Divisions", "Products", "Owner", "Actions"].map((h) => (
                    <TableCell key={h} sx={h === "" ? { width: 40, p: "15px 8px" } : {}}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {Array(10).fill(0).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" width={j === 2 ? 130 : 70} height={18} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 60, height: 60, borderRadius: "18px", bgcolor: "background.default",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <HomeWorkIcon sx={{ fontSize: 30, color: "#cbd5e1" }} />
                        </Box>
                        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                          {search ? "No outlets match your search" : "No outlets yet"}
                        </Typography>
                        {!search && (
                          <Button variant="contained" color="primary" size="small" startIcon={<AddIcon />}
                            sx={{ borderRadius: "10px", boxShadow: "none" }}
                            onClick={openAddModal}>
                            Add First Outlet
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((o, i) => (
                    <>
                      <StyledTableRow key={`row-${o.id}`}>
                        {/* Expand toggle */}
                        <TableCell sx={{ width: 40, p: "13px 8px" }}>
                          <IconButton size="small"
                            onClick={() => setExpandedRow(expandedRow === o.id ? null : o.id)}
                            sx={{ color: "text.secondary", bgcolor: expandedRow === o.id ? "#ede9fe" : "transparent",
                              borderRadius: "8px", width: 28, height: 28 }}>
                            {expandedRow === o.id
                              ? <KeyboardArrowUpIcon sx={{ fontSize: 18, color: "#4f46e5" }} />
                              : <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ color: "text.secondary", fontWeight: 700, fontSize: "12px" }}>
                          {(page - 1) * pageSize + i + 1}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {(() => {
                              const tc = TYPE_META[o.outletType] ?? { bg: "#f1f5f9", color: "text.secondary", dot: "#94a3b8", icon: StorefrontIcon, iconBg: "linear-gradient(135deg, #94a3b8, #64748b)", shadow: "rgba(100,116,139,0.3)" };
                              const IconComp = tc.icon;
                              return (
                                <Box sx={{
                                  width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                                  background: tc.iconBg, color: "#fff", borderRadius: "10px",
                                  boxShadow: `0 2px 8px ${tc.shadow}`,
                                }}>
                                  <IconComp sx={{ fontSize: 16 }} />
                                </Box>
                              );
                            })()}
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {o.outletName}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {o.outletCode
                            ? <Box sx={{ display: "inline-block", bgcolor: "background.default", border: "1px solid #e2e8f0",
                                borderRadius: "7px", px: "8px", py: "2px", fontFamily: "monospace",
                                fontSize: "11.5px", color: "text.secondary", fontWeight: 700 }}>
                                {o.outletCode}
                              </Box>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        <TableCell>
                          {o.outletType
                            ? <TypeBadge type={o.outletType} />
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        <TableCell>
                          {o.locationName
                            ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                <LocationOnIcon sx={{ fontSize: 13, color: "#10b981" }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.locationName}</Typography>
                              </Box>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        <TableCell>
                          {!o.divisionNames?.length
                            ? <Typography variant="body2" sx={{ color: "#cbd5e1" }}>No divisions</Typography>
                            : <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                {o.divisionNames.slice(0, 2).map((d, idx) => (
                                  <Chip key={idx} label={d} size="small" sx={{ bgcolor: "#d1fae5", color: "#065f46", fontSize: "0.7rem" }} />
                                ))}
                                {o.divisionNames.length > 2 && (
                                  <Chip label={`+${o.divisionNames.length - 2}`} size="small" sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: "0.7rem" }} />
                                )}
                              </Stack>}
                        </TableCell>

                        <TableCell>
                          {!o.productNames?.length
                            ? <Typography variant="body2" sx={{ color: "#cbd5e1" }}>No products</Typography>
                            : <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                {o.productNames.slice(0, 2).map((p, idx) => (
                                  <Chip key={idx} label={p} size="small" sx={{ bgcolor: "#ede9fe", color: "#4f46e5", fontSize: "0.7rem" }} />
                                ))}
                                {o.productNames.length > 2 && (
                                  <Chip label={`+${o.productNames.length - 2}`} size="small" sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: "0.7rem" }} />
                                )}
                              </Stack>}
                        </TableCell>

                        <TableCell>
                          {o.ownerName
                            ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                <PersonIcon sx={{ fontSize: 13, color: "#7c3aed" }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.ownerName}</Typography>
                              </Box>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.75}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditModal(o)}
                                sx={{ color: "#4f46e5", bgcolor: "#ede9fe", borderRadius: "8px",
                                  "&:hover": { bgcolor: "#4f46e5", color: "#fff" } }}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => setDeleteModal(o)}
                                sx={{ color: "#ef4444", bgcolor: "#fef2f2", borderRadius: "8px",
                                  "&:hover": { bgcolor: "#ef4444", color: "#fff" } }}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </StyledTableRow>

                      {/* Expandable detail row */}
                      {expandedRow === o.id && (
                        <OutletDetailRow key={`exp-${o.id}`} outlet={o} colSpan={10} />
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* ─── Card View ─── */}
        {view === "card" && (
          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            {loading
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper elevation={0} sx={{ borderRadius: "18px", border: "1.5px solid #e8eaf6", p: 2.5 }}>
                      <Skeleton variant="circular" width={46} height={46} sx={{ mb: 1.5 }} />
                      <Skeleton width="60%" height={22} sx={{ mb: 0.5 }} />
                      <Skeleton width="40%" height={18} />
                    </Paper>
                  </Grid>
                ))
              : paginated.length === 0
              ? (
                <Grid item xs={12}>
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <HomeWorkIcon sx={{ fontSize: 56, color: "#c7d2fe", mb: 1 }} />
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                      {search ? "No outlets match your search" : "No outlets yet"}
                    </Typography>
                  </Box>
                </Grid>
              )
              : paginated.map((o, i) => (
                  <Grid item xs={12} sm={6} md={4} key={o.id}>
                    <OutletCard o={o} i={i} />
                  </Grid>
                ))}
          </Grid>
        )}

        {/* ─── Pagination ─── */}
        {!loading && totalElements > 0 && (
          <Paper elevation={0} sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 3, py: 1.75, borderRadius: "14px", border: "1.5px solid #e8eaf6",
            flexWrap: "wrap", gap: 1, bgcolor: "background.paper",
          }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Showing <strong style={{ color: "text.primary" }}>{start}–{end}</strong> of{" "}
              <strong style={{ color: "text.primary" }}>{totalElements}</strong> entries
            </Typography>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)}
              shape="rounded" size="small"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: "9px", fontWeight: 700 },
                "& .Mui-selected": {
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed) !important",
                  color: "#fff",
                  boxShadow: "0 3px 10px rgba(79,70,229,0.3)",
                },
              }} />
          </Paper>
        )}
          </Box>
        )}

        {/* ─── Delete Dialog ─── */}
        <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth>
          <ModalIconHeader icon={<WarningAmberIcon />} title="Delete Outlet"
            subtitle="This action cannot be undone" accent="#ef4444" onClose={() => setDeleteModal(null)} />
          <DialogContent sx={{ pt: 2.5 }}>
            <Box sx={{ bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", p: "14px 16px" }}>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600, mb: 0.5 }}>
                Are you sure you want to delete{" "}
                <Typography component="span" sx={{ color: "#ef4444", fontWeight: 800 }}>
                  "{deleteModal?.outletName}"
                </Typography>?
              </Typography>
              <Typography variant="caption" sx={{ color: "#ef4444" }}>
                All associated data will be permanently removed.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit"
              sx={{ borderRadius: "10px" }}
              onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} disabled={saving}
              sx={{ borderRadius: "10px", boxShadow: "none" }} onClick={handleDelete}>
              {saving ? "Deleting…" : "Delete Outlet"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Toast ─── */}
        <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={toast?.type === "success" ? "success" : toast?.type === "warning" ? "warning" : "error"}
            onClose={() => setToast(null)} sx={{ borderRadius: "12px", fontWeight: 600 }}>
            {toast?.message}
          </Alert>
        </Snackbar>

        {/* ─── Bulk Upload ─── */}
        <BulkUploadModal
          open={bulkOpen} onClose={() => setBulkOpen(false)}
          title="Bulk Upload Outlets" accent="#4f46e5"
          templateHeaders={["outletName", "ownerName", "address", "locationName", "outletType", "divisionNames", "productNames"]}
          templateRows={[
            ["Main Branch", "John Doe", "123 Main St", "New York", "Retail", "Electronics", "Laptop"],
            ["North Hub", "Jane Smith", "45 North Ave", "Los Angeles", "Wholesale", "Groceries", "Apple, Banana"],
          ]}
          parseRow={(row) => {
            const outletName   = (row["outletname"]   || row["outletName"]   || "").trim();
            const ownerName    = (row["ownername"]    || row["ownerName"]    || "").trim();
            const address      = (row["address"]      || "").trim();
            const locationName = (row["locationname"] || row["locationName"] || "").trim();
            const outletType   = (row["outlettype"]   || row["outletType"]   || "").trim();
            const divNamesStr  = (row["divisionnames"] || row["divisionNames"] || "").trim();
            const prodNamesStr = (row["productnames"]  || row["productNames"]  || "").trim();

            if (!outletName)  return { valid: false, error: "outletName is required" };
            if (/\d/.test(outletName)) return { valid: false, error: "outletName cannot contain numbers" };
            if (!ownerName)   return { valid: false, error: "ownerName is required" };
            if (/\d/.test(ownerName))  return { valid: false, error: "ownerName cannot contain numbers" };
            if (!address)     return { valid: false, error: "address is required" };
            if (!locationName) return { valid: false, error: "locationName is required" };
            if (!outletType)  return { valid: false, error: "outletType is required" };
            if (!OUTLET_TYPES.includes(outletType)) return { valid: false, error: `outletType must be one of: ${OUTLET_TYPES.join(", ")}` };

            const loc = locations.find((l) => l.name.toLowerCase() === locationName.toLowerCase());
            if (!loc) return { valid: false, error: `Location not found: ${locationName}` };

            let mappings = [];
            if (divNamesStr) {
              for (let divName of divNamesStr.split(",").map((s) => s.trim()).filter(Boolean)) {
                const d = divisions.find((x) => x.name.toLowerCase() === divName.toLowerCase());
                if (d) mappings.push({ divisionId: d.id, productId: null });
                else return { valid: false, error: `Division not found: ${divName}` };
              }
            }
            if (prodNamesStr) {
              for (let prodName of prodNamesStr.split(",").map((s) => s.trim()).filter(Boolean)) {
                let foundProd = null, foundDivId = null;
                for (let d of divisions) {
                  const p = d.products?.find((x) =>
                    x.name.toLowerCase() === prodName.toLowerCase() ||
                    String(x.productCode).toLowerCase() === prodName.toLowerCase()
                  );
                  if (p) { foundProd = p; foundDivId = d.id; break; }
                }
                if (foundProd) mappings.push({ divisionId: foundDivId, productId: foundProd.id });
                else return { valid: false, error: `Product not found: ${prodName}` };
              }
            }

            return { valid: true, data: { outletName, ownerName, address, locationId: loc.id, outletType, mappings } };
          }}
          onUpload={(rows) => bulkCreateOutlets(rows)}
          onDone={() => fetchAll(true)}
        />

      </Box>
  );
}