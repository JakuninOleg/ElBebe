export interface ScrollHeaderState { y: number; travel: number; sticky: boolean; hidden: boolean; }

/** Accumulate a short directional movement so trackpad jitter cannot flicker the menu. */
export function updateScrollHeader(state: ScrollHeaderState, y: number, threshold: number, keepOpen = false): ScrollHeaderState {
  y = Math.max(0, y);
  if (y <= threshold) return { y, travel: 0, sticky: false, hidden: false };
  const delta = y - state.y;
  const travel = Math.sign(delta) === Math.sign(state.travel) ? state.travel + delta : delta;
  const hidden = keepOpen ? false : travel > 14 ? true : travel < -8 ? false : state.hidden || !state.sticky;
  return { y, travel, sticky: true, hidden };
}
