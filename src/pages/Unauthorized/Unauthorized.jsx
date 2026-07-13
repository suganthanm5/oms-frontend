import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { LockRounded, ArrowBackRounded } from "@mui/icons-material";
import "./Unauthorized.css";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box className="unauth-root">
      <Box className="unauth-card">

        <Box className="unauth-icon">
          <LockRounded sx={{ fontSize: 38, color: "#7d2ae8" }} />
        </Box>

        <Typography className="unauth-title">Access Denied</Typography>

        <Typography className="unauth-desc">
          You don't have permission to view this page.
          Please contact your administrator to get the required access.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/dashboard")}
          startIcon={<ArrowBackRounded />}
          sx={{ borderRadius: "50px", textTransform: "none", boxShadow: "none" }}
        >
          Back to Dashboard
        </Button>

      </Box>
    </Box>
  );
};

export default Unauthorized;
