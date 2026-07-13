import { useState } from "react";
import { Box, ButtonBase, Menu, MenuItem, Typography, CircularProgress } from "@mui/material";
import { FileDownloadRounded } from "@mui/icons-material";
import { exportToCSV, exportToExcel, exportToPDF, downloadBackendExport } from "../../utils/exportUtils";


const ExportMenu = ({ getData, filename = "export", title = "Export", backendType }) => {
  const [anchor, setAnchor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async (fn, format) => {
    setAnchor(null);
    if (backendType) {
      setLoading(true);
      try {
        await downloadBackendExport(backendType, format);
      } finally {
        setLoading(false);
      }
    } else {
      if (!getData) return;
      setLoading(true);
      try {
        const data = await getData();
        if (!data || data.length === 0) {
          alert("No data to export");
          return;
        }
        await fn(data, `${filename}_${new Date().toISOString().slice(0, 10)}`);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Export failed: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={loading}
        sx={{
          display: "flex", alignItems: "center", gap: 0.75,
          px: 2, py: 1, borderRadius: "50px",
          border: "1.5px solid #7d2ae8", color: "#7d2ae8",
          fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 600,
          opacity: loading ? 0.7 : 1,
          "&.Mui-disabled": { opacity: 0.7 }
        }}
      >
        {loading ? (
          <CircularProgress size={16} sx={{ color: "#7d2ae8" }} />
        ) : (
          <FileDownloadRounded sx={{ fontSize: 16 }} />
        )}
        {loading ? "Exporting..." : "Export"}
      </ButtonBase>

      <Menu
        anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" } }}
      >
        {[
          { label: "Export as PDF",   color: "#ef4444", format: "pdf",   fn: (d, f) => exportToPDF(d, `${f}.pdf`, title) },
          { label: "Export as Excel", color: "#16a34a", format: "excel", fn: (d, f) => exportToExcel(d, `${f}.xlsx`) },
          { label: "Export as CSV",   color: "#0284c7", format: "csv",   fn: (d, f) => exportToCSV(d, `${f}.csv`) },
        ].map(({ label, color, format, fn }) => (
          <MenuItem key={label} onClick={() => handle(fn, format)} sx={{ gap: 1, fontSize: "0.85rem", fontFamily: "inherit" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.85rem", fontFamily: "inherit" }}>{label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ExportMenu;

