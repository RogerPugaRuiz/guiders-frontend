// === INTERFACES PRINCIPALES ===

export interface WhiteLabelColors {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface WhiteLabelBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  brandName: string;
}

export interface CustomFontFile {
  name: string;       // Nombre del archivo: "OpenSans-Bold.ttf"
  url: string;        // URL del archivo subido
  weight: FontWeight; // Peso de la fuente
  style: FontStyle;   // Estilo: normal o italic
}

export type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type FontStyle = 'normal' | 'italic';

export interface WhiteLabelTypography {
  fontFamily: FontFamilyOption;
  customFontUrl?: string;           // URL de Google Fonts (legacy)
  customFontName?: string;          // Nombre de la fuente personalizada
  customFontFiles?: CustomFontFile[]; // Archivos de fuentes subidos
}

export type FontFamilyOption = 'Inter' | 'Roboto' | 'Open Sans' | 'Poppins' | 'Montserrat' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface WhiteLabelConfig {
  id?: string;
  siteId: string;
  companyId: string;
  colors: WhiteLabelColors;
  branding: WhiteLabelBranding;
  typography: WhiteLabelTypography;
  theme: ThemeMode;
  createdAt?: Date;
  updatedAt?: Date;
}

// === REQUEST/RESPONSE TYPES ===

export interface CreateWhiteLabelConfigRequest {
  siteId: string;
  companyId: string;
  colors?: Partial<WhiteLabelColors>;
  branding?: Partial<WhiteLabelBranding>;
  typography?: Partial<WhiteLabelTypography>;
  theme?: ThemeMode;
}

export interface UpdateWhiteLabelConfigRequest {
  colors?: Partial<WhiteLabelColors>;
  branding?: Partial<WhiteLabelBranding>;
  typography?: Partial<WhiteLabelTypography>;
  theme?: ThemeMode;
}

export interface UploadResponse {
  url: string;
  message: string;
}

export interface UploadFontResponse {
  url: string;
  fileName: string;
  message: string;
}

// === API RESPONSE (para transformar fechas) ===

export interface ApiWhiteLabelConfigResponse {
  id?: string;
  siteId: string;
  companyId: string;
  colors: WhiteLabelColors;
  branding: WhiteLabelBranding;
  typography: WhiteLabelTypography;
  theme: ThemeMode;
  createdAt?: string;
  updatedAt?: string;
}

// === DEFAULTS ===

export const WHITE_LABEL_DEFAULTS: Omit<WhiteLabelConfig, 'id' | 'siteId' | 'companyId' | 'createdAt' | 'updatedAt'> = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    tertiary: '#28a745',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textMuted: '#6c757d'
  },
  branding: {
    logoUrl: null,
    faviconUrl: null,
    brandName: 'Guiders'
  },
  typography: {
    fontFamily: 'Inter'
  },
  theme: 'light'
};

// === OPCIONES PARA SELECTS ===

export interface FontFamilyOptionItem {
  value: FontFamilyOption;
  label: string;
  googleFontUrl?: string;
}

export const FONT_FAMILY_OPTIONS: FontFamilyOptionItem[] = [
  {
    value: 'Inter',
    label: 'Inter',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  },
  {
    value: 'Roboto',
    label: 'Roboto',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
  },
  {
    value: 'Open Sans',
    label: 'Open Sans',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap'
  },
  {
    value: 'Poppins',
    label: 'Poppins',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
  },
  {
    value: 'Montserrat',
    label: 'Montserrat',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap'
  },
  {
    value: 'custom',
    label: 'Personalizada'
  }
];

export interface ThemeOptionItem {
  value: ThemeMode;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOptionItem[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'auto', label: 'Automatico', icon: 'monitor' }
];
