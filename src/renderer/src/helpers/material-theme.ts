import Color from "color";

export type MaterialThemeMode = "light" | "dark";

export interface MaterialYouPalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
}

const DEFAULT_ON_DARK = "#1d1b20";
const DEFAULT_ON_LIGHT = "#ffffff";

const toOnColor = (color: Color) =>
  color.isLight() ? DEFAULT_ON_DARK : DEFAULT_ON_LIGHT;

const toneContainer = (color: Color, mode: MaterialThemeMode) =>
  mode === "dark" ? color.darken(0.35) : color.lighten(0.45);

export const buildMaterialYouPalette = (
  baseHex: string,
  mode: MaterialThemeMode
): MaterialYouPalette => {
  const base = new Color(baseHex);

  const primary = base.saturate(0.2).hex();
  const primaryContainer = toneContainer(new Color(baseHex), mode).hex();

  const secondaryBase = new Color(baseHex).rotate(28).saturate(0.1);
  const secondary = secondaryBase.hex();
  const secondaryContainer = toneContainer(secondaryBase, mode).hex();

  const tertiaryBase = new Color(baseHex).rotate(56).saturate(0.12);
  const tertiary = tertiaryBase.hex();
  const tertiaryContainer = toneContainer(tertiaryBase, mode).hex();

  return {
    primary,
    onPrimary: toOnColor(new Color(primary)),
    primaryContainer,
    onPrimaryContainer: toOnColor(new Color(primaryContainer)),
    secondary,
    onSecondary: toOnColor(new Color(secondary)),
    secondaryContainer,
    onSecondaryContainer: toOnColor(new Color(secondaryContainer)),
    tertiary,
    onTertiary: toOnColor(new Color(tertiary)),
    tertiaryContainer,
    onTertiaryContainer: toOnColor(new Color(tertiaryContainer)),
  };
};
