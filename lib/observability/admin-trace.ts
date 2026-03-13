type AdminTraceMeta = Record<string, unknown>;

const ADMIN_TRACE_ENABLED = process.env.FORMKILLER_ADMIN_TRACE === "1";

type AdminTrace = {
  id: string;
  label: string;
  startAt: number;
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

  const totalMs = Math.round((performance.now() - trace.startAt) * 10) / 10;
  console.info(
    `[admin-trace:${trace.id}] end ${trace.label} total=${totalMs}ms${stringifyMeta(meta)}`,
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
    const durationMs = Math.round((performance.now() - stepStartAt) * 10) / 10;
    stepAdminTrace(trace, step, { ...meta, durationMs });
  }
}
