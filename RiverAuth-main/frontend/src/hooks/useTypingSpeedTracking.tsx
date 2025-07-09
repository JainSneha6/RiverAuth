import { useState, useRef } from 'react';
import debounce from 'lodash/debounce'; // You'll need to install lodash or implement your own debounce

export interface TypingEvent {
  field: string;
  length: number;
  duration: number;
  wpm: number;
  timestamp: number;
}

export const useTypingSpeedTracking = (
  send: (payload: unknown) => void,
  isConnected: boolean
) => {
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const typingDataRef = useRef<
    Record<string, { start: number; last: number; value: string }>
  >({});

  const onInputChange =
    (field: string) => (e: CustomEvent<{ value: string }>) => {
      const now = Date.now();
      const value = e.detail.value || '';
      if (!typingDataRef.current[field]) {
        typingDataRef.current[field] = { start: now, last: now, value };
      } else {
        typingDataRef.current[field] = {
          ...typingDataRef.current[field],
          last: now,
          value,
        };
      }
      debouncedRecordTypingEvent(field);
    };

  const recordTypingEvent = (field: string) => {
    const data = typingDataRef.current[field];
    if (!data) return;

    const { start, last, value } = data;
    const duration = last - start;
    const length = value.length;
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

    if (isConnected) {
      const payload = {
        type: 'typing',
        ts: Date.now(),
        data: event,
      };

      try {
        send(payload);
      } catch (sendError) {
        console.error('Error sending typing data to backend:', sendError);
      }
    } else {
      console.warn('WebSocket connection not established, skipping typing data send.');
    }
  };

  const debouncedRecordTypingEvent = debounce(recordTypingEvent, 500); // Wait 500ms after last input

  return { typingEvents, onInputChange, recordTypingEvent };
};