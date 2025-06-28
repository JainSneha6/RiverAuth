import { useState, useRef } from 'react';

export interface TypingEvent {
  field: string;      // input name
  length: number;     // characters typed
  duration: number;   // ms from first to last keystroke
  wpm: number;        // crude words‑per‑minute
  timestamp: number;  // epoch when we log
}

/* ============================================================= */
/*   Hook                                                         */
/* ============================================================= */
export const useTypingSpeedTracking = (
  send: (payload: unknown) => void           // 👈 inject WebSocket sender
) => {
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const typingDataRef = useRef<
    Record<string, { start: number; last: number }>
  >({});

  /* 1️⃣  call on every keypress / input change ------------------- */
  const onInputChange =
    (field: string) => (e: CustomEvent<{ value: string }>) => {
      const now = Date.now();
      if (!typingDataRef.current[field]) {
        typingDataRef.current[field] = { start: now, last: now };
      } else {
        typingDataRef.current[field].last = now;
      }
    };

  /* 2️⃣  call on blur (or submit) to finalize the metric --------- */
  const recordTypingEvent = (field: string, value: string | boolean) => {
    const data = typingDataRef.current[field];
    if (!data) return; // nothing recorded

    const { start, last } = data;
    const duration = last - start;
    const length = typeof value === 'string' ? value.length : 1;
    const wpm = duration
      ? Math.round((length / 5) / (duration / 60000))
      : 0;

    const event: TypingEvent = {
      field,
      length,
      duration,
      wpm,
      timestamp: Date.now(),
    };

    setTypingEvents((prev) => [...prev, event]);
    delete typingDataRef.current[field];

    /* 🚀 stream to WebSocket immediately */
    send({ type: 'typing', ts: Date.now(), data: event });
  };

  return { typingEvents, onInputChange, recordTypingEvent };
};
