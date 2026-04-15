/**
 * Ummy Design Configuration 🏁
 * 
 * HISTORY PROTECTION: Setting APP_THEME = 'CLASSIC' restores the stable Light Blue/Gray look.
 * Setting APP_THEME = 'STELLAR_PINK' enables the experimental vibrant pink UI.
 */
export const APP_THEME: string = 'CLASSIC'; // Use string to allow comparison checks luxuriously


/**
 * Design Tokens - Centralized UI variables for consistent theme switching.
 */
export const DESIGN_TOKENS = {
  // --- CORE COLORS ---
  appBackground: APP_THEME === 'STELLAR_PINK' ? '#FF91B5' : '#F8F9FE',
  rootBackground: APP_THEME === 'STELLAR_PINK' ? '#FF91B5' : '#020617', // Slate-950 for body
  statusBarColor: APP_THEME === 'STELLAR_PINK' ? '#FF91B5' : '#F8F9FE',
  
  // --- NAVIGATION ---
  navAccentColor: APP_THEME === 'STELLAR_PINK' ? '#FF91B5' : '#FFCC00', // Yellow accent for classic
  navActiveTextColor: APP_THEME === 'STELLAR_PINK' ? 'text-pink-400' : 'text-primary', // Use existing text-primary for classic
  
  // --- LOADING ---
  loaderColor: 'text-primary',
  loaderText: 'text-slate-400'
};
