import { StyleSheet } from "react-native";

import { useTheme } from "../../utils/useTheme";

export const getSettingsStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    group: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 56,
      backgroundColor: theme.colors.surface,
    },
    rowColumn: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.md,
    },
    rowIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: "center",
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
    },
    rowSubLabel: {
      fontSize: 12,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginLeft: 56,
    },
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: theme.radius.sm - 2,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentActive: {
      backgroundColor: theme.colors.ink,
    },
    segmentText: {
      fontSize: 13,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      zIndex: 1,
    },
    segmentTextActive: {
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.muted,
      fontFamily: theme.font.regular,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCard: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    modalTitle: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      fontSize: 20,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modalBody: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      fontSize: 15,
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    inputWrapper: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: theme.spacing.md,
      paddingRight: theme.spacing.xl, // leave space for eye icon
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      position: "relative",
    },
    inputWrapperDisabled: {
      opacity: 0.5,
      backgroundColor: theme.colors.surface,
    },
    input: {
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      fontSize: 14,
    },
    inputDisabled: {
      color: theme.colors.muted,
    },
    helperText: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      fontSize: 12,
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },
    inputIconButton: {
      position: "absolute",
      right: theme.spacing.sm,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      padding: theme.spacing.xs,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    modalGhost: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
    },
    modalGhostText: {
      color: theme.colors.ink,
      fontFamily: theme.font.bold,
    },
    modalDanger: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.danger,
    },
    modalDangerDisabled: {
      backgroundColor: theme.colors.surfaceTint,
    },
    modalDangerText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
    },
    modalDangerTextDisabled: {
      color: theme.colors.muted,
    },
    warningBox: {
      backgroundColor: theme.isDark
        ? "rgba(255, 59, 48, 0.1)"
        : "rgba(255, 59, 48, 0.05)",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255, 59, 48, 0.3)"
        : "rgba(255, 59, 48, 0.2)",
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    warningHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    warningText: {
      flex: 1,
      fontFamily: theme.font.regular,
      fontSize: 12,
      color: theme.colors.ink,
      lineHeight: 16,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 3,
      borderWidth: 2,
      borderColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    checkboxLabel: {
      flex: 1,
      fontFamily: theme.font.regular,
      fontSize: 12,
      color: theme.colors.ink,
    },
  });
