import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Grid,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

/**
 * Reusable Form Header component. Includes cancel/save buttons and loading states.
 */
export const FormHeader = ({
  title,
  subtitle,
  onClose,
  onSave,
  saving = false,
  saveDisabled = false,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
  saveIcon,
  cancelIcon,
  colorAccent = "primary",
}) => {
  return (
    <Box
      sx={{
        p: 3,
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#fafafa"),
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
            <CloseRoundedIcon />
          </IconButton>
        )}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "flex-end" }}>
        {onClose && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            startIcon={cancelIcon}
            sx={{ fontWeight: 600 }}
          >
            {cancelLabel}
          </Button>
        )}
        {onSave && (
          <Button
            variant="contained"
            color={colorAccent}
            disabled={saving || saveDisabled}
            onClick={onSave}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : saveIcon}
            sx={{ fontWeight: 700 }}
          >
            {saving ? "Saving…" : saveLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

/**
 * Reusable Section Header for grouping form elements with dynamic gradient lines.
 */
export const FormSectionHeader = ({ title, color = "#7d2ae8", icon: Icon }) => {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        color: "text.primary",
        mb: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        fontSize: "0.85rem",
        textTransform: "none",
        letterSpacing: "normal",
      }}
    >
      <Box
        sx={{
          width: 4,
          height: 18,
          background: color,
          borderRadius: 1,
        }}
      />
      {Icon && <Icon sx={{ fontSize: 18, color: color }} />}
      {title}
    </Typography>
  );
};

/**
 * Reusable Form container layout providing consistent card frames and animation entries.
 */
export const FormContainer = ({ children, sx = {} }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};
