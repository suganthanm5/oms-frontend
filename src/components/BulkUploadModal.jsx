import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, LinearProgress, Chip, Stack,
  useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridOnIcon from "@mui/icons-material/GridOn";


const normalizeHeader = (str) => {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};


const translateErrorMessage = (errorStr) => {
  if (!errorStr) return "Unknown error occurred";
  const err = String(errorStr).toLowerCase();

  if (err.includes("duplicate entry") || err.includes("already exists") || err.includes("409")) {
    const match = errorStr.match(/Duplicate entry '(.*?)'/i);
    if (match && match[1]) {
      return `"${match[1]}" already exists in the database. Please enter a unique name.`;
    }
    return "This record already exists in the system (Duplicate Entry).";
  }

  if (err.includes("foreign key") || err.includes("constraint fails") || err.includes("referential integrity")) {
    return "The referenced parent record (like Location ID or Division ID) does not exist. Please check your IDs.";
  }

  if (err.includes("not-null") || err.includes("cannot be null") || err.includes("column cannot be null")) {
    return "A required cell in this row is blank. Please ensure all mandatory columns are filled.";
  }

  if (err.includes("access denied") || err.includes("unauthorized") || err.includes("401") || err.includes("403")) {
    return "You do not have administrative permission to upload these records.";
  }

  if (err.includes("data truncation") || err.includes("value too long")) {
    return "One of the text values in this row is too long for the database.";
  }

  if (err.includes("incorrect integer value") || err.includes("incorrect decimal value")) {
    return "This row contains text in a cell that requires a number.";
  }

  return errorStr;
};


