import React, { useRef, useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';

interface Position {
  x: number;
  y: number;
}

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

// Define types for tap and swipe events (matching useGestureTracking)
interface TapEvent {
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
  duration: number;
  timestamp: number;
  pointerType: string;
  target: string;
  source?: string;
}

interface SwipeEvent {
  pointerId: number;
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
  pointerType: string;
  source?: string;
}

const ScratchCard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRenderRef = useRef<HTMLImageElement>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [isShining, setIsShining] = useState(true);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hiddenNumber] = useState(() => Math.floor(Math.random() * 100) + 1);
  const clearDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setImageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const startTimeRef = useRef<number>(0); // Added to track gesture start time
  const previousUrlRef = useRef<string>('');

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const devicePixelRatio = window.devicePixelRatio || 1;

  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error: wsError } = useWebSocket('ws://localhost:8081');

  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send, isConnected);

  console.log(taps);

  // Gesture detection thresholds (consistent with useGestureTracking)
  const HOLD_THRESHOLD = 10;
  const SWIPE_DISTANCE_THRESHOLD = 15;
  const SWIPE_TIME_THRESHOLD = 1000;
  const TAP_TIME_THRESHOLD = 1000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    requestAnimationFrame(() => {
      const canvasWidth = canvas.offsetWidth * devicePixelRatio;
      const canvasHeight = canvas.offsetHeight * devicePixelRatio;

      if (canvasWidth > 0 && canvasHeight > 0) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.scale(devicePixelRatio, devicePixelRatio);
        setCanvasReady(true);
      }
    });
  }, [devicePixelRatio]);

  const getPosition = useCallback((e: PointerEvent): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const { left, top } = canvas.getBoundingClientRect();
    return {
      x: e.clientX - left,
      y: e.clientY - top,
    };
  }, []);

  const plotLine = useCallback((context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const diffX = Math.abs(x2 - x1);
    const diffY = Math.abs(y2 - y1);
    const dist = Math.sqrt(diffX * diffX + diffY * diffY);
    const step = dist / 50;
    let i = 0;

    while (i < dist) {
      const t = Math.min(1, i / dist);
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      context.beginPath();
      context.arc(x, y, 16, 0, Math.PI * 2);
      context.fill();
      i += step;
    }
  }, []);

  const setImageFromCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const canvasRender = canvasRenderRef.current;
    if (!canvas || !canvasRender) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const previousUrl = previousUrlRef.current;
      canvasRender.src = url;

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      previousUrlRef.current = url;
    });
  }, []);

  const checkBlackFillPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (canvasWidth === 0 || canvasHeight === 0) return;

    const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixelData = imageData.data;
    let blackPixelCount = 0;

    for (let i = 0; i < pixelData.length; i += 4) {
      const red = pixelData[i];
      const green = pixelData[i + 1];
      const blue = pixelData[i + 2];
      const alpha = pixelData[i + 3];
      if (red === 0 && green === 0 && blue === 0 && alpha === 255) {
        blackPixelCount++;
      }
    }

    const blackFillPercentage = (blackPixelCount * 100) / (canvasWidth * canvasHeight);

    if (blackFillPercentage >= 45) {
      setIsCleared(true);
    }
  }, [canvasReady]);

  const plot = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { x, y } = getPosition(e);
    plotLine(context, positionRef.current.x, positionRef.current.y, x, y);
    positionRef.current = { x, y };

    if (isSafari) {
      if (setImageTimeoutRef.current) {
        clearTimeout(setImageTimeoutRef.current);
      }
      setImageTimeoutRef.current = setTimeout(() => {
        setImageFromCanvas();
      }, 5);
    }
  }, [getPosition, plotLine, setImageFromCanvas, isSafari, canvasReady]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canvasReady) return;

    setIsShining(false);
    positionRef.current = getPosition(e.nativeEvent);
    startTimeRef.current = Date.now(); // Record gesture start time
    setIsPointerDown(true);

    if (clearDetectionTimeoutRef.current) {
      clearTimeout(clearDetectionTimeoutRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => plot(e);
    const handlePointerUp = (e: PointerEvent) => {
      const endPosition = getPosition(e);
      const startPosition = positionRef.current;
      const startTime = startTimeRef.current;
      const endTime = Date.now();
      const dx = endPosition.x - startPosition.x;
      const dy = endPosition.y - startPosition.y;
      const dist = Math.hypot(dx, dy);
      const dur = endTime - startTime;

      // Detect tap
      if (dist < HOLD_THRESHOLD && dur < TAP_TIME_THRESHOLD) {
        const tap: TapEvent = {
          pointerId: e.pointerId,
          clientX: endPosition.x,
          clientY: endPosition.y,
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
          duration: dur,
          timestamp: endTime,
          pointerType: e.pointerType,
          target: 'CANVAS',
          source: 'scratchcard',
        };
        send({ type: 'tap', ts: Date.now(), data: tap });
      }
      // Detect swipe
      else if (dur < SWIPE_TIME_THRESHOLD && dist > SWIPE_DISTANCE_THRESHOLD) {
        const direction = Math.abs(dx) > Math.abs(dy)
          ? dx > 0 ? 'right' : 'left'
          : dy > 0 ? 'down' : 'up';
        const swipe: SwipeEvent = {
          pointerId: e.pointerId,
          startX: startPosition.x,
          startY: startPosition.y,
          endX: endPosition.x,
          endY: endPosition.y,
          deltaX: dx,
          deltaY: dy,
          distance: dist,
          duration: dur,
          direction,
          timestamp: endTime,
          pointerType: e.pointerType,
          source: 'scratchcard',
        };
        send({ type: 'swipe', ts: Date.now(), data: swipe });
      }

      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsPointerDown(false);

      clearDetectionTimeoutRef.current = setTimeout(() => {
        checkBlackFillPercentage();
      }, 500);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [getPosition, plot, checkBlackFillPercentage, canvasReady, send]);

  useEffect(() => {
    return () => {
      if (clearDetectionTimeoutRef.current) {
        clearTimeout(clearDetectionTimeoutRef.current);
      }
      if (setImageTimeoutRef.current) {
        clearTimeout(setImageTimeoutRef.current);
      }
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  return (
    <Layout contentRef={contentRef}>
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 bg-gradient-radial from-white via-white to-slate-300 font-sans -mt-40">
        <div className="relative border-4 border-gray-400 rounded-lg p-3 w-80 h-80 bg-white">
          <div
            className={`absolute inset-0 z-10 rounded transition-opacity duration-400 ${isCleared ? 'opacity-0' : 'opacity-100'
              } ${isCleared ? 'pointer-events-none' : ''}`}
            style={{ filter: 'url(#remove-black)' }}
          >
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 z-20 w-full h-full cursor-grab touch-none ${isSafari ? 'opacity-0' : ''
                } ${isPointerDown ? 'cursor-grabbing' : ''}`}
              width={520}
              height={520}
              onPointerDown={handlePointerDown}
            />
            {isSafari && (
              <img
                ref={canvasRenderRef}
                className="absolute inset-0 z-10 w-full h-full bg-transparent transition-colors duration-200"
                alt=""
              />
            )}
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 overflow-hidden flex justify-center items-center ${isShining ? 'animate-shine' : ''
                }`}
            >
              <div
                className={`absolute inset-0 w-full h-full bg-gradient-to-br from-transparent via-white/80 to-transparent bg-no-repeat ${isShining ? 'animate-shine-move' : ''
                  }`}
                style={{
                  backgroundSize: '300% 300%',
                  backgroundPosition: 'bottom right'
                }}
              />
              <div
                className="absolute inset-0 w-full h-full opacity-10"
                style={{ filter: 'url(#noise)' }}
              />
              <svg className="w-full h-full fill-gray-600 opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
                <path d="M72.417 85.633a2 2 0 1 0-3.42-2.075l-3.113 5.129a2 2 0 1 0 3.42 2.075l3.113-5.129zm-8.301 13.679a2 2 0 1 0-3.42-2.075l-3.113 5.129a2 2 0 0 0 3.42 2.075l3.113-5.129zm11.997 1.432a2 2 0 0 1-2.747.672l-5.129-3.113a2 2 0 1 1 2.075-3.42l5.129 3.113a2 2 0 0 1 .672 2.748zm-16.425-7.629a2 2 0 1 0 2.075-3.42l-5.129-3.113a2 2 0 0 0-2.075 3.42l5.129 3.113z" />
                <path d="M201.469 137.109H177.45a24.65 24.65 0 0 0 6.167-3.906c1.284-1.141 2.317-2.535 3.037-4.095s1.108-3.25 1.143-4.967a13.98 13.98 0 0 0-.982-5.566 13.96 13.96 0 0 0-3.105-4.722 13.98 13.98 0 0 0-4.722-3.106 13.96 13.96 0 0 0-5.566-.981c-1.717.035-3.408.424-4.968 1.143a12.48 12.48 0 0 0-4.095 3.036c-2.885 3.257-4.702 7.5-5.859 11.568-1.147-4.068-2.964-8.301-5.859-11.568a12.48 12.48 0 0 0-4.095-3.036c-1.56-.719-3.251-1.108-4.968-1.143a13.96 13.96 0 0 0-5.566.981 13.98 13.98 0 0 0-4.722 3.106 13.96 13.96 0 0 0-3.105 4.722 13.98 13.98 0 0 0-.982 5.566c.035 1.717.424 3.408 1.143 4.967s1.753 2.954 3.037 4.095a24.65 24.65 0 0 0 6.167 3.906h-24.019a5.86 5.86 0 0 0-4.143 1.717c-1.099 1.098-1.716 2.589-1.716 4.143v15.625a5.86 5.86 0 0 0 5.859 5.859h1.953v33.203a5.86 5.86 0 0 0 5.86 5.86h70.312a5.86 5.86 0 0 0 5.86-5.86v-33.203h1.953a5.86 5.86 0 0 0 5.859-5.859v-15.625c0-1.554-.617-3.045-1.716-4.143a5.86 5.86 0 0 0-4.143-1.717zm-34.18-20.576a8.6 8.6 0 0 1 6.25-2.861h.298c1.345.001 2.676.272 3.915.797s2.36 1.292 3.297 2.257a10.05 10.05 0 0 1 2.159 3.361c.488 1.253.72 2.592.683 3.936-.022 1.183-.287 2.349-.779 3.424s-1.201 2.038-2.083 2.826c-5.903 5.225-16.147 6.451-20.508 6.734.303-4.326 1.524-14.546 6.768-20.474zm-34.18 7.49c-.037-1.344.195-2.683.683-3.936a10.05 10.05 0 0 1 2.159-3.361c.937-.965 2.058-1.733 3.297-2.257s2.57-.796 3.915-.797h.298a8.6 8.6 0 0 1 6.25 2.861c5.229 5.904 6.45 16.148 6.733 20.508-4.34-.283-14.585-1.509-20.507-6.733-.88-.796-1.585-1.765-2.071-2.847a8.6 8.6 0 0 1-.757-3.438zm-19.531 34.571v-15.625c0-.518.206-1.015.572-1.381a1.95 1.95 0 0 1 1.381-.572h41.016v19.531h-41.016c-.518 0-1.015-.206-1.381-.572s-.572-.863-.572-1.381zm7.813 39.062v-33.203h35.156v35.156h-33.203a1.95 1.95 0 0 1-1.953-1.953zm74.218 0a1.95 1.95 0 0 1-1.953 1.953h-33.203v-35.156h35.156v33.203zm7.813-39.062c0 .518-.206 1.015-.572 1.381s-.863.572-1.381.572h-41.016v-19.531h41.016a1.95 1.95 0 0 1 1.381.572c.366.366.572.863.572 1.381v15.625z" />
              </svg>
            </div>
          </div>
          <div
            className="rounded w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white select-none"
            style={{ filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.16))' }}
          >
            <div className="text-center">
              <div className="text-8xl font-bold mb-4">{hiddenNumber}</div>
              <div className="text-lg font-semibold">REMEMBER THIS NUMBER</div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg mb-4 text-black font-bold">
            {!isCleared ? 'Scratch to reveal the number!' : 'Enter the number you saw:'}
          </p>
          {isCleared && (
            <div className="flex flex-col items-center gap-3">
              <input
                type="number"
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setIsCorrect(null);
                }}
                placeholder="Enter the number"
                style={{ color: 'black', fontWeight: 'bold' }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-lg text-center w-48 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => {
                  const correct = parseInt(userInput) === hiddenNumber;
                  setIsCorrect(correct);
                }}
                disabled={!userInput.trim()}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: userInput.trim() ? '#8B5CF6' : '#D1D5DB',
                  color: userInput.trim() ? 'white' : 'black',
                  borderRadius: '0.5rem',
                  border: 'none'
                }}
              >
                Check Answer
              </button>
              {isCorrect !== null && (
                <div className={`text-lg font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? 'Correct! Well done!' : `Wrong! The number was ${hiddenNumber}`}
                </div>
              )}
            </div>
          )}
        </div>
        <svg width="0" height="0" className="absolute">
          <defs>
            <filter id="remove-black" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        -1 -1 -1 0 1"
                result="black-pixels"
              />
              <feComposite in="SourceGraphic" in2="black-pixels" operator="out" />
            </filter>
            <filter id="noise">
              <feTurbulence baseFrequency="0.5"></feTurbulence>
            </filter>
          </defs>
        </svg>
        <style>
          {`
            @keyframes shine-move {
              50% { background-position: 0% 0%; }
              100% { background-position: -50% -50%; }
            }
            .animate-shine-move { animation: shine-move 8s infinite; }
          `}
        </style>
      </div>
    </Layout>
  );
};

export default ScratchCard;