/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#111827',
    tint: '#b7f34a',
    background: '#f4f6f0',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    primary: '#173b2f',
    primaryForeground: '#f4f6f0',
    secondary: '#e6eadf',
    secondaryForeground: '#173b2f',
    muted: '#e9ede5',
    mutedForeground: '#667168',
    accent: '#b7f34a',
    accentForeground: '#12251e',
    destructive: '#ef6a67',
    destructiveForeground: '#ffffff',
    border: '#d9e0d4',
    input: '#d9e0d4',
    success: '#5da568',
  },
  dark: {
    text: '#f5f7f3',
    tint: '#c5f34b',
    background: '#101512',
    foreground: '#f5f7f3',
    card: '#18211c',
    cardForeground: '#f5f7f3',
    primary: '#c5f34b',
    primaryForeground: '#101512',
    secondary: '#253129',
    secondaryForeground: '#e9f0e4',
    muted: '#202b24',
    mutedForeground: '#98a69b',
    accent: '#c5f34b',
    accentForeground: '#101512',
    destructive: '#ff7772',
    destructiveForeground: '#ffffff',
    border: '#2d3a31',
    input: '#34443a',
    success: '#8bd17d',
  },
  radius: 18,
};

export default colors;
