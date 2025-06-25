import { useState, useRef, useEffect } from 'react';
import { createGesture } from '@ionic/react';

// Define interface for IonContent DOM element
interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
  // Add other methods if needed, e.g., scrollByPoint, scrollToPoint
}

interface TapEvent {
  pointerId: number | null;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  movementX: number;
  movementY: number;
  button: number;
  buttons: number;
  duration: number;
  timestamp: number;
  pointerType: string | null;
  target: string;
  source?: string;
}

interface SwipeEvent {
  pointerId: number | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  direction: 'left' | 'right' | 'up' | 'down';
  timestamp: number;
  pointerType: string | null;
  source?: string;
}

interface PointerEventData {
  pointerId: number;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  movementX: number;
  movementY: number;
  button: number;
  buttons: number;
  pointerType: string;
  timestamp: number;
  target: string;
  eventType: 'down' | 'up' | 'move';
}

interface GestureData {
  swipes: SwipeEvent[];
  taps: TapEvent[];
  downEvents: PointerEventData[];
  upEvents: PointerEventData[];
  moveEvents: PointerEventData[];
}

export const useGestureTracking = (contentRef: React.RefObject<IonContentElement | null>): GestureData => {
  const [swipeEvents, setSwipeEvents] = useState<SwipeEvent[]>([]);
  const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
  const [downEvents, setDownEvents] = useState<PointerEventData[]>([]);
  const [upEvents, setUpEvents] = useState<PointerEventData[]>([]);
  const [moveEvents, setMoveEvents] = useState<PointerEventData[]>([]);
  const downDataRef = useRef<Map<number, { x: number; y: number; timestamp: number }>>(new Map());
  const gestureRef = useRef<any>(null);

  const HOLD_THRESHOLD = 10;
  const SWIPE_DISTANCE_THRESHOLD = 15;
  const SWIPE_TIME_THRESHOLD = 1000;
  const TAP_TIME_THRESHOLD = 1000;

  const getTargetInfo = (target: EventTarget | null): string => {
    if (!target || !(target instanceof HTMLElement)) return 'N/A';
    return `${target.tagName}${target.id ? `#${target.id}` : ''}`;
  };

  const logPointerEvent = (event: PointerEvent, eventType: 'down' | 'up' | 'move') => {
    const {
      pointerId,
      clientX,
      clientY,
      screenX,
      screenY,
      pageX,
      pageY,
      offsetX,
      offsetY,
      movementX,
      movementY,
      button,
      buttons,
      pointerType,
      timeStamp,
      target,
    } = event;
    const targetInfo = getTargetInfo(target);
    const eventData: PointerEventData = {
      pointerId,
      clientX,
      clientY,
      screenX,
      screenY,
      pageX,
      pageY,
      offsetX,
      offsetY,
      movementX,
      movementY,
      button,
      buttons,
      pointerType,
      timestamp: Date.now(),
      target: targetInfo,
      eventType,
    };

    console.log(`${eventType.toUpperCase()}:
  pointerId: ${pointerId}
  clientX/Y: ${clientX}, ${clientY}
  screenX/Y: ${screenX}, ${screenY}
  pageX/Y: ${pageX}, ${pageY}
  offsetX/Y: ${offsetX}, ${offsetY}
  movementX/Y: ${movementX}, ${movementY}
  button/buttons: ${button}/${buttons}
  pointerType: ${pointerType}
  timestamp: ${timeStamp}
  target: ${targetInfo}`);

    if (eventType === 'down') {
      setDownEvents((prev) => [...prev, eventData]);
    } else if (eventType === 'up') {
      setUpEvents((prev) => [...prev, eventData]);
    } else if (eventType === 'move') {
      setMoveEvents((prev) => [...prev, eventData]);
    }
  };

  const processGesture = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startTime: number,
    pointerId: number | null,
    pointerType: string | null,
    event?: PointerEvent,
    source?: string
  ) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - startTime;
    const timestamp = Date.now();

    if (distance < HOLD_THRESHOLD && duration < TAP_TIME_THRESHOLD) {
      const tapEvent: TapEvent = {
        pointerId,
        clientX: endX,
        clientY: endY,
        screenX: event?.screenX || endX,
        screenY: event?.screenY || endY,
        pageX: event?.pageX || endX,
        pageY: event?.pageY || endY,
        offsetX: event?.offsetX || 0,
        offsetY: event?.offsetY || 0,
        movementX: event?.movementX || 0,
        movementY: event?.movementY || 0,
        button: event?.button || 0,
        buttons: event?.buttons || 0,
        duration,
        timestamp,
        pointerType: pointerType || 'gesture',
        target: event ? getTargetInfo(event.target) : 'N/A',
        source,
      };
      setTapEvents((prev) => [...prev, tapEvent]);
      console.log('Tap event recorded:', tapEvent);
    } else if (duration < SWIPE_TIME_THRESHOLD && distance > SWIPE_DISTANCE_THRESHOLD) {
      const direction =
        Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 'right' : 'left') : (deltaY > 0 ? 'down' : 'up');
      const swipeEvent: SwipeEvent = {
        pointerId,
        startX,
        startY,
        endX,
        endY,
        deltaX,
        deltaY,
        distance,
        duration,
        direction,
        timestamp,
        pointerType: pointerType || 'gesture',
        source,
      };
      setSwipeEvents((prev) => [...prev, swipeEvent]);
      console.log('Swipe event recorded:', swipeEvent);
    } else {
      console.log('Gesture not classified as tap or swipe');
    }
  };

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const handlePointerDown = (event: PointerEvent) => {
      logPointerEvent(event, 'down');
      downDataRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY, timestamp: Date.now() });
    };

    const handlePointerUp = (event: PointerEvent) => {
      logPointerEvent(event, 'up');
      const downData = downDataRef.current.get(event.pointerId);
      if (downData) {
        processGesture(
          downData.x,
          downData.y,
          event.clientX,
          event.clientY,
          downData.timestamp,
          event.pointerId,
          event.pointerType,
          event
        );
        downDataRef.current.delete(event.pointerId);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      logPointerEvent(event, 'move');
    };

    contentEl.addEventListener('pointerdown', handlePointerDown);
    contentEl.addEventListener('pointerup', handlePointerUp);
    contentEl.addEventListener('pointermove', handlePointerMove);

    contentEl.getScrollElement().then((scrollEl: HTMLElement) => {
      if (!scrollEl) return;
      const gesture = createGesture({
        el: scrollEl,
        gestureName: 'swipe-gesture',
        threshold: 0,
        onStart: (detail) => {
          downDataRef.current.set(-1, { x: detail.startX, y: detail.startY, timestamp: Date.now() });
        },
        onEnd: (detail) => {
          const downData = downDataRef.current.get(-1);
          if (downData) {
            processGesture(
              downData.x,
              downData.y,
              detail.currentX,
              detail.currentY,
              downData.timestamp,
              null,
              'gesture',
              undefined,
              'gesture'
            );
            downDataRef.current.delete(-1);
          }
        },
      });
      gesture.enable(true);
      gestureRef.current = gesture;
    });

    return () => {
      contentEl.removeEventListener('pointerdown', handlePointerDown);
      contentEl.removeEventListener('pointerup', handlePointerUp);
      contentEl.removeEventListener('pointermove', handlePointerMove);
      if (gestureRef.current) gestureRef.current.destroy();
    };
  }, [contentRef]);

  return { swipes: swipeEvents, taps: tapEvents, downEvents, upEvents, moveEvents };
};