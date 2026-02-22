import brandPack from "../../docs/markster-brand-pack.json";

export type MarksterBrandPack = typeof brandPack;

export const MARKSTER_BRAND_PACK: MarksterBrandPack = brandPack;
export const MARKSTER_BRAND_TOKENS = {
  palette: {
    primary: MARKSTER_BRAND_PACK.visual_system.color.primary,
    neutral: MARKSTER_BRAND_PACK.visual_system.color.neutral,
    support: MARKSTER_BRAND_PACK.visual_system.color.support,
    text: MARKSTER_BRAND_PACK.visual_system.color.text,
    surface: MARKSTER_BRAND_PACK.visual_system.color.surface,
  },
  typography: {
    fontFamily: MARKSTER_BRAND_PACK.visual_system.typography.font_family,
    scale: MARKSTER_BRAND_PACK.visual_system.typography.scale,
    weights: MARKSTER_BRAND_PACK.visual_system.typography.weights,
    tracking: MARKSTER_BRAND_PACK.visual_system.typography.tracking,
  },
  components: MARKSTER_BRAND_PACK.components,
  spacing: MARKSTER_BRAND_PACK.visual_system.spacing_and_shape,
  motion: MARKSTER_BRAND_PACK.visual_system.interaction_states,
} as const;

export const MARKSTER_BRAND_GLOSSARY = {
  name: MARKSTER_BRAND_PACK.meta.name,
  missionTone: MARKSTER_BRAND_PACK.identity.mission_tone,
  positioning: MARKSTER_BRAND_PACK.identity.positioning,
  preferredTerms: MARKSTER_BRAND_PACK.voice_and_copy.preferred_terms,
} as const;

export const getMarksterBrandRule = <
  K extends keyof typeof MARKSTER_BRAND_PACK,
>(
  key: K,
): MarksterBrandPack[K] => MARKSTER_BRAND_PACK[key];
