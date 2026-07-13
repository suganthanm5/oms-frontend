import { Box, Typography, CircularProgress, keyframes } from "@mui/material";

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(125, 42, 232, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(125, 42, 232, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(125, 42, 232, 0); }
`;

const PageLoader = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(125,42,232,0.1), rgba(125,42,232,0.02))",
            animation: `${pulse} 2s infinite`,
          }}
        />
        <CircularProgress
          size={55}
          thickness={4.5}
          sx={{
            color: "#7d2ae8",
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 35,
            height: 35,
            borderRadius: "50%",
            bgcolor: "background.paper",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "#7d2ae8", fontSize: "1.1rem", fontFamily: "inherit" }}>
            O
          </Typography>
        </Box>
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          fontFamily: "inherit",
          letterSpacing: 2,
          textTransform: "uppercase",
          fontSize: "0.75rem",
          animation: "pulse 2s infinite ease-in-out",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 0.6 },
            "50%": { opacity: 1 }
          }
        }}
      >
        Loading System
      </Typography>
    </Box>
  );
};

export default PageLoader;
