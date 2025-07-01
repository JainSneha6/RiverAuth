import { useState, useRef, useEffect } from 'react';
import { createGesture } from '@ionic/react';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
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

export interface GestureData {
  swipes: SwipeEvent[];
  taps: TapEvent[];
  downEvents: PointerEventData[];
  upEvents: PointerEventData[];
  moveEvents: PointerEventData[];
}

export const useGestureTracking = (
  contentRef: React.RefObject<IonContentElement | null>,
  send: (payload: unknown) => void           
): GestureData => {
  const [swipeEvents, setSwipeEvents] = useState<SwipeEvent[]>([]);
  const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
  const [downEvents, setDownEvents] = useState<PointerEventData[]>([]);
  const [upEvents, setUpEvents] = useState<PointerEventData[]>([]);
  const [moveEvents, setMoveEvents] = useState<PointerEventData[]>([]);
  const downDataRef = useRef<Map<number, { x: number; y: number; ts: number }>>(
    new Map()
  );
  const gestureRef = useRef<any>(null);

  const HOLD_THRESHOLD = 10;
  const SWIPE_DISTANCE_THRESHOLD = 15;
  const SWIPE_TIME_THRESHOLD = 1000;
  const TAP_TIME_THRESHOLD = 1000;

  const getTargetInfo = (t: EventTarget | null): string =>
    t && t instanceof HTMLElement ? `${t.tagName}${t.id ? `#${t.id}` : ''}` : 'N/A';

  const push = (kind: 'tap' | 'swipe', data: TapEvent | SwipeEvent) => {
    send({ type: kind, ts: Date.now(), data });
  };

  const logPointerEvent = (
    e: PointerEvent,
    eventType: 'down' | 'up' | 'move'
  ) => {
    const detail: PointerEventData = {
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      pageX: e.pageX,
      pageY: e.pageY,
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      movementX: e.movementX,
      movementY: e.movementY,
      button: e.button,
      buttons: e.buttons,
      pointerType: e.pointerType,
      timestamp: Date.now(),
      target: getTargetInfo(e.target),
      eventType,
    };

    if (eventType === 'down') setDownEvents((p) => [...p, detail]);
    else if (eventType === 'up') setUpEvents((p) => [...p, detail]);
    else setMoveEvents((p) => [...p, detail]);
  };

  const processGesture = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    startTS: number,
    pointerId: number | null,
    pointerType: string | null,
    e?: PointerEvent,
    source?: string
  ) => {
    const dx = ex - sx;
    const dy = ey - sy;
    const dist = Math.hypot(dx, dy);
    const dur = Date.now() - startTS;
    const ts = Date.now();

    if (dist < HOLD_THRESHOLD && dur < TAP_TIME_THRESHOLD) {
      const tap: TapEvent = {
        pointerId,
        clientX: ex,
        clientY: ey,
        screenX: e?.screenX ?? ex,
        screenY: e?.screenY ?? ey,
        pageX: e?.pageX ?? ex,
        pageY: e?.pageY ?? ey,
        offsetX: e?.offsetX ?? 0,
        offsetY: e?.offsetY ?? 0,
        movementX: e?.movementX ?? 0,
        movementY: e?.movementY ?? 0,
        button: e?.button ?? 0,
        buttons: e?.buttons ?? 0,
        duration: dur,
        timestamp: ts,
        pointerType: pointerType ?? 'gesture',
        target: e ? getTargetInfo(e.target) : 'N/A',
        source,
      };
      setTapEvents((p) => [...p, tap]);
      push('tap', tap); 
    } else if (dur < SWIPE_TIME_THRESHOLD && dist > SWIPE_DISTANCE_THRESHOLD) {
      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'right'
            : 'left'
          : dy > 0
          ? 'down'
          : 'up';
      const swipe: SwipeEvent = {
        pointerId,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey,
        deltaX: dx,
        deltaY: dy,
        distance: dist,
        duration: dur,
        direction,
        timestamp: ts,
        pointerType: pointerType ?? 'gesture',
        source,
      };
      setSwipeEvents((p) => [...p, swipe]);
      push('swipe', swipe); 
    }
  };

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      logPointerEvent(e, 'down');
      downDataRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY, ts: Date.now() });
    };
    const onUp = (e: PointerEvent) => {
      logPointerEvent(e, 'up');
      const d = downDataRef.current.get(e.pointerId);
      if (d) {
        processGesture(d.x, d.y, e.clientX, e.clientY, d.ts, e.pointerId, e.pointerType, e);
        downDataRef.current.delete(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => logPointerEvent(e, 'move');

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointermove', onMove);

    el.getScrollElement().then((scrollEl) => {
      const g = createGesture({
        el: scrollEl,
        gestureName: 'swipe-gesture',
        threshold: 0,
        onStart: (d) => {
          downDataRef.current.set(-1, { x: d.startX, y: d.startY, ts: Date.now() });
        },
        onEnd: (d) => {
          const data = downDataRef.current.get(-1);
          if (data) {
            processGesture(data.x, data.y, d.currentX, d.currentY, data.ts, null, 'gesture', undefined, 'gesture');
            downDataRef.current.delete(-1);
          }
        },
      });
      g.enable(true);
      gestureRef.current = g;
    });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointermove', onMove);
      gestureRef.current?.destroy();
    };
  }, [contentRef, send]); 

  return { swipes: swipeEvents, taps: tapEvents, downEvents, upEvents, moveEvents };
};
