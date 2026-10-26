import * as React from 'react';
import {
  autopilot,
  detentSpeed,
  initialSim,
  resultOf,
  step,
  type DockResult,
  type Sim,
  type Wind,
} from './sim';

export type Status = 'running' | 'paused' | 'docked';

export interface Docking {
  sim: Sim;
  status: Status;
  throttle: -1 | 0 | 1 | 2;
  rudder: number;
  auto: boolean;
  slow: boolean;
  trail: readonly { x: number; y: number }[];
  setThrottle: (n: -1 | 0 | 1 | 2) => void;
  nudgeThrottle: (d: 1 | -1) => void;
  holdRudder: (v: -1 | 0 | 1) => void;
  pulseRudder: (v: -1 | 1) => void;
  setAuto: (on: boolean) => void;
  setSlow: (on: boolean) => void;
  togglePause: () => void;
  restart: () => void;
  result: () => DockResult;
}

const THROTTLES = [-1, 0, 1, 2] as const;

/**
 * The docking toy's loop. State lives in a ref and is copied to React once per
 * frame. The loop pauses when the tab is hidden and never runs while paused.
 */
export function useDocking(wind: Wind, startAuto: boolean): Docking {
  const simRef = React.useRef<Sim>({ ...initialSim(), usedAuto: startAuto });
  const [sim, setSim] = React.useState<Sim>(simRef.current);
  const [status, setStatus] = React.useState<Status>('running');
  const [throttle, setThrottleState] = React.useState<-1 | 0 | 1 | 2>(0);
  const [rudder, setRudder] = React.useState(0);
  const [auto, setAutoState] = React.useState(startAuto);
  const [slow, setSlow] = React.useState(false);
  const trailRef = React.useRef<{ x: number; y: number }[]>([]);
  const live = React.useRef({ throttle, rudder, auto, slow });
  live.current = { throttle, rudder, auto, slow };
  const pulse = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (status !== 'running') return;
    let raf = 0;
    let last = performance.now();
    let sinceTrail = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * (live.current.slow ? 0.5 : 1);
      last = now;
      const cur = simRef.current;
      const l = live.current;
      const input = l.auto
        ? autopilot(cur, wind)
        : { speed: detentSpeed(l.throttle), rudder: l.rudder };
      const next = step(cur, dt, input, wind);
      simRef.current = next;
      sinceTrail += dt;
      if (sinceTrail > 0.3) {
        sinceTrail = 0;
        trailRef.current = [...trailRef.current.slice(-50), { x: next.x, y: next.y }];
      }
      setSim(next);
      if (next.docked) {
        setStatus('docked');
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onHide = () => {
      if (document.hidden) setStatus('paused');
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [status, wind]);

  const takeHelm = React.useCallback(() => {
    if (live.current.auto) setAutoState(false);
  }, []);

  const api: Docking = {
    sim,
    status,
    throttle,
    rudder,
    auto,
    slow,
    trail: trailRef.current,
    setThrottle: (n) => {
      if (live.current.auto) {
        setAutoState(false);
      }
      setThrottleState(n);
    },
    nudgeThrottle: (d) => {
      const i = THROTTLES.indexOf(live.current.throttle);
      const n = THROTTLES[Math.min(3, Math.max(0, i + d))] ?? 0;
      takeHelm();
      setThrottleState(n);
    },
    holdRudder: (v) => {
      if (v !== 0) takeHelm();
      window.clearTimeout(pulse.current);
      setRudder(v);
    },
    pulseRudder: (v) => {
      takeHelm();
      setRudder(v);
      window.clearTimeout(pulse.current);
      pulse.current = window.setTimeout(() => setRudder(0), 450);
    },
    setAuto: (on) => {
      if (on) simRef.current = { ...simRef.current, usedAuto: true };
      setAutoState(on);
    },
    setSlow,
    togglePause: () =>
      setStatus((s) => (s === 'running' ? 'paused' : s === 'paused' ? 'running' : s)),
    restart: () => {
      simRef.current = initialSim();
      trailRef.current = [];
      setSim(simRef.current);
      setThrottleState(0);
      setRudder(0);
      setAutoState(false);
      setStatus('running');
    },
    result: () => resultOf(simRef.current),
  };
  return api;
}

/** Arrow keys and WASD, while the play screen is on. Up/down step the throttle, left/right hold the rudder. */
export function useDockKeys(d: Docking): void {
  const ref = React.useRef(d);
  ref.current = d;
  React.useEffect(() => {
    const dir = (k: string): -1 | 1 | 0 =>
      k === 'ArrowLeft' || k === 'a' || k === 'A'
        ? -1
        : k === 'ArrowRight' || k === 'd' || k === 'D'
          ? 1
          : 0;
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault();
        if (!e.repeat) ref.current.nudgeThrottle(1);
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault();
        if (!e.repeat) ref.current.nudgeThrottle(-1);
      } else if (dir(k) !== 0) {
        e.preventDefault();
        ref.current.holdRudder(dir(k) as -1 | 1);
      } else if (k === 'p' || k === 'P') {
        ref.current.togglePause();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (dir(e.key) !== 0) ref.current.holdRudder(0);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}

/** Calls `onDone` with the result a moment after the boat docks, so the reviewer sees it settle. */
export function useFinish(d: Docking, onDone: (r: DockResult) => void): void {
  const ref = React.useRef({ d, onDone });
  ref.current = { d, onDone };
  const docked = d.status === 'docked';
  React.useEffect(() => {
    if (!docked) return undefined;
    const t = window.setTimeout(() => ref.current.onDone(ref.current.d.result()), 900);
    return () => window.clearTimeout(t);
  }, [docked]);
}
