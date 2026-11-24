// The client sends dates as date-only strings ("YYYY-MM-DD"). `new Date("2026-09-01")`
// parses to UTC midnight, which in a negative-offset zone (Paraguay is UTC-3) lands on
// the previous day — so a movement can silently jump to the previous month and vanish
// from month-scoped views while still counting in the all-time totals. Pin date-only
// values to 12:00 UTC so no real-world offset can push them across a day boundary.
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseClientDate(input?: string | null): Date {
    if (!input) return new Date();
    if (DATE_ONLY.test(input)) return new Date(`${input}T12:00:00.000Z`);
    return new Date(input);
}