const BulkUploadModal = ({
  open, onClose, title, accent = "#6366f1",
  templateHeaders, templateRows, parseRow, onUpload, onDone,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fileRef = useRef(null);
  const [step, setStep] = useState("idle");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState([]);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState(""); // "csv" | "excel"

  const reset = () => {
    setStep("idle"); setRows([]); setErrors([]);
    setResults([]); setFileName(""); setFileType("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── Download CSV template ── */
  const downloadCSV = () => {
    const csv = [templateHeaders, ...templateRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Download Excel template ── */
  const downloadExcel = () => {
    const wsData = [templateHeaders, ...templateRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto column widths
    ws["!cols"] = templateHeaders.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

    // Style header row bold
    templateHeaders.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_template.xlsx`);
  };

  /* ── Parse rows from a sheet (shared for CSV & Excel) ── */
  const processSheetData = (sheetRows, fname) => {
    if (sheetRows.length < 2) {
      setErrors([{ row: 0, msg: "The uploaded file is empty or contains no data rows." }]);
      setFileName(fname);
      setStep("preview");
      return;
    }

    // Capture and normalize original headers from spreadsheet
    const originalHeaders = sheetRows[0].map(h => String(h ?? "").trim());
    const normalizedUploaded = originalHeaders.map(h => normalizeHeader(h));
    const normalizedExpected = templateHeaders.map(h => normalizeHeader(h));

    // Verify if any mandatory columns are completely missing
    const missingHeaders = [];
    templateHeaders.forEach((expectedHeader, i) => {
      const normExp = normalizedExpected[i];
      if (!normalizedUploaded.includes(normExp)) {
        missingHeaders.push(expectedHeader);
      }
    });

    if (missingHeaders.length > 0) {
      setErrors([{
        row: 0,
        msg: `Required column(s) missing: ${missingHeaders.join(", ")}. Please ensure your spreadsheet columns are named correctly: ${templateHeaders.join(", ")}.`
      }]);
      setFileName(fname);
      setStep("preview");
      return;
    }

    const validRows = [], parseErrors = [];

    sheetRows.slice(1).forEach((values, idx) => {
      // Skip completely empty rows
      if (values.every((v) => v === "" || v == null)) return;

      const rowObj = {};
      // Map columns dynamically based on fuzzy match
      originalHeaders.forEach((origHeader, i) => {
        const normHeader = normalizeHeader(origHeader);
        const matchIdx = normalizedExpected.indexOf(normHeader);
        if (matchIdx !== -1) {
          const expectedKey = templateHeaders[matchIdx];
          const cellValue = String(values[i] ?? "").trim();
          rowObj[expectedKey] = cellValue;
          rowObj[expectedKey.toLowerCase()] = cellValue;
        } else {
          // Extra columns
          const cellValue = String(values[i] ?? "").trim();
          rowObj[origHeader] = cellValue;
          rowObj[origHeader.toLowerCase()] = cellValue;
        }
      });

      const { valid, data, error } = parseRow(rowObj, idx + 2);
      if (valid) {
        validRows.push(data);
      } else {
        parseErrors.push({ row: idx + 2, msg: error });
      }
    });

    setRows(validRows);
    setErrors(parseErrors);
    setFileName(fname);
    setStep("preview");
  };

  /* ── Handle file selection ── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    const isExcel = ext === "xlsx" || ext === "xls";
    const isCsv = ext === "csv";

    if (!isExcel && !isCsv) {
      setErrors([{ row: 0, msg: "Unsupported file format. Please upload a valid .csv, .xlsx, or .xls file." }]);
      setFileName(file.name);
      setStep("preview");
      return;
    }

    setFileType(isExcel ? "excel" : "csv");
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        processSheetData(sheetRows, file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: "string" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        processSheetData(sheetRows, file.name);
      };
      reader.readAsText(file);
    }
  };

  /* ── Drag & drop ── */
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileRef.current.files = dt.files;
    handleFile({ target: { files: dt.files } });
  };

  /* ── Upload ── */
  const handleUpload = async () => {
    if (rows.length === 0) return;
    setStep("uploading");
    try {
      const res = await onUpload(rows);
      setResults(res);
      setStep("done");
      if (res.some((r) => r.success)) onDone();
    } catch (e) {
      setResults([{ name: "Upload Batch", success: false, error: e.message }]);
      setStep("done");
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  const fileIconColor = fileType === "excel" ? "#16a34a" : "#0284c7";
  const fileIconBg = fileType === "excel" ? "#dcfce7" : "#e0f2fe";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>

      {/* ── Header ── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: "18px 24px 14px", borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2, display: "flex", alignItems: "center",
            justifyContent: "center", bgcolor: `${accent}18`, color: accent
          }}>
            <UploadFileIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary" }}>{title}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Upload a CSV or Excel spreadsheet to create multiple records instantly
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: "text.secondary", bgcolor: "background.default", borderRadius: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>

        {/* ── Step: idle ── */}
        {step === "idle" && (
          <Stack spacing={2.5}>

            {/* Template download */}
            <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
                Step 1 — Download the template
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                Required columns: <strong>{templateHeaders.join(", ")}</strong>
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                  onClick={downloadCSV}
                  sx={{
                    borderColor: "#0284c7", color: "#0284c7", fontWeight: 600,
                    textTransform: "none", borderRadius: 2, gap: 0.5
                  }}>
                  <TableChartIcon sx={{ fontSize: 15 }} /> CSV Template
                </Button>
                <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                  onClick={downloadExcel}
                  sx={{
                    borderColor: "#16a34a", color: "#16a34a", fontWeight: 600,
                    textTransform: "none", borderRadius: 2, gap: 0.5
                  }}>
                  <GridOnIcon sx={{ fontSize: 15 }} /> Excel Template
                </Button>
              </Stack>
            </Box>

            {/* File upload drop zone */}
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                p: 3, bgcolor: "background.default", borderRadius: 2, border: `2px dashed`, borderColor: "divider",
                "&:hover": { borderColor: accent, bgcolor: `${accent}08` },
                transition: "all 0.2s", textAlign: "center", cursor: "pointer"
              }}
              onClick={() => fileRef.current?.click()}
            >
              <UploadFileIcon sx={{ fontSize: 40, color: accent, mb: 1, opacity: 0.7 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
                Step 2 — Upload your filled spreadsheet
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                Drag & drop your file here, or click to browse
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Chip label=".csv" size="small" sx={{ bgcolor: "#e0f2fe", color: "#0284c7", fontWeight: 700 }} />
                <Chip label=".xlsx" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }} />
                <Chip label=".xls" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }} />
              </Stack>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                style={{ display: "none" }} onChange={handleFile} />
            </Box>
          </Stack>
        )}

        {/* ── Step: preview ── */}
        {step === "preview" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5,
                bgcolor: fileIconBg, borderRadius: 2
              }}>
                {fileType === "excel"
                  ? <GridOnIcon sx={{ fontSize: 16, color: fileIconColor }} />
                  : <TableChartIcon sx={{ fontSize: 16, color: fileIconColor }} />}
                <Typography variant="caption" sx={{ fontWeight: 700, color: fileIconColor }}>
                  {fileName}
                </Typography>
              </Box>
              <Chip label={`${rows.length} valid row${rows.length !== 1 ? "s" : ""}`} size="small"
                sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }} />
              {errors.length > 0 && (
                <Chip label={`${errors.length} skipped`} size="small"
                  sx={{ bgcolor: "#fee2e2", color: "#ef4444", fontWeight: 700 }} />
              )}
            </Box>

            {/* Structured Table for Skipped Rows & Validation Issues */}
            {errors.length > 0 && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: 3,
                  border: isDark ? "none" : "1px solid #fef08a",
                  bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fefce8",
                  "& .MuiAlert-icon": { color: isDark ? "warning.main" : "#ca8a04", mt: 0.5 }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? "warning.main" : "#854d0e", mb: 0.5 }}>
                  {errors.length} Row{errors.length > 1 ? "s" : ""} Will Be Skipped
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "text.secondary" : "#a16207", mb: 1.5, fontSize: "0.825rem" }}>
                  The items below contain validation errors or missing data. <strong>You can still proceed to upload all other valid rows</strong>, or fix these rows in your spreadsheet and upload again.
                </Typography>

                <Box
                  sx={{
                    maxHeight: 180,
                    overflowY: "auto",
                    bgcolor: isDark ? "background.paper" : "#fff",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: isDark ? "divider" : "#fef08a",
                    p: 1
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ "& th": { bgcolor: isDark ? "background.default" : "#fefefc", py: 0.75, fontWeight: 700, color: isDark ? "warning.main" : "#854d0e", fontSize: "0.72rem", borderBottom: "1px solid", borderBottomColor: isDark ? "divider" : "#fef08a" } }}>
                        <TableCell sx={{ width: 80 }}>Row #</TableCell>
                        <TableCell>Issue & How to Fix</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {errors.map((e, idx) => (
                        <TableRow key={idx} sx={{ "& td": { py: 0.75, fontSize: "0.78rem", borderBottom: idx === errors.length - 1 ? 0 : "1px solid", borderBottomColor: isDark ? "divider" : "#fef9c3" } }}>
                          <TableCell sx={{ fontWeight: 700, color: isDark ? "warning.main" : "#ca8a04" }}>
                            {e.row === 0 ? "Headers" : `Row ${e.row}`}
                          </TableCell>
                          <TableCell sx={{ color: isDark ? "text.primary" : "#713f12", fontWeight: 500 }}>
                            {e.msg}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Alert>
            )}

            {rows.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                  Previewing Valid Rows to Upload:
                </Typography>
                <TableContainer component={Paper} elevation={0}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: 240 }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{
                          fontWeight: 700, fontSize: "0.72rem", color: "text.secondary",
                          bgcolor: isDark ? "background.default" : "#fafafa", width: 40
                        }}>#</TableCell>
                        {templateHeaders.map((h) => (
                          <TableCell key={h} sx={{
                            fontWeight: 700, fontSize: "0.75rem",
                            textTransform: "uppercase", color: "text.secondary", bgcolor: isDark ? "background.default" : "#fafafa",
                            letterSpacing: "0.04em"
                          }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{i + 1}</TableCell>
                          {templateHeaders.map((h) => (
                            <TableCell key={h} sx={{ fontSize: "0.85rem", color: "text.primary" }}>
                              {String(row[h] ?? row[h.toLowerCase()] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {rows.length === 0 && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                No valid rows found to upload. Please review the skipped rows, adjust your spreadsheet, and try again.
              </Alert>
            )}
          </Stack>
        )}

        {/* ── Step: uploading ── */}
        {step === "uploading" && (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary", mb: 2.5 }}>
              Uploading {rows.length} record{rows.length !== 1 ? "s" : ""}…
            </Typography>
            <LinearProgress sx={{
              borderRadius: 2, height: 8, bgcolor: `${accent}22`,
              "& .MuiLinearProgress-bar": { bgcolor: accent }
            }} />
          </Box>
        )}

        {/* ── Step: done ── */}
        {step === "done" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 2 }}>
              {successCount > 0 && (
                <Box sx={{
                  flex: 1, p: 2.5, bgcolor: isDark ? "rgba(22, 163, 74, 0.15)" : "#f0fdf4", borderRadius: 2,
                  border: "1px solid", borderColor: isDark ? "rgba(22, 163, 74, 0.3)" : "#bbf7d0", textAlign: "center"
                }}>
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 36, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#16a34a" }}>{successCount}</Typography>
                  <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600 }}>
                    Successfully Uploaded
                  </Typography>
                </Box>
              )}
              {failCount > 0 && (
                <Box sx={{
                  flex: 1, p: 2.5, bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2", borderRadius: 2,
                  border: "1px solid", borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca", textAlign: "center"
                }}>
                  <ErrorIcon sx={{ color: "#ef4444", fontSize: 36, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#ef4444" }}>{failCount}</Typography>
                  <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600 }}>Failed Rows</Typography>
                </Box>
              )}
            </Box>

            {failCount > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? "error.main" : "#991b1b", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <ErrorIcon sx={{ color: "#ef4444", fontSize: 20 }} />
                  Failed to Save {failCount} Record{failCount > 1 ? "s" : ""}
                </Typography>
                <TableContainer component={Paper} elevation={0}
                  sx={{ border: "1px solid", borderColor: isDark ? "divider" : "#fee2e2", borderRadius: 3, maxHeight: 220, bgcolor: isDark ? "background.paper" : "#fffdfd" }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ "& th": { bgcolor: isDark ? "background.default" : "#fef2f2", fontWeight: 700, color: isDark ? "error.main" : "#991b1b" } }}>
                        <TableCell>Record Name</TableCell>
                        <TableCell sx={{ width: 120 }}>Status</TableCell>
                        <TableCell>Reason for Failure</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.filter((r) => !r.success).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>{r.name || "N/A"}</TableCell>
                          <TableCell>
                            <Chip label="Failed" size="small"
                              sx={{ bgcolor: "#fee2e2", color: "#ef4444", fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem", color: isDark ? "error.light" : "#7f1d1d", fontWeight: 500 }}>
                            {translateErrorMessage(r.error)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
        {step === "idle" && (
          <Button variant="outlined" onClick={handleClose}
            sx={{ color: "text.secondary", borderColor: "divider", textTransform: "none", borderRadius: 2 }}>
            Cancel
          </Button>
        )}
        {step === "preview" && (
          <>
            <Button variant="outlined" onClick={reset}
              sx={{ color: "text.secondary", borderColor: "divider", textTransform: "none", borderRadius: 2 }}>
              Re-upload
            </Button>
            <Button variant="contained" disabled={rows.length === 0} onClick={handleUpload}
              sx={{
                bgcolor: accent, "&:hover": { bgcolor: accent, filter: "brightness(0.9)" },
                color: "#fff", fontWeight: 600, textTransform: "none", borderRadius: 2, boxShadow: "none"
              }}>
              Upload {rows.length} Record{rows.length !== 1 ? "s" : ""}
            </Button>
          </>
        )}
        {step === "done" && (
          <Button variant="contained" onClick={handleClose}
            sx={{
              bgcolor: accent, "&:hover": { bgcolor: accent, filter: "brightness(0.9)" },
              color: "#fff", fontWeight: 600, textTransform: "none", borderRadius: 2, boxShadow: "none"
            }}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadModal;
