import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from './colors';

/**
 * Common styles and utilities for TreadKing
 * Black & Red theme styling system
 */

// Common gradient configurations for LinearGradient
export const Gradients = {
  primary: {
    colors: Colors.gradients.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accent: {
    colors: Colors.gradients.accent,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accentSoft: {
    colors: Colors.gradients.accentSoft,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  neutral: {
    colors: Colors.gradients.neutral,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  surface: {
    colors: Colors.gradients.surface,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

// Common shadow styles
export const Shadows = {
  small: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

// Border radius system
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
};

// Typography scales
export const Typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: Colors.textTertiary,
    lineHeight: 14,
  },
};

// Common component styles
export const CommonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  
  // Headers
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  headerTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
  },
  headerTitleDark: {
    ...Typography.h5,
    color: Colors.textOnDark,
  },
  
  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  cardElevated: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  cardDark: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  buttonAccent: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.accent,
  },
  buttonSecondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.label,
    color: Colors.textOnDark,
  },
  buttonTextAccent: {
    ...Typography.label,
    color: Colors.textOnAccent,
  },
  buttonTextSecondary: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  
  // Inputs
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  inputFocused: {
    borderColor: Colors.accent,
    ...Shadows.small,
  },
  inputError: {
    borderColor: Colors.error,
  },
  
  // Sections
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h5,
    marginBottom: Spacing.md,
  },
  
  // Lists
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  
  // Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.navigation.background,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.navigation.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  navLabel: {
    ...Typography.captionSmall,
    color: Colors.navigation.inactive,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  navLabelActive: {
    ...Typography.captionSmall,
    color: Colors.navigation.active,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  
  // Progress
  progressBar: {
    height: 6,
    backgroundColor: Colors.progress.background,
    borderRadius: BorderRadius.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progress.fill,
    borderRadius: BorderRadius.xs,
  },
  
  // Avatars
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.label,
    color: Colors.textOnDark,
  },
  avatarTextLarge: {
    ...Typography.h6,
    color: Colors.textOnDark,
  },
  
  // Utility classes
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Spacing utilities
  marginTopXS: { marginTop: Spacing.xs },
  marginTopSM: { marginTop: Spacing.sm },
  marginTopMD: { marginTop: Spacing.md },
  marginTopLG: { marginTop: Spacing.lg },
  marginTopXL: { marginTop: Spacing.xl },
  marginTopXXL: { marginTop: Spacing.xxl },
  
  paddingXS: { padding: Spacing.xs },
  paddingSM: { padding: Spacing.sm },
  paddingMD: { padding: Spacing.md },
  paddingLG: { padding: Spacing.lg },
  paddingXL: { padding: Spacing.xl },
  paddingXXL: { padding: Spacing.xxl },
  
  paddingHorizontalXS: { paddingHorizontal: Spacing.xs },
  paddingHorizontalSM: { paddingHorizontal: Spacing.sm },
  paddingHorizontalMD: { paddingHorizontal: Spacing.md },
  paddingHorizontalLG: { paddingHorizontal: Spacing.lg },
  paddingHorizontalXL: { paddingHorizontal: Spacing.xl },
  paddingHorizontalXXL: { paddingHorizontal: Spacing.xxl },
  
  paddingVerticalXS: { paddingVertical: Spacing.xs },
  paddingVerticalSM: { paddingVertical: Spacing.sm },
  paddingVerticalMD: { paddingVertical: Spacing.md },
  paddingVerticalLG: { paddingVertical: Spacing.lg },
  paddingVerticalXL: { paddingVertical: Spacing.xl },
  paddingVerticalXXL: { paddingVertical: Spacing.xxl },
});

// Helper functions
export const createButtonStyle = (
  variant: 'primary' | 'accent' | 'secondary' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
): ViewStyle => {
  const baseStyle = CommonStyles.buttonPrimary;
  
  let variantStyle: ViewStyle = {};
  switch (variant) {
    case 'accent':
      variantStyle = CommonStyles.buttonAccent;
      break;
    case 'secondary':
      variantStyle = CommonStyles.buttonSecondary;
      break;
    default:
      variantStyle = CommonStyles.buttonPrimary;
  }
  
  let sizeStyle: ViewStyle = {};
  switch (size) {
    case 'small':
      sizeStyle = {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
      };
      break;
    case 'large':
      sizeStyle = {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
      };
      break;
    default:
      sizeStyle = {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
      };
  }
  
  return {
    ...baseStyle,
    ...variantStyle,
    ...sizeStyle,
  };
};

export const createTextStyle = (
  variant: keyof typeof Typography,
  color?: string
): TextStyle => {
  const baseStyle = Typography[variant];
  return color ? { ...baseStyle, color } : baseStyle;
};

export default CommonStyles;