/**
 * User settings-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export enum NativeLanguage {
  EN = 'EN',
  ES = 'ES',
  FR = 'FR',
  DE = 'DE',
  HI = 'HI',
  JA = 'JA',
  ZH = 'ZH',
  AR = 'AR',
  IT = 'IT',
  PT = 'PT',
  RU = 'RU',
  KO = 'KO',
  NL = 'NL',
  PL = 'PL',
  TR = 'TR',
  VI = 'VI',
  TH = 'TH',
  ID = 'ID',
  CS = 'CS',
  SV = 'SV',
  DA = 'DA',
  NO = 'NO',
  FI = 'FI',
  EL = 'EL',
  HE = 'HE',
  UK = 'UK',
  RO = 'RO',
  HU = 'HU',
  BG = 'BG',
  HR = 'HR',
  SK = 'SK',
  SL = 'SL',
  ET = 'ET',
  LV = 'LV',
  LT = 'LT',
  IS = 'IS',
  GA = 'GA',
  MT = 'MT',
  EU = 'EU',
  CA = 'CA',
  FA = 'FA',
  UR = 'UR',
  BN = 'BN',
  TA = 'TA',
  TE = 'TE',
  ML = 'ML',
  KN = 'KN',
  GU = 'GU',
  MR = 'MR',
  PA = 'PA',
  NE = 'NE',
  SI = 'SI',
  OR = 'OR',
  MY = 'MY',
  KM = 'KM',
  LO = 'LO',
  MS = 'MS',
  TL = 'TL',
  SW = 'SW',
  AF = 'AF',
  ZU = 'ZU',
  XH = 'XH',
}

export enum PageTranslationView {
  APPEND = 'APPEND',
  REPLACE = 'REPLACE',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export interface LanguageSettings {
  nativeLanguage: NativeLanguage | null;
  pageTranslationView: PageTranslationView;
}

export interface SettingsResponse {
  language: LanguageSettings;
  theme: Theme;
}

export interface UserSettingsResponse {
  userId: string;
  settings: SettingsResponse;
}

export interface UpdateSettingsRequest {
  language: LanguageSettings;
  theme: Theme;
}

export interface LanguageInfo {
  languageCode: string;
  languageNameInEnglish: string;
  languageNameInNative: string;
}

export interface GetAllLanguagesResponse {
  languages: LanguageInfo[];
}

