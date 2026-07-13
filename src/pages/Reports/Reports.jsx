import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/apiClient";
import { reportService } from "../../services/reportService";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer
} from "recharts";
import {
  Inventory2Rounded, CheckCircleRounded, SwapHorizRounded, 
  AccessTimeRounded, PieChartRounded, TableChartRounded, 
  DownloadRounded, PeopleRounded, StorefrontRounded, 
  AccountTreeRounded, TrendingUpRounded, ShoppingCartRounded, WarningRounded
} from "@mui/icons-material";
import TypingText from "../../components/TypingText";

// Custom Premium Colors
const CHART_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

// Custom Compact Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        background: "rgba(15, 23, 42, 0.95)", border: "none", borderRadius: "6px", p: "6px 10px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", mb: 0.25 }}>
          {payload[0].name}
        </Typography>
        <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8" }}>
          Count: {payload[0].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom Compact Legend
const CustomPieLegend = ({ data, colors }) => {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1, mt: 1.5, px: 0.5, maxHeight: "60px", overflowY: "auto", "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "4px" } }}>
      {data.map((item, index) => (
        <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: colors[index % colors.length] }} />
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
            {item.name} ({item.value})
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Reusable StatCard inline
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
        {value || 0}
      </Typography>
      <Typography sx={{ fontSize: 12, color: iconColor, fontWeight: 600, mt: "2px", textTransform: "uppercase" }}>{label}</Typography>
    </Box>
  </Paper>
);

// Reusable PremiumCard inline
const PremiumCard = ({ title, subtitle, icon, children }) => (
  <Paper elevation={0} sx={{
    background: (theme) => theme.palette.mode === 'dark' ? 'var(--color-bg-sidebar)' : theme.palette.background.paper,
    borderRadius: "20px",
    border: (theme) => `1.5px solid ${theme.palette.divider}`,
    boxShadow: (theme) => theme.palette.mode === 'dark' ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: (theme) => theme.palette.mode === 'dark' ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(79,70,229,0.12)",
      borderColor: "primary.main",
    }
  }}>
    <Box sx={{ p: 2, borderBottom: "1.5px solid", borderBottomColor: "divider", display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ color: "primary.main", display: "flex", background: "rgba(79,70,229,0.1)", p: 1, borderRadius: "10px" }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: "16px", fontWeight: 800, color: "text.primary" }}>{title}</Typography>
        <Typography sx={{ fontSize: "14px", color: "text.secondary" }}>{subtitle}</Typography>
      </Box>
    </Box>
    <Box sx={{ p: 2, flex: 1 }}>{children}</Box>
  </Paper>
);

