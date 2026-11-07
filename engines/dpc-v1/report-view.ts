import type { DcfpMetric } from "../../src/lib/result-contract.ts";

export interface DpcV1ReportMetric extends DcfpMetric {
  sharePercent: number | null;
}

export interface DpcV1ReportBreakdown {
  total: DcfpMetric;
  categories: DpcV1ReportMetric[];
}

/**
 * Prepare report-only category shares from the metrics already produced by
 * the DPC result adapter. This helper does not calculate or alter emissions.
 */
export function buildDpcV1ReportBreakdown(
  metrics: readonly DcfpMetric[],
): DpcV1ReportBreakdown {
  const total = metrics.find((metric) => metric.id === "dpc.total");
  if (!total) throw new TypeError("DPC total metric is required for reporting.");
  if (!Number.isFinite(total.value) || total.value < 0) {
    throw new RangeError("DPC total metric must be finite and non-negative.");
  }

  const categories = metrics.filter((metric) => metric.id !== "dpc.total");
  for (const metric of categories) {
    if (!Number.isFinite(metric.value) || metric.value < 0) {
      throw new RangeError(`DPC metric ${metric.id} must be finite and non-negative.`);
    }
    if (metric.unit !== total.unit) {
      throw new TypeError(`DPC metric ${metric.id} must use the total metric unit.`);
    }
  }

  return {
    total,
    categories: categories.map((metric) => ({
      ...metric,
      sharePercent: total.value > 0 ? (metric.value / total.value) * 100 : null,
    })),
  };
}
