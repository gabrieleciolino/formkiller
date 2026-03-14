type AdminTraceMeta = Record<string, unknown>;

const ADMIN_TRACE_ENABLED = process.env.FORMKILLER_ADMIN_TRACE === "1";
const ADMIN_TRACE_METRICS_WINDOW_SIZE = 200;

type AdminTrace = {
  id: string;
  label: string;
  startAt: number;
};

type AdminTraceMetricState = {
  count: number;
  sum: number;
  samples: number[];
};

const adminTraceMetrics = new Map<string, AdminTraceMetricState>();

const roundMs = (value: number) => Math.round(value * 10) / 10;

const recordTraceMetric = (key: string, durationMs: number) => {
  const metricState = adminTraceMetrics.get(key) ?? {
    count: 0,
    sum: 0,
    samples: [],
  };

  metricState.count += 1;
  metricState.sum += durationMs;
  metricState.samples.push(durationMs);

  if (metricState.samples.length > ADMIN_TRACE_METRICS_WINDOW_SIZE) {
    metricState.samples.shift();
  }

  adminTraceMetrics.set(key, metricState);

  const sortedSamples = [...metricState.samples].sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sortedSamples.length * 0.95) - 1);
  const p95Ms = sortedSamples[p95Index] ?? durationMs;

  return {
    metricCount: metricState.count,
    metricAvgMs: roundMs(metricState.sum / metricState.count),
    metricP95Ms: roundMs(p95Ms),
  };
};

const getTraceId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
};

const stringifyMeta = (meta?: AdminTraceMeta) => {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [meta_unserializable]";
  }
};

export function startAdminTrace(
  label: string,
  meta?: AdminTraceMeta,
): AdminTrace | null {
  if (!ADMIN_TRACE_ENABLED) {
    return null;
  }

  const trace: AdminTrace = {
    id: getTraceId(),
    label,
    startAt: performance.now(),
  };
  console.info(`[admin-trace:${trace.id}] start ${label}${stringifyMeta(meta)}`);
  return trace;
}

export function stepAdminTrace(
  trace: AdminTrace | null,
  step: string,
  meta?: AdminTraceMeta,
) {
  if (!trace) {
    return;
  }

  const elapsedMs = Math.round((performance.now() - trace.startAt) * 10) / 10;
  console.info(
    `[admin-trace:${trace.id}] step ${trace.label}.${step} +${elapsedMs}ms${stringifyMeta(meta)}`,
  );
}

export function endAdminTrace(trace: AdminTrace | null, meta?: AdminTraceMeta) {
  if (!trace) {
    return;
  }

  const totalMs = roundMs(performance.now() - trace.startAt);
  const metricMeta = recordTraceMetric(`${trace.label}.total`, totalMs);
  console.info(
    `[admin-trace:${trace.id}] end ${trace.label} total=${totalMs}ms${stringifyMeta({
      ...meta,
      ...metricMeta,
    })}`,
  );
}

export async function traceAdminStep<T>(
  trace: AdminTrace | null,
  step: string,
  fn: () => PromiseLike<T> | T,
  meta?: AdminTraceMeta,
): Promise<T> {
  const stepStartAt = performance.now();
  try {
    return await fn();
  } finally {
    const durationMs = roundMs(performance.now() - stepStartAt);
    const metricMeta = trace
      ? recordTraceMetric(`${trace.label}.${step}`, durationMs)
      : null;
    stepAdminTrace(trace, step, {
      ...meta,
      durationMs,
      ...(metricMeta ?? {}),
    });
  }
}
