/**
 * Shared, method-aware emission-factor catalogue contract.
 *
 * This module defines metadata and validation only. It intentionally ships no
 * emission-factor values or defaults. Factors must declare the methods for
 * which their source and system boundary are considered applicable.
 */

export type FactorDataKind =
  | "measured"
  | "provider-reported"
  | "secondary-literature"
  | "proxy";

export type FactorDataQuality = "high" | "medium" | "low";

export type FactorGeographyLevel =
  | "global"
  | "country"
  | "region"
  | "grid-zone"
  | "provider-region"
  | "site";

export interface EmissionFactorRecord {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  source: {
    name: string;
    publisher?: string;
    url?: string;
    publishedYear?: number;
    accessedAt?: string;
  };
  geography?: {
    level: FactorGeographyLevel;
    name: string;
    code?: string;
  };
  referencePeriod?: {
    year?: number;
    startDate?: string;
    endDate?: string;
  };
  dataKind: FactorDataKind;
  dataQuality?: FactorDataQuality;
  applicableMethods: string[];
  license?: string;
  notes?: string;
}

const DATA_KINDS: FactorDataKind[] = [
  "measured",
  "provider-reported",
  "secondary-literature",
  "proxy",
];

const QUALITY_LEVELS: FactorDataQuality[] = ["high", "medium", "low"];

const GEOGRAPHY_LEVELS: FactorGeographyLevel[] = [
  "global",
  "country",
  "region",
  "grid-zone",
  "provider-region",
  "site",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validYear = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1900 && value <= 2100;

const validDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function validateEmissionFactorRecord(input: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(input)) return ["record must be an object"];

  for (const key of ["id", "name", "category", "unit"] as const) {
    if (!isNonEmptyString(input[key])) errors.push(`${key} must be a non-empty string`);
  }

  if (typeof input.value !== "number" || !Number.isFinite(input.value) || input.value < 0) {
    errors.push("value must be a finite, non-negative number");
  } else if (input.value === 0 && !isNonEmptyString(input.notes)) {
    errors.push("notes must explain and evidence a zero factor value");
  }

  if (!isObject(input.source) || !isNonEmptyString(input.source.name)) {
    errors.push("source.name must be a non-empty string");
  } else {
    if (input.source.url !== undefined) {
      try {
        const url = new URL(String(input.source.url));
        if (url.protocol !== "https:" && url.protocol !== "http:") errors.push("source.url must use HTTP or HTTPS");
      } catch {
        errors.push("source.url must be a valid HTTP or HTTPS URL");
      }
    }
    if (input.source.publishedYear !== undefined && !validYear(input.source.publishedYear)) {
      errors.push("source.publishedYear must be a year between 1900 and 2100");
    }
    if (input.source.accessedAt !== undefined && !validDate(input.source.accessedAt)) {
      errors.push("source.accessedAt must be a valid YYYY-MM-DD date");
    }
  }

  if (!DATA_KINDS.includes(input.dataKind as FactorDataKind)) {
    errors.push("dataKind must be measured, provider-reported, secondary-literature, or proxy");
  }

  if (input.dataQuality !== undefined && !QUALITY_LEVELS.includes(input.dataQuality as FactorDataQuality)) {
    errors.push("dataQuality must be high, medium, or low");
  }

  if (!Array.isArray(input.applicableMethods) || input.applicableMethods.length === 0
    || input.applicableMethods.some((method) => !isNonEmptyString(method))) {
    errors.push("applicableMethods must contain at least one non-empty method identifier");
  } else if (new Set(input.applicableMethods).size !== input.applicableMethods.length) {
    errors.push("applicableMethods must not contain duplicates");
  }

  if (input.geography !== undefined) {
    if (!isObject(input.geography)
      || !GEOGRAPHY_LEVELS.includes(input.geography.level as FactorGeographyLevel)
      || !isNonEmptyString(input.geography.name)) {
      errors.push("geography must include a supported level and non-empty name");
    }
  }

  if (input.referencePeriod !== undefined) {
    const period = input.referencePeriod;
    if (!isObject(period)) {
      errors.push("referencePeriod must be an object");
    } else {
      const hasYear = period.year !== undefined;
      const hasDates = period.startDate !== undefined || period.endDate !== undefined;
      if (hasYear && !validYear(period.year)) {
        errors.push("referencePeriod.year must be a year between 1900 and 2100");
      }
      if (hasDates) {
        if (!validDate(period.startDate) || !validDate(period.endDate)) {
          errors.push("referencePeriod startDate and endDate must be valid YYYY-MM-DD dates");
        } else if (period.endDate < period.startDate) {
          errors.push("referencePeriod.endDate must be on or after startDate");
        }
      }
      if (!hasYear && !hasDates) errors.push("referencePeriod must include a year or a complete date range");
      if (hasYear && hasDates) errors.push("referencePeriod must use either year or date range, not both");
    }
  }

  return errors;
}

export function validateEmissionFactorCatalogue(records: unknown): string[] {
  if (!Array.isArray(records)) return ["catalogue must be an array"];
  const errors: string[] = [];
  const seen = new Set<string>();

  records.forEach((record, index) => {
    for (const error of validateEmissionFactorRecord(record)) {
      errors.push(`records[${index}]: ${error}`);
    }
    if (isObject(record) && isNonEmptyString(record.id)) {
      if (seen.has(record.id)) errors.push(`records[${index}]: duplicate factor id "${record.id}"`);
      seen.add(record.id);
    }
  });

  return errors;
}
