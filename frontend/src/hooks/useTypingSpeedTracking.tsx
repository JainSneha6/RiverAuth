import { useState, useRef } from 'react';

export interface TypingEvent {
  field: string;      
  length: number;    
  duration: number;   
  wpm: number;        
  timestamp: number; 
}

export const useTypingSpeedTracking = (
  send: (payload: unknown) => void          
) => {
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const typingDataRef = useRef<
    Record<string, { start: number; last: number }>
  >({});

  const onInputChange =
    (field: string) => (e: CustomEvent<{ value: string }>) => {
      const now = Date.now();
      if (!typingDataRef.current[field]) {
        typingDataRef.current[field] = { start: now, last: now };
      } else {
        typingDataRef.current[field].last = now;
      }
    };

  const recordTypingEvent = (field: string, value: string | boolean) => {
    const data = typingDataRef.current[field];
    if (!data) return; 

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

    send({ type: 'typing', ts: Date.now(), data: event });
  };

  return { typingEvents, onInputChange, recordTypingEvent };
};
