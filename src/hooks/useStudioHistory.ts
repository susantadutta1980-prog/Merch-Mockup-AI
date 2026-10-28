import { useState, useCallback, useEffect, useRef } from 'react';
import { LogoConfig, VirtualLightingConfig } from '../types/merch';

export interface StudioHistoryState {
  logo: LogoConfig;
  lighting: VirtualLightingConfig;
  selectedColorwayId: string;
  selectedSizeId: string;
  selectedAreaId: string;
  selectedBackgroundId: string;
}

const MAX_HISTORY_STEPS = 50;

function isStateEqual(a: StudioHistoryState, b: StudioHistoryState): boolean {
  return (
    a.logo.xOffsetPercent === b.logo.xOffsetPercent &&
    a.logo.yOffsetPercent === b.logo.yOffsetPercent &&
    a.logo.scalePercent === b.logo.scalePercent &&
    a.logo.rotationDeg === b.logo.rotationDeg &&
    a.logo.opacity === b.logo.opacity &&
    a.logo.colorTint === b.logo.colorTint &&
    a.logo.printMethod === b.logo.printMethod &&
    a.logo.dataUrl === b.logo.dataUrl &&
    a.lighting.intensity === b.lighting.intensity &&
    a.lighting.mood === b.lighting.mood &&
    a.lighting.angleDeg === b.lighting.angleDeg &&
    a.lighting.shadowOpacity === b.lighting.shadowOpacity &&
    a.lighting.warmth === b.lighting.warmth &&
    a.selectedColorwayId === b.selectedColorwayId &&
    a.selectedSizeId === b.selectedSizeId &&
    a.selectedAreaId === b.selectedAreaId &&
    a.selectedBackgroundId === b.selectedBackgroundId
  );
}

export function useStudioHistory(initialState: StudioHistoryState) {
  const [history, setHistory] = useState<{
    past: StudioHistoryState[];
    present: StudioHistoryState;
    future: StudioHistoryState[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  const isUndoOrRedoAction = useRef(false);
  const debounceTimerRef = useRef<any>(null);
  const pendingStateRef = useRef<StudioHistoryState | null>(null);

  // Immediate record (for discrete clicks like colorway, print method, size)
  const recordState = useCallback((newState: StudioHistoryState) => {
    if (isUndoOrRedoAction.current) {
      isUndoOrRedoAction.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setHistory((curr) => {
      if (isStateEqual(curr.present, newState)) {
        return curr;
      }

      const newPast = [...curr.past, curr.present];
      if (newPast.length > MAX_HISTORY_STEPS) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [],
      };
    });
  }, []);

  // Debounced record (for continuous slider scrubs or mouse drags)
  const recordStateDebounced = useCallback((newState: StudioHistoryState, delayMs = 300) => {
    if (isUndoOrRedoAction.current) {
      isUndoOrRedoAction.current = false;
      return;
    }

    pendingStateRef.current = newState;

    // Immediately update present so UI renders live with 0 latency
    setHistory((curr) => ({
      ...curr,
      present: newState,
    }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!pendingStateRef.current) return;
      const targetState = pendingStateRef.current;
      pendingStateRef.current = null;

      setHistory((curr) => {
        if (curr.past.length > 0 && isStateEqual(curr.past[curr.past.length - 1], targetState)) {
          return curr;
        }

        // Commit snapshot of before the drag into past
        const lastCommitted = curr.past[curr.past.length - 1] || curr.present;
        if (isStateEqual(lastCommitted, targetState)) {
          return curr;
        }

        const newPast = [...curr.past, curr.present];
        if (newPast.length > MAX_HISTORY_STEPS) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: targetState,
          future: [],
        };
      });
    }, delayMs);
  }, []);

  // Undo step
  const undo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      isUndoOrRedoAction.current = true;
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  // Redo step
  const redo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      isUndoOrRedoAction.current = true;
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (modifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    pastCount: history.past.length,
    futureCount: history.future.length,
    undo,
    redo,
    recordState,
    recordStateDebounced,
  };
}
