// High contrast theme colors
export const highContrastColors = {
  primary: '#0000FF',
  secondary: '#FF0000',
  background: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#000000',
  subtext: '#000000',
  border: '#000000',
  success: '#006600',
  error: '#FF0000',
  shadow: 'rgba(0, 0, 0, 0.8)',
};

export const colors = {
  primary: "#5B7FFF", // Soft blue
  secondary: "#FF9D7A", // Soft coral
  background: "#FFFFFF",
  card: "#F8F9FA",
  surface: "#F5F5F5", // Light gray surface color
  text: "#1A1A1A",
  subtext: "#6E7A8A",
  border: "#E5E9EF",
  success: "#4CAF50",
  error: "#F44336",
  shadow: "rgba(0, 0, 0, 0.05)",
};

// Function to get appropriate colors based on accessibility settings
export const getThemeColors = (isHighContrast: boolean = false) => {
  return isHighContrast ? highContrastColors : colors;
};