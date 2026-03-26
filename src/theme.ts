/**
 * PsychedCMS Admin Theme
 *
 * Based on the Admin Design System standards (agent-os/standards/frontend/admin-design-system.md).
 * Key decisions:
 * - 8px spacing base (MUI default)
 * - 14px body text (industry admin standard)
 * - 40px input height (size="small" default)
 * - Compact density for power users
 * - Dark theme as default (music industry context)
 */
import type { RaThemeOptions } from 'react-admin';

// ─── Shared invariants ──────────────────────────────────────────────────────

const sharedTypography = {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    fontSize: 14,
    // Page titles
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.33 },
    // Section titles
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    // Card titles
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    // Subtitles
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.43 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.38 },
    // Body
    body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.57 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.54 },
    // Caption
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
    // Overline
    overline: {
        fontSize: '0.6875rem',
        fontWeight: 600,
        lineHeight: 1.45,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
    },
    // Buttons — no uppercase
    button: { fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none' as const },
};

const sharedComponents: RaThemeOptions['components'] = {
    MuiButton: {
        defaultProps: { size: 'small', disableElevation: true },
        styleOverrides: {
            root: { borderRadius: 6, padding: '5px 12px' },
            sizeSmall: { height: 30, fontSize: '0.8125rem' },
            sizeMedium: { height: 36, fontSize: '0.875rem' },
            sizeLarge: { height: 42, fontSize: '0.9375rem' },
        },
    },
    MuiIconButton: {
        defaultProps: { size: 'small' },
        styleOverrides: {
            sizeSmall: { padding: 6 },
        },
    },
    MuiTextField: {
        defaultProps: { size: 'small', variant: 'outlined', fullWidth: true, margin: 'dense' },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: { borderRadius: 6 },
        },
    },
    MuiFilledInput: {
        defaultProps: { disableUnderline: true },
        styleOverrides: {
            root: {
                borderRadius: 6,
                '&::before, &::after': { display: 'none' },
            },
        },
    },
    MuiSelect: {
        defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiFormControl: {
        defaultProps: { size: 'small', variant: 'outlined', margin: 'dense', fullWidth: true },
    },
    MuiInputLabel: {
        styleOverrides: {
            root: { fontSize: '0.8125rem' },
        },
    },
    MuiToolbar: {
        defaultProps: { variant: 'dense' },
        styleOverrides: {
            dense: { minHeight: 48 },
        },
    },
    MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
            root: { borderRadius: 8 },
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
        },
    },
    MuiDialog: {
        styleOverrides: {
            paper: { borderRadius: 12 },
        },
    },
    MuiDialogTitle: {
        styleOverrides: {
            root: { padding: '16px 24px', fontSize: '1rem', fontWeight: 600 },
        },
    },
    MuiDialogContent: {
        styleOverrides: {
            root: { padding: '16px 24px' },
        },
    },
    MuiDialogActions: {
        styleOverrides: {
            root: { padding: '12px 24px' },
        },
    },
    MuiTableCell: {
        styleOverrides: {
            root: { padding: '8px 16px', fontSize: '0.8125rem' },
            head: { fontWeight: 600, fontSize: '0.75rem' },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: { borderRadius: 6 },
            sizeSmall: { height: 24, fontSize: '0.75rem' },
        },
    },
    MuiToggleButton: {
        styleOverrides: {
            root: { borderRadius: 6, textTransform: 'none' },
            sizeSmall: { padding: '4px 8px' },
        },
    },
    MuiPagination: {
        defaultProps: { shape: 'rounded', size: 'small' },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: { borderRadius: 6 },
        },
    },
    MuiAccordion: {
        defaultProps: { disableGutters: true },
        styleOverrides: {
            root: { borderRadius: 8, '&::before': { display: 'none' } },
        },
    },
    MuiTab: {
        styleOverrides: {
            root: { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', minHeight: 40 },
        },
    },
    MuiTabs: {
        styleOverrides: {
            root: { minHeight: 40 },
        },
    },
};

const sharedShape = {
    borderRadius: 8,
};

const sidebar = {
    width: 240,
    closedWidth: 56,
};

// ─── Dark Theme (default) ───────────────────────────────────────────────────

export const darkTheme: RaThemeOptions = {
    spacing: 8,
    shape: sharedShape,
    typography: sharedTypography,
    sidebar,
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
            light: '#bbdefb',
            dark: '#42a5f5',
        },
        secondary: {
            main: '#ce93d8',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        divider: 'rgba(255,255,255,0.08)',
        text: {
            primary: 'rgba(255,255,255,0.87)',
            secondary: 'rgba(255,255,255,0.6)',
            disabled: 'rgba(255,255,255,0.38)',
        },
        action: {
            active: 'rgba(255,255,255,0.56)',
            hover: 'rgba(255,255,255,0.08)',
            selected: 'rgba(255,255,255,0.12)',
            disabled: 'rgba(255,255,255,0.26)',
            disabledBackground: 'rgba(255,255,255,0.12)',
        },
    },
    components: {
        ...sharedComponents,
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e1e1e',
                    backgroundImage: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
    },
};

// ─── Light Theme ────────────────────────────────────────────────────────────

export const lightTheme: RaThemeOptions = {
    spacing: 8,
    shape: sharedShape,
    typography: sharedTypography,
    sidebar,
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#9c27b0',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    components: sharedComponents,
};
