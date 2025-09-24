import type { BuiltIn, BuiltInTranslation } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

export type BuiltInDto = BuiltIn & {
  languages?: string | null;
  favoritesCount?: number | null;
  gallery?: string[] | null;
  galleryJson?: JsonValue;
};

export type InitialItem = BuiltIn & {
  languages?: string | null;
  favoritesCount?: number | null;
  galleryJson?: JsonValue;
  translations?: BuiltInTranslation[];
};