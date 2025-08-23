/**
 * TreadKing Color Palette
 * Modern Black & Red theme for premium fitness app experience
 */

export const Colors = {
  // Primary Brand Colors (Black theme)
  primary: '#1F2937',        // Main dark gray/black
  primaryLight: '#374151',   // Lighter gray for variations
  primaryDark: '#111827',    // Deep black for strong contrast
  
  // Accent Colors (Red theme)
  accent: '#DC2626',         // Main red accent - not too bright
  accentLight: '#EF4444',    // Lighter red for hover states
  accentDark: '#B91C1C',     // Darker red for active states
  accentSoft: '#FEE2E2',     // Very light red for backgrounds
  
  // Secondary Colors
  secondary: '#6B7280',      // Medium gray
  secondaryLight: '#9CA3AF', // Light gray
  secondaryDark: '#4B5563',  // Dark gray
  
  // Status Colors (consistent with theme)
  success: '#059669',        // Dark green
  successLight: '#10B981',   // Lighter green
  successSoft: '#D1FAE5',    // Light green background
  
  warning: '#D97706',        // Dark orange
  warningLight: '#F59E0B',   // Lighter orange
  warningSoft: '#FEF3C7',    // Light orange background
  
  error: '#DC2626',          // Use accent red for errors
  errorLight: '#EF4444',     // Lighter error red
  errorSoft: '#FEE2E2',      // Light error background
  
  info: '#0891B2',          // Dark cyan
  infoLight: '#06B6D4',     // Lighter cyan
  infoSoft: '#CFFAFE',      // Light cyan background
  
  // Background Colors
  background: '#FFFFFF',         // Main white background
  backgroundSecondary: '#F9FAFB', // Light gray background
  backgroundTertiary: '#F3F4F6',  // Slightly darker gray
  
  // Surface Colors (for cards, modals, etc.)
  surface: '#FFFFFF',        // White surface
  surfaceSecondary: '#F9FAFB', // Light gray surface
  surfaceDark: '#1F2937',    // Dark surface for contrast
  surfaceElevated: '#FFFFFF', // Elevated white surface (with shadow)
  
  // Text Colors
  textPrimary: '#111827',    // Main black text
  textSecondary: '#6B7280',  // Gray text for secondary content
  textTertiary: '#9CA3AF',   // Light gray for tertiary content
  textDisabled: '#D1D5DB',   // Disabled text
  textOnDark: '#FFFFFF',     // White text on dark backgrounds
  textOnAccent: '#FFFFFF',   // White text on red accent
  textOnPrimary: '#FFFFFF',  // White text on primary black
  
  // Border & Divider Colors
  border: '#E5E7EB',         // Standard border
  borderLight: '#F3F4F6',    // Light border
  borderDark: '#D1D5DB',     // Darker border
  divider: '#F3F4F6',        // Divider lines
  
  // Interactive States
  hover: '#F9FAFB',          // Hover background
  pressed: '#F3F4F6',        // Pressed state background
  focus: '#DC2626',          // Focus border (accent red)
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',      // Dark overlay
  overlayLight: 'rgba(0, 0, 0, 0.3)',  // Light dark overlay
  overlayAccent: 'rgba(220, 38, 38, 0.1)', // Red overlay
  
  // Gradient Definitions
  gradients: {
    primary: ['#1F2937', '#111827'],           // Dark gradient
    primaryReverse: ['#111827', '#1F2937'],    // Reverse dark gradient
    accent: ['#DC2626', '#B91C1C'],            // Red gradient
    accentSoft: ['#EF4444', '#DC2626'],        // Soft red gradient
    neutral: ['#6B7280', '#4B5563'],           // Gray gradient
    surface: ['#FFFFFF', '#F9FAFB'],           // Light gradient
    success: ['#059669', '#047857'],           // Green gradient
    warning: ['#D97706', '#B45309'],           // Orange gradient
  },
  
  // Semantic Colors for specific use cases
  workout: {
    active: '#DC2626',       // Active workout red
    completed: '#059669',    // Completed workout green
    scheduled: '#6B7280',    // Scheduled workout gray
    rest: '#F3F4F6',        // Rest day light gray
  },
  
  progress: {
    background: '#F3F4F6',   // Progress bar background
    fill: '#DC2626',         // Progress bar fill (red)
    text: '#111827',         // Progress text
  },
  
  navigation: {
    active: '#DC2626',       // Active nav item (red)
    inactive: '#6B7280',     // Inactive nav item (gray)
    background: '#FFFFFF',   // Nav background
    border: '#F3F4F6',      // Nav border
  },
} as const;

// Type for better TypeScript support
export type ColorKeys = keyof typeof Colors;
export type GradientKeys = keyof typeof Colors.gradients;

// Helper functions for common color operations
export const getGradientColors = (gradientKey: GradientKeys): string[] => {
  return Colors.gradients[gradientKey];
};

export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba with opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default Colors;