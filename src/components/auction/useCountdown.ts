import { useEffect, useState } from 'react';

/** Tiempo que falta para una fecha, actualizado cada segundo (o cada 30 s si falta mucho). */
export function useCountdown(endsAt: string | Date | null | undefined) {
  const target = endsAt ? new Date(endsAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const tick = () => setNow(Date.now());
    const interval = target - Date.now() > 3600_000 ? 30_000 : 1000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [target, target - now > 3600_000]);

  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return {
    ms,
    over: !!target && ms === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    urgent: !!target && ms > 0 && ms < 3600_000,
  };
}