export default function Reports() {
  const { role } = useAuth();
  const [downloading, setDownloading] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const userRole = (role || "USER").toUpperCase().replace("ROLE_", "");

  useEffect(() => {
    reportService.getDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (type, endpoint, format, filename) => {
    setDownloading(prev => ({ ...prev, [type]: true }));
    try {
      const response = await API.get(`/api/export/${endpoint}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSnack({ open: true, msg: `${filename} downloaded successfully!`, severity: "success" });
    } catch (error) {
      console.error("Export failed:", error);
      setSnack({ open: true, msg: `Failed to export ${filename}.`, severity: "error" });
    } finally {
      setDownloading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={24} sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  const d = summary ?? {};
  const divisionData = (d.divisionStats || []).map(div => ({ name: div.name, value: Number(div.count) }));
  const totalProducts = divisionData.reduce((acc, curr) => acc + curr.value, 0);

  const orderStatusData = [
    { name: "Pending", value: Number(d.pendingOrdersCount || 0) },
    { name: "Completed/Approved", value: Math.max(0, Number(d.totalOrders || 0) - Number(d.pendingOrdersCount || 0)) }
  ].filter(x => x.value > 0);

  const stockHealthData = [
    { name: "Low Stock", value: Number(d.lowStockCount || 0) },
    { name: "Healthy", value: Math.max(0, totalProducts - Number(d.lowStockCount || 0)) }
  ].filter(x => x.value > 0);

  // Available reports based on role
  const allReports = [
    { type: "orders", label: "Orders Ledger", desc: "Detailed order histories.", endpoint: "orders", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"] },
    { type: "stock", label: "Stock Registry", desc: "Current inventory levels.", endpoint: "stock", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "batches", label: "Batch Tracking", desc: "Expiry and batch records.", endpoint: "batches", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "products", label: "Product Catalog", desc: "Master product list.", endpoint: "products", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "outlets", label: "Outlets Directory", desc: "Mapping and configurations.", endpoint: "outlets", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "divisions", label: "Division Summary", desc: "Categorization metrics.", endpoint: "divisions", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "locations", label: "Locations Map", desc: "Geographic mappings.", endpoint: "locations", roles: ["ADMIN", "MANAGER", "OUTLET_MANAGER"] },
    { type: "users", label: "User Directory", desc: "System access audit.", endpoint: "users", roles: ["ADMIN"] },
  ];

  const downloadReports = allReports.filter(r => r.roles.includes(userRole));

  return (
    <Box sx={{ fontFamily: "'Inter','Segoe UI',sans-serif", p: { xs: 2, md: 3 }, width: "100%", animation: "fade-in 0.5s ease" }}>
      {/* Header */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PieChartRounded sx={{ color: "#3b82f6", fontSize: { xs: 28, sm: 36 } }} /> 
            <TypingText text={userRole === "ADMIN" ? "Global Reports & Analytics" : "Outlet Reports & Analytics"} />
          </Typography>
          <Typography className="page-subtitle">
            {userRole === "ADMIN" ? "Aggregated system telemetry and premium exports hub." : "Your outlet's performance telemetry and export hub."}
          </Typography>
        </Box>
      </Box>

      {/* ── Compact Interactive Download Center ──────────────────────────────── */}
      <Paper elevation={0} sx={{
        background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.05))' : 'linear-gradient(135deg, #ffffff, #fcfdff)',
        borderRadius: "12px", border: "1px solid", borderColor: "divider",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)", p: { xs: 1.5, sm: 2 }, mb: 3
      }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, mb: 2, pb: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Box>
            <Typography sx={{ fontSize: "16px", fontWeight: 800, color: "text.primary", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 1 }}>
              <TableChartRounded sx={{ color: "#10b981", fontSize: 20 }} /> Report Export Hub
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#64748b", mt: 0.5 }}>
              Select a module ledger to export {userRole === "ADMIN" ? "full system database registers" : "your outlet's registers"} to Excel sheets.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'var(--color-bg-secondary)' : "#ecfdf5", color: "#10b981", px: 1.5, py: 0.5, borderRadius: "12px", alignSelf: { xs: "flex-start", sm: "auto" } }}>
            <CheckCircleRounded sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Live Synced</Typography>
          </Box>
        </Box>

        {/* Dense CSS Grid for Report Cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
          {downloadReports.map((r) => (
            <Box key={r.type} sx={{
              bgcolor: "background.paper", borderRadius: "8px", border: "1px solid", borderColor: "divider", p: "12px",
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 96,
              transition: "all 150ms ease", "&:hover": { borderColor: "primary.light", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)", transform: "translateY(-2px)" }
            }}>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontSize: "16px", fontWeight: 800, color: "text.primary" }}>{r.label}</Typography>
                  <Box sx={{ bgcolor: "action.hover", border: "1px solid", borderColor: "divider", color: "text.secondary", fontSize: "12px", fontWeight: 700, px: 1, py: 0.25, borderRadius: "4px" }}>
                    XLSX
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "14px", color: "text.secondary", lineHeight: 1.3 }}>{r.desc}</Typography>
              </Box>

              <Button
                variant="contained" disableElevation
                onClick={() => handleDownload(r.type, r.endpoint, "excel", r.label)}
                disabled={downloading[r.type]}
                startIcon={downloading[r.type] ? <CircularProgress size={14} color="inherit" /> : <DownloadRounded sx={{ fontSize: 16 }} />}
                sx={{
                  mt: 1.5, textTransform: "none", fontSize: "14px", fontWeight: 700, py: "6px", borderRadius: "6px",
                  background: "linear-gradient(135deg, #7d2ae8, #a855f7)", color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(125,42,232,0.2)",
                  "&:hover": { background: "linear-gradient(135deg, #6b21c1, #9333ea)" },
                  "&.Mui-disabled": { background: "#f1f5f9", color: "#94a3b8", boxShadow: "none" }
                }}
              >
                {downloading[r.type] ? "Building..." : "Export"}
              </Button>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── Compact Stat KPI Row ────────────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 3 }}>
        <StatCard label={userRole === "ADMIN" ? "Global Orders" : "Total Orders"} value={d.totalOrders} icon={<ShoppingCartRounded />} 
          gradient="linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" iconBg="linear-gradient(135deg, #f59e0b, #d97706)" iconColor="#d97706" accent="#f59e0b" />
        <StatCard label="Pending Orders" value={d.pendingOrdersCount} icon={<AccessTimeRounded />} 
          gradient="linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)" iconBg="linear-gradient(135deg, #f43f5e, #e11d48)" iconColor="#e11d48" accent="#f43f5e" />
        <StatCard label={userRole === "ADMIN" ? "System Revenue" : "Outlet Revenue"} value={`₹${d.totalRevenue?.toLocaleString() || 0}`} icon={<TrendingUpRounded />} 
          gradient="linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)" iconBg="linear-gradient(135deg, #10b981, #059669)" iconColor="#059669" accent="#10b981" />
        {userRole === "ADMIN" && (
          <StatCard label="Total Users" value={d.totalUsers} icon={<PeopleRounded />} 
            gradient="linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)" iconBg="linear-gradient(135deg, #3b82f6, #2563eb)" iconColor="#2563eb" accent="#3b82f6" />
        )}
        <StatCard label={userRole === "ADMIN" ? "Global Low Stock" : "Low Stock Alerts"} value={d.lowStockCount} icon={<WarningRounded />} 
          gradient="linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)" iconBg="linear-gradient(135deg, #d946ef, #c026d3)" iconColor="#c026d3" accent="#d946ef" />
      </Box>

      {/* ── Section: Distribution charts (Highly space-efficient CSS Grid) ──── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, mb: 3 }}>
        
        {/* Divisions — Compact Donut */}
        <PremiumCard title="Products by Division" subtitle="Category breakdowns" icon={<AccountTreeRounded />}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={divisionData.length > 0 ? divisionData : [{ name: "No Categories", value: 1 }]} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={divisionData.length > 0 ? 2.5 : 0} dataKey="value">
                    {divisionData.length > 0
                      ? divisionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />)
                      : <Cell fill="var(--color-bg-secondary)" stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />
                    }
                  </Pie>
                  {divisionData.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <Typography sx={{ fontSize: "24px", fontWeight: 900, color: "text.primary", lineHeight: 1 }}>{totalProducts}</Typography>
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", mt: 0.5 }}>Products</Typography>
              </Box>
            </Box>
            {divisionData.length > 0 ? (
              <CustomPieLegend data={divisionData} colors={CHART_COLORS} />
            ) : (
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "text.secondary", textAlign: "center", mt: 2, textTransform: "uppercase" }}>No Categories Registered</Typography>
            )}
          </Box>
        </PremiumCard>

        {/* Order Status — Compact Donut */}
        <PremiumCard title="Order Status Overview" subtitle="Completion metrics" icon={<ShoppingCartRounded />}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData.length > 0 ? orderStatusData : [{ name: "No Orders", value: 1 }]} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={orderStatusData.length > 0 ? 2.5 : 0} dataKey="value">
                    {orderStatusData.length > 0
                      ? orderStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />)
                      : <Cell fill="var(--color-bg-secondary)" stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />
                    }
                  </Pie>
                  {orderStatusData.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#64748b" }}>
                <SwapHorizRounded sx={{ fontSize: 24 }} />
              </Box>
            </Box>
            {orderStatusData.length > 0 ? (
              <CustomPieLegend data={orderStatusData} colors={CHART_COLORS.slice(3).concat(CHART_COLORS.slice(0, 3))} />
            ) : (
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "text.secondary", textAlign: "center", mt: 2, textTransform: "uppercase" }}>No Orders Registered</Typography>
            )}
          </Box>
        </PremiumCard>

        {/* Stock Health — Compact Donut */}
        <PremiumCard title="Overall Stock Health" subtitle="Availability distribution" icon={<Inventory2Rounded />}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockHealthData.length > 0 ? stockHealthData : [{ name: "No Stock", value: 1 }]} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={stockHealthData.length > 0 ? 2.5 : 0} dataKey="value">
                    {stockHealthData.length > 0
                      ? stockHealthData.map((_, i) => <Cell key={i} fill={i === 0 && d.lowStockCount > 0 ? "#f43f5e" : "#10b981"} stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />)
                      : <Cell fill="var(--color-bg-secondary)" stroke="var(--color-bg-sidebar)" strokeWidth={1.5} />
                    }
                  </Pie>
                  {stockHealthData.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: d.lowStockCount > 0 ? "#f43f5e" : "#10b981" }}>
                <CheckCircleRounded sx={{ fontSize: 24 }} />
              </Box>
            </Box>
            {stockHealthData.length > 0 ? (
              <CustomPieLegend data={stockHealthData} colors={d.lowStockCount > 0 ? ["#f43f5e", "#10b981"] : ["#10b981"]} />
            ) : (
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "text.secondary", textAlign: "center", mt: 2, textTransform: "uppercase" }}>No Stock Data</Typography>
            )}
          </Box>
        </PremiumCard>

      </Box>
      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
