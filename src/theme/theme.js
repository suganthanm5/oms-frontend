import { createTheme } from "@mui/material/styles";

export const getTheme = () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  const themeColor = localStorage.getItem("themeColor") || "Purple";
  const compactMode = localStorage.getItem("compactMode") === "true";
  const fontSizePref = localStorage.getItem("fontSize") || "Medium";

  let primaryMain = "#7c3aed"; // Rich Purple/Violet
  let primaryLight = "#a855f7"; // Vibrant Amethyst Purple
  let primaryDark = "#5b21b6"; // Deep Imperial Purple

  if (themeColor === "Blue") {
    primaryMain = "#2563eb";
    primaryLight = "#60a5fa";
    primaryDark = "#1e40af";
  } else if (themeColor === "Green") {
    primaryMain = "#10b981";
    primaryLight = "#34d399";
    primaryDark = "#047857";
  } else if (themeColor === "Orange") {
    primaryMain = "#f59e0b";
    primaryLight = "#fbbf24";
    primaryDark = "#b45309";
  } else if (themeColor === "Red") {
    primaryMain = "#ef4444";
    primaryLight = "#f87171";
    primaryDark = "#b91c1c";
  } else if (themeColor === "Pink") {
    primaryMain = "#ec4899";
    primaryLight = "#f472b6";
    primaryDark = "#be185d";
  } else if (themeColor === "Violet") {
    primaryMain = "#8b5cf6";
    primaryLight = "#a78bfa";
    primaryDark = "#6d28d9";
  }

  let htmlFontSize = 16;
  if (fontSizePref === "Small") htmlFontSize = 14;
  if (fontSizePref === "Large") htmlFontSize = 18;

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: primaryMain,
        light: primaryLight,
        dark: primaryDark,
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#0f172a" : "#f8fafc",
        paper: isDark ? "#1e293b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f1f5f9" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
      },
      divider: isDark ? "rgba(255,255,255,0.12)" : "rgba(226, 232, 240, 0.8)",
    },
    typography: {
      htmlFontSize,
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" },
      subtitle1: { fontSize: "0.875rem", fontWeight: 600 },
      subtitle2: { fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
      body1: { fontSize: "0.875rem" },
      body2: { fontSize: "0.8125rem", fontWeight: 500 },
      caption: { fontSize: "0.75rem", fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
    },
    shape: {
      borderRadius: compactMode ? 8 : 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          html {
            font-size: ${htmlFontSize}px !important;
          }
          body {
            background-color: ${isDark ? "#0f172a" : "#f8fafc"};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            min-height: 100vh;
          }
        `,
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: compactMode ? 12 : 20,
            boxShadow: isDark ? "0 4px 20px -2px rgba(0, 0, 0, 0.3)" : "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(226, 232, 240, 0.8)"}`,
            transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiTable: {
        defaultProps: {
          size: compactMode ? "small" : "medium",
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: compactMode ? "8px 16px" : "16px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(226, 232, 240, 0.8)"}`,
            "@media (max-width: 600px)": {
              padding: "10px 8px",
              fontSize: "0.8rem",
            }
          },
          head: {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#94a3b8" : "#475569",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderBottom: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(226, 232, 240, 0.8)"}`,
            "@media (max-width: 600px)": {
              fontSize: "0.7rem",
              padding: "10px 8px",
              letterSpacing: "0.04em",
            }
          }
        }
      },
      MuiButton: {
        defaultProps: {
          size: "small",
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            padding: "6px 14px",
            fontSize: "0.8125rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "none",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-1.5px)",
            },
          },
          contained: {
            color: "#ffffff",
            fontWeight: 700,
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryMain} 100%)`,
            boxShadow: `0 4px 12px ${primaryMain}30`,
            "&:hover": {
              background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryMain} 100%)`,
              boxShadow: `0 6px 18px ${primaryMain}45`,
              filter: "brightness(1.05)",
            }
          },
          containedSecondary: {
            background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
            boxShadow: "0 4px 12px rgba(219, 39, 119, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
              boxShadow: "0 6px 18px rgba(219, 39, 119, 0.45)",
              filter: "brightness(1.05)",
            }
          },
          containedSuccess: {
            background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
              boxShadow: "0 6px 18px rgba(5, 150, 105, 0.45)",
              filter: "brightness(1.05)",
            }
          },
          containedError: {
            background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
              boxShadow: "0 6px 18px rgba(220, 38, 38, 0.45)",
              filter: "brightness(1.05)",
            }
          },
          containedWarning: {
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
              boxShadow: "0 6px 18px rgba(217, 119, 6, 0.45)",
              filter: "brightness(1.05)",
            }
          },
          containedInfo: {
            background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
              boxShadow: "0 6px 18px rgba(2, 132, 199, 0.45)",
              filter: "brightness(1.05)",
            }
          },
          outlinedPrimary: {
            borderWidth: "1.5px",
            borderColor: `${primaryMain}60`,
            color: primaryMain,
            "&:hover": {
              borderWidth: "1.5px",
              background: `${primaryMain}0d`,
              borderColor: primaryMain,
            }
          }
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: "none",
            background: isDark ? "#0f172a" : `linear-gradient(180deg, #0f172a 0%, ${primaryDark} 100%)`,
            color: "#ffffff",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: 8,
            margin: "4px 8px",
            padding: "8px 16px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
            }
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: "4px 12px",
            padding: "10px 16px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc",
            }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: compactMode ? 12 : 20,
            minWidth: 520,
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "11.5px",
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          size: "small",
          variant: "outlined",
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: compactMode ? 8 : 10,
            backgroundColor: isDark ? "#0f172a" : "#f8fafc",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
              borderWidth: "1.5px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryLight,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryMain,
              borderWidth: "2px",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${primaryMain}20`,
            },
          },
          input: {
            padding: "10px 14px",
            fontSize: "0.85rem",
            fontWeight: 500,
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "0.85rem",
            fontWeight: 600,
            color: isDark ? "#94a3b8" : "#64748b",
            "&.Mui-focused": {
              color: primaryMain,
              fontWeight: 700,
            }
          },
          shrink: {
            transform: "translate(14px, -7px) scale(0.75)",
          }
        }
      },
      MuiSelect: {
        defaultProps: {
          size: "small",
        },
        styleOverrides: {
          root: {
            borderRadius: compactMode ? 8 : 10,
            backgroundColor: isDark ? "#0f172a" : "#f8fafc",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
              borderWidth: "1.5px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryLight,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryMain,
              borderWidth: "2px",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${primaryMain}20`,
            },
          },
          select: {
            padding: "10px 14px",
            fontSize: "0.85rem",
            fontWeight: 500,
          }
        }
      }
    },
  });
};

const defaultTheme = getTheme();
export default defaultTheme;

