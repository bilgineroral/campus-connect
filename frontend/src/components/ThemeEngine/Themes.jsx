//TODO will fill this as necessary
export const colors = {
  white: "#FFFFFF",
  darkerWhite: "#C2C2C2",
  black: "#000000",
  lighterBlack: "#0A0A0A",
  green: "#66BB6A",
  lighterGreen: "#81C784",
  red: "#D32F2F",
  "LostFound": "#3DAEE9",
  "Secondhand Sales": "#F67400",
  "Donation": "#DD00DD",
  "Borrowing": "#D4AC0D",
};

export const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      ...(mode === "dark" ? {
        primary: {
          dark: "#00CAFE",
          main: "#3DAEE9",
          light: "#051923"
        },
        neutral: {
          dark: colors.white,
          main: colors.darkerWhite,
          light: "#666666"
        },
        background: {
          default: colors.black,
          alt: "#0A0A0A"
        }
      } : {
        primary: {
          dark: "#051923",
          main: "#3DAEE9",
          light: "#33DDFB"
        },
        neutral: {
          dark: colors.black,
          main: colors.lighterBlack,
          light: "#39393D"
        },
        background: {
          default: "#F0F0F0",
          alt: colors.white
        }
      }),
      error: {
        dark: colors.red,
        main: "#F44336",
        light: "#E57373"
      },
      success: {
        dark: "#388E3C",
        main: colors.green,
        light: colors.lighterGreen
      },
      warning: {
        dark: "#F57C00",
        main: "#FFA726",
        light: "#FFB74D"
      }
    },
    typography: {
      fontFamily: "Ubuntu, sans-serif",
      fontSize: 14,
      h1: {
        fontFamily: "Ubuntu, sans-serif",
        fontWeight: "500",
        fontSize: 40
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            "& ::-webkit-scrollbar": {
              width: "0.2rem",
            },
            "& ::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "dark" ? colors.darkerWhite : colors.lighterBlack,
              borderRadius: "10px",
            }
          }
        }
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            fill: mode === "dark" ? colors.white : colors.black
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? colors.black : colors.white,
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))"
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
              display: 'none',
            },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
          },
        },
      },
    },
  };
};
