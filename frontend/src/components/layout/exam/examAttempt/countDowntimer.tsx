'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CountdownTimer({ initialSeconds, onExpire }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Baseline resyncs whenever the parent gets a fresh value from the server
  // (e.g. after the periodic getAttemptByToken poll) — this just restarts
  // the local tick from that corrected number instead of drifting forever.
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpire]);

  const low = seconds <= 60;

  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
        low ? 'bg-[#FF6B6B]/15 text-[#FF6B6B]' : 'bg-[#161C3A] border border-white/[0.08] text-[#AAB2D4]'
      }`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <Timer size={13} />
      {format(seconds)}
    </span>
  );
}