import { locales as supportedLocales } from "@/i18n/navigation";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import highlight from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import katex from "katex";
import "katex/dist/katex.min.css";
import MarkExtension from "markdown-it-mark";
import type { StaticTextDefaultValue } from "md-editor-rt";
import { config } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import mermaid from "mermaid";
import prettier from "prettier";
import parserMarkdown from "prettier/parser-markdown";
import screenfull from "screenfull";

// Always include English for fallback
import EN_US from "@/i18n/md/en";

function loadLocales(): Record<string, StaticTextDefaultValue> {
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
  return languageUserDefined;
}

export default config({
  markdownItConfig(md, options) {
    md.use(MarkExtension, options);
  },
  editorConfig: {
    languageUserDefined: loadLocales(),
  },
  editorExtensions: {
    prettier: {
      prettierInstance: prettier,
      parserMarkdownInstance: parserMarkdown
    },
    highlight: {
      instance: highlight
    },
    screenfull: {
      instance: screenfull
    },
    katex: {
      instance: katex
    },
    cropper: {
      instance: Cropper
    },
    mermaid: {
      instance: mermaid
    }
  }
});