import { locales as supportedLocales } from "@/i18n/navigation";
import type { StaticTextDefaultValue } from "md-editor-rt";
import { config } from "md-editor-rt";

// Always include English for fallback
import EN_US from "@/i18n/md/en";

// Build language map from supported locales by reading each locale's JSON for its code
const languageUserDefined: Record<string, StaticTextDefaultValue> = {};

for (const lc of supportedLocales || ["en"]) {
  // Try to load matching md pack; if none, fallback to EN
  let pack: StaticTextDefaultValue = EN_US;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`@/i18n/md/${lc}`);
    if (mod?.default) pack = mod.default as StaticTextDefaultValue;
  } catch {
    // keep EN_US
  }
  languageUserDefined[lc] = pack;
}

export default config({
  editorConfig: {
    languageUserDefined,
  },
});