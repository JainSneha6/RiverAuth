import { useState, useRef } from 'react';

interface TypingEvent {
  field: string;
  length: number;
  duration: number;
  wpm: number;
  timestamp: number;
}

export const useTypingSpeedTracking = () => {
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const typingDataRef = useRef<{ [field: string]: { start: number; last: number } }>({});

  const onInputChange = (field: string) => (e: CustomEvent) => {
    const now = Date.now();
    if (!typingDataRef.current[field]) {
      typingDataRef.current[field] = { start: now, last: now };
    } else {
      typingDataRef.current[field].last = now;
    }
  };

  const recordTypingEvent = (field: string, value: string) => {
    const data = typingDataRef.current[field];
    if (data) {
      const { start, last } = data;
      const duration = last - start;
      const length = value.length;
      let wpm = 0;
      if (duration > 0) wpm = (length / 5) / (duration / 60000);
      const event: TypingEvent = { field, length, duration, wpm: Math.round(wpm), timestamp: Date.now() };
      setTypingEvents(prev => [...prev, event]);
      delete typingDataRef.current[field];
    }
  };

  return { typingEvents, onInputChange, recordTypingEvent };
};