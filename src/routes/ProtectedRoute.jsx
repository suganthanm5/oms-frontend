import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Box } from "@mui/material";
import { getCookie } from "../utils/cookieUtils";

const ProtectedRoute = ({ children, roles }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  const token = getCookie("token");
  const storedRole = getCookie("role");


  const stillInitializing = isLoading || (!user && !!token);

  if (stillInitializing) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <CircularProgress sx={{ color: "#4f46e5" }} />
      </Box>
    );
  }


  if (!token || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }


  if (!roles || roles.length === 0) {
    return children;
  }

  const activeRole = (role || storedRole || "")
    .toString()
    .toUpperCase()
    .replace("ROLE_", "")
    .trim();

  const allowed = roles.map((r) =>
    r.toString().toUpperCase().replace("ROLE_", "").trim()
  );

  const hasAccess = allowed.includes(activeRole);


  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
