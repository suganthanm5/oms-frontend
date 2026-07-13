import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Typography, Button, ButtonBase, IconButton, InputBase, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, Tooltip, CircularProgress,
  Snackbar, Alert, Chip, Paper, Grid, Stack, Pagination, FormHelperText, useTheme, Divider
} from "@mui/material";
import {
  PersonAddRounded, SearchRounded, EditRounded,
  DeleteRounded, PeopleRounded, AdminPanelSettingsRounded,
  ManageAccountsRounded, PersonRounded, CloseRounded,
  CheckRounded, SwitchAccountRounded, ArrowBackRounded,
} from "@mui/icons-material";
import { userService } from "../../services/userService";
import { outletService } from "../../services/outletService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import PageHeader from "../../components/common/PageHeader";
import { formatUserData } from "../../utils/exportUtils";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "./UserManagement.css";


const ROLE_META = {
  ADMIN: { label: "Admin", cls: "admin", color: "#7d2ae8", bg: "#f3e8ff", Icon: AdminPanelSettingsRounded },
  MANAGER: { label: "Manager", cls: "manager", color: "#0284c7", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  OUTLET_MANAGER: { label: "Outlet Manager", cls: "manager", color: "#0ea5e9", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  USER: { label: "User", cls: "user", color: "#16a34a", bg: "#dcfce7", Icon: PersonRounded },
};

const getRoleMeta = (role, isDark) => {
  const meta = ROLE_META[role] || ROLE_META.USER;
  if (isDark) {
    if (role === "ADMIN") return { ...meta, bg: "rgba(125, 42, 232, 0.2)", color: "#c084fc" };
    if (role === "MANAGER") return { ...meta, bg: "rgba(2, 132, 199, 0.2)", color: "#60a5fa" };
    if (role === "OUTLET_MANAGER") return { ...meta, bg: "rgba(14, 165, 233, 0.2)", color: "#38bdf8" };
    return { ...meta, bg: "rgba(22, 163, 74, 0.2)", color: "#4ade80" };
  }
  return meta;
};

const ROLES = ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"];


const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

const emptyForm = { name: "", username: "", email: "", password: "", roles: ["USER"], status: "ACTIVE", outletId: "" };

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, impersonate } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('userPageSize') || '10', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [dialog, setDialog] = useState({ open: false, mode: "add", data: emptyForm });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, name: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [formErrors, setFormErrors] = useState({});


  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers(page - 1, pageSize, search, signal);
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      load(controller.signal);
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load]);

  useEffect(() => {
    outletService.getAll(0, 1000).then(data => setOutlets(data.content || []));
  }, []);

  const filtered = users; // Backend handles filtering


  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});


  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });


  const handleSave = async () => {
    const { mode, data } = dialog;
    setFormErrors({});
    try {
      if (mode === "add") {
        await userService.createUser(data);
        toast("User created successfully");
      } else {
        await userService.updateUser(data.id, data);
        toast("User updated successfully");
      }
      setDialog({ open: false, mode: "add", data: emptyForm });
      setIsFormView(false);
      load();
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      const errorData = err.response?.data?.data;

      if (errorData && typeof errorData === 'object') {
        setFormErrors(errorData);
      } else {
        const msg = err.response?.data?.message || "Operation failed";
        toast(msg, "error");
      }
    }
  };


  const handleDelete = async () => {
    try {
      await userService.deleteUser(delDialog.id);
      toast("User deleted");
      setDelDialog({ open: false, id: null, name: "" });
      load();
    } catch {
      toast("Delete failed", "error");
    }
  };

  const handleImpersonate = async (targetUser) => {
    try {
      const response = await userService.impersonateUser(targetUser.id);
      if (response && response.token) {
        impersonate(response, response.token);
        toast(`Successfully logged in as ${targetUser.name || targetUser.username}`);
        navigate("/dashboard");
      } else {
        toast("Invalid token received from server", "error");
      }
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || err.message || "Impersonation failed", "error");
    }
  };


  return (
    <Box className="user-mgmt-page">
      {/* Header */}
      <PageHeader
        title={<TypingText text="User Management" />}
        subtitle="Manage users and their roles"
        action={
          !isFormView && (
            <Button variant="contained" color="primary" startIcon={<PersonAddRounded />}
              onClick={() => { setFormErrors({}); setDialog({ open: true, mode: "add", data: emptyForm }); setIsFormView(true); }}
              sx={{ borderRadius: 2 }}
            >
              Add User
            </Button>
          )
        }
      />

      {isFormView ? (
        <Box className="animate-fade-in" sx={{ px: { xs: 0, md: 4 }, py: 3 }}>
          {/* Enterprise Top Header Area */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }}
                sx={{ bgcolor: 'background.paper', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.05)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' } }}
              >
                <ArrowBackRounded sx={{ color: 'text.primary' }} />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'inherit', color: 'text.primary', letterSpacing: -0.5 }}>
                  {dialog.mode === "add" ? "Create New User" : "Edit User Profile"}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'inherit' }}>
                  {dialog.mode === "add" ? "Fill out the fields below to add a new member to the system." : `Currently editing details for @${dialog.data.username || 'user'}`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }} variant="outlined" color="inherit" sx={{ fontWeight: 600, borderRadius: 2, px: 3, borderColor: 'divider' }}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained" sx={{ bgcolor: dialog.mode === "add" ? "#10b981" : "#7d2ae8", "&:hover": { bgcolor: dialog.mode === "add" ? "#059669" : "#6b21a8" }, fontWeight: 700, borderRadius: 2, px: 3, boxShadow: 'none' }} startIcon={dialog.mode === "add" ? <PersonAddRounded /> : <CheckRounded />}>
                {dialog.mode === "add" ? "Save User" : "Save Changes"}
              </Button>
            </Box>
          </Box>

          {/* Form Content Structure */}
          <Grid container spacing={4}>
            {/* Main Form Fields */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, color: 'text.primary', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonRounded sx={{ color: dialog.mode === 'add' ? '#10b981' : '#7d2ae8' }} />
                  Account Details
                </Typography>

                <Stack spacing={3.5}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Full Name" placeholder="Enter full name" value={dialog.data.name}
                        onChange={(e) => {
                          setDialog((d) => ({ ...d, data: { ...d.data, name: e.target.value } }));
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                        }}
                        error={!!formErrors.name} helperText={formErrors.name}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Username" placeholder="Enter username" value={dialog.data.username}
                        onChange={(e) => {
                          setDialog((d) => ({ ...d, data: { ...d.data, username: e.target.value } }));
                          if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: null }));
                        }}
                        error={!!formErrors.username} helperText={formErrors.username}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>

                  <TextField fullWidth label="Email Address" type="email" placeholder="Enter email" value={dialog.data.email}
                    onChange={(e) => {
                      setDialog((d) => ({ ...d, data: { ...d.data, email: e.target.value } }));
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                    }}
                    error={!!formErrors.email} helperText={formErrors.email}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  {dialog.mode === "add" && (
                    <TextField fullWidth label="Password" type="password" placeholder="Enter password" value={dialog.data.password}
                      onChange={(e) => {
                        setDialog((d) => ({ ...d, data: { ...d.data, password: e.target.value } }));
                        if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: null }));
                      }}
                      error={!!formErrors.password} helperText={formErrors.password}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Sidebar / Permissions */}
            <Grid item xs={12} md={4}>
              <Stack spacing={4}>
                <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, color: 'text.primary', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AdminPanelSettingsRounded sx={{ color: dialog.mode === 'add' ? '#10b981' : '#7d2ae8' }} />
                    Access & Roles
                  </Typography>

                  <Stack spacing={3.5}>
                    <FormControl fullWidth error={!!(formErrors.role || formErrors.roles)}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>USER ROLE</Typography>
                      <Select
                        displayEmpty
                        value={dialog.data.role || "USER"}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setDialog((d) => ({
                            ...d,
                            data: {
                              ...d.data,
                              role: newRole,
                              ...((newRole === "ADMIN" || newRole === "MANAGER") ? { outletId: "" } : {})
                            }
                          }));
                          if (formErrors.role || formErrors.roles) setFormErrors((prev) => ({ ...prev, role: null, roles: null }));
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r} sx={{ fontFamily: "inherit" }}>
                            {ROLE_META[r].label}
                          </MenuItem>
                        ))}
                      </Select>
                      {(formErrors.role || formErrors.roles) && (
                        <FormHelperText>{formErrors.role || formErrors.roles}</FormHelperText>
                      )}
                    </FormControl>

                    <FormControl fullWidth disabled={dialog.data.role === "ADMIN" || dialog.data.role === "MANAGER"}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>ASSIGNED OUTLET</Typography>
                      <Select
                        value={dialog.data.outletId || ""}
                        onChange={(e) => {
                          const newOutletId = e.target.value;
                          setDialog((d) => ({
                            ...d,
                            data: {
                              ...d.data,
                              outletId: newOutletId,
                              role: newOutletId && (d.data.role === "USER" || d.data.role === "OUTLET_MANAGER") ? "OUTLET_MANAGER" : (d.data.role || "USER")
                            }
                          }));
                        }}
                        displayEmpty
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="" sx={{ fontFamily: "inherit", fontStyle: "italic", color: "#94a3b8" }}>No Outlet Assigned</MenuItem>
                        {outlets.map((ot) => (
                          <MenuItem key={ot.id} value={ot.id} sx={{ fontFamily: "inherit" }}>
                            {ot.outletName || ot.name || ot.id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>

                {/* Avatar Display / Status preview */}
                <Paper sx={{ p: 4, borderRadius: 4, bgcolor: dialog.mode === 'add' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(125, 42, 232, 0.04)', boxShadow: 'none', border: '1px dashed', borderColor: dialog.mode === 'add' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(125, 42, 232, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ width: 80, height: 80, mb: 2, background: dialog.mode === 'add' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #7d2ae8, #a855f7)', fontSize: '2rem', fontWeight: 700 }}>
                    {initials(dialog.data.name || dialog.data.username)}
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontFamily: 'inherit' }}>
                    {dialog.data.name || "User Preview"}
                  </Typography>
                  <Chip
                    size="small"
                    label={ROLE_META[dialog.data.role || "USER"]?.label}
                    sx={{ mt: 1, bgcolor: getRoleMeta(dialog.data.role || "USER", isDark).bg, color: getRoleMeta(dialog.data.role || "USER", isDark).color, fontWeight: 700, fontFamily: "inherit", borderRadius: 2 }}
                  />
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <>
          {/* Stat Cards */}
          <Box className="stat-cards-row">
            <Box className="stat-card stat-indigo">
              <Box className="stat-card-icon" sx={{ background: isDark ? "rgba(125, 42, 232, 0.2)" : "#f5f0ff" }}>
                <PeopleRounded sx={{ color: isDark ? "#c084fc" : "#7d2ae8", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography className="stat-card-value">{users.length}</Typography>
                <Typography className="stat-card-label">Total Users</Typography>
              </Box>
            </Box>
            {ROLES.map((r) => {
              const meta = getRoleMeta(r, isDark);
              const theme = r === "ADMIN" ? "purple" : r === "MANAGER" ? "blue" : "green";
              return (
                <Box className={`stat-card stat-${theme}`} key={r}>
                  <Box className="stat-card-icon" sx={{ background: meta.bg }}>
                    <meta.Icon sx={{ color: meta.color, fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography className="stat-card-value">{counts[r] || 0}</Typography>
                    <Typography className="stat-card-label">{meta.label}s</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Table */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Typography sx={{ fontWeight: 700, color: "text.primary", fontFamily: "inherit" }}>
                All Users
              </Typography>
              <ExportMenu getData={() => formatUserData(filtered)} filename="users" title="User Report" backendType="users" />
              <Box className="table-search">
                <SearchRounded sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                <InputBase
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "inherit", color: "text.primary" }}
                />
              </Box>
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    {["User", "Username", "Email", "Role", "Assigned Outlet", "Actions"].map((h) => (
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
                        <CircularProgress sx={{ color: "#7d2ae8" }} size={32} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "inherit" }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => {
                      const meta = ROLE_META[u.role] || ROLE_META.USER;
                      return (
                        <TableRow key={u.id} hover sx={{ "&:hover": { background: "action.hover" } }}>
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, background: `linear-gradient(135deg, ${meta.color}, #a855f7)`, fontSize: "0.8rem", fontWeight: 700 }}>
                                {initials(u.name || u.username)}
                              </Avatar>
                              <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.875rem", fontFamily: "inherit" }}>
                                {u.name || u.username}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{u.username}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.875rem", fontFamily: "inherit" }}>{u.email}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={meta.label}
                                sx={{ bgcolor: getRoleMeta(u.role, isDark).bg, color: getRoleMeta(u.role, isDark).color, fontWeight: 600, fontFamily: "inherit", borderRadius: "8px" }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const isGlobalRole = u.role === "ADMIN" || u.role === "MANAGER";
                              if (isGlobalRole) {
                                return (
                                  <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "inherit" }}>
                                    Not Applicable
                                  </Typography>
                                );
                              }

                              const outletName = u.outletName || u.outlet?.outletName || u.outlet?.name || (u.outletId ? outlets.find(o => String(o.id) === String(u.outletId))?.outletName || outlets.find(o => String(o.id) === String(u.outletId))?.name : null);
                              return outletName && outletName !== "—" ? (
                                <Chip
                                  size="small"
                                  label={outletName}
                                  sx={{
                                    bgcolor: "background.default",
                                    color: "text.primary",
                                    fontWeight: 600,
                                    fontFamily: "inherit",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    borderColor: "divider"
                                  }}
                                />
                              ) : (
                                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "inherit" }}>
                                  Not Assigned
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="Edit user">
                                <IconButton
                                  size="small"
                                  onClick={() => { setFormErrors({}); setDialog({ open: true, mode: "edit", data: { ...u } }); setIsFormView(true); }}
                                  sx={{ color: "#f59e0b", background: "#fef3c7", "&:hover": { background: "#fde68a" } }}
                                >
                                  <EditRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete user">
                                <IconButton
                                  size="small"
                                  onClick={() => setDelDialog({ open: true, id: u.id, name: u.name || u.username })}
                                  sx={{ color: "#ef4444", background: "#fee2e2", "&:hover": { background: "#fecaca" } }}
                                >
                                  <DeleteRounded sx={{ fontSize: 16 }} />
                                </IconButton>
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
          </Box>
          {/* Pagination */}
          {!loading && totalElements > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Showing <strong>{totalElements === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)}</strong> of <strong>{totalElements}</strong> entries
              </Typography>
              <Pagination
                count={totalPages} page={page} onChange={(_, v) => setPage(v)}
                shape="rounded" size="small"
                sx={{
                  "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600, fontFamily: "inherit" },
                  "& .Mui-selected": { bgcolor: "#7d2ae8 !important", color: "#fff" },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null, name: "" })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "text.primary" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "inherit", color: "text.secondary", fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{delDialog.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDelDialog({ open: false, id: null, name: "" })}
            sx={{ borderRadius: 2, color: "text.secondary", borderColor: "divider" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ borderRadius: 2, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "inherit" }}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default UserManagement;

