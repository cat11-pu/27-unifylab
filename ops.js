// ops.js：记项、合一与重置（基线：一律原样返回）
import { normOf, unify } from "./unify.js";

export function show(state, term) {
  const settled = normOf(term, state.subst);
  return {
    subst: state.subst,
    shows: state.shows.concat([[term, settled]]),
    rounds: state.rounds,
    codes: state.codes,
    unifies: state.unifies,
    oks: state.oks,
    bad: state.bad,
    growth: state.growth,
    resets: state.resets,
    looks: state.looks + 1
  };
}

export function merge(state, left, right) {
  let nextSubst = state.subst;
  let ok = false;
  let code = "";
  try {
    nextSubst = unify(left, right, state.subst);
    ok = true;
  } catch (error) {
    code = error && error.code ? error.code : "E_UNIFY";
  }
  return {
    subst: nextSubst,
    shows: state.shows,
    rounds: state.rounds.concat([[left, right, ok, code]]),
    codes: ok ? state.codes : state.codes.concat([code]),
    unifies: state.unifies + 1,
    oks: state.oks + (ok ? 1 : 0),
    bad: state.bad + (ok ? 0 : 1),
    growth: state.growth + (ok ? nextSubst.length - state.subst.length : 0),
    resets: state.resets,
    looks: state.looks
  };
}

export function reset(state) {
  return {
    subst: [],
    shows: state.shows,
    rounds: state.rounds,
    codes: state.codes,
    unifies: state.unifies,
    oks: state.oks,
    bad: state.bad,
    growth: state.growth,
    resets: state.resets + 1,
    looks: state.looks
  };
}
