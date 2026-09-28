// app.js：把事件流跑成推演台要用的视图（给定，不写）
import { show, merge, reset } from "./ops.js";
import { substOk, roundsOk, showsOk, codesOk } from "./audit.js";

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function badEvent() {
  const error = new Error("E_BAD_EVENT");
  error.code = "E_BAD_EVENT";
  return error;
}

export function applyEvent(state, event) {
  if (!event || typeof event.kind !== "string") {
    throw badEvent();
  }
  if (event.kind === "show") {
    return show(state, event.term);
  }
  if (event.kind === "merge") {
    return merge(state, event.left, event.right);
  }
  if (event.kind === "reset") {
    return reset(state);
  }
  throw badEvent();
}

export function render(spec) {
  let state = copy(spec.state);
  const steps = [];
  const stepOk = [];
  const stepKind = [];
  const roundSteps = [];
  const events = spec.events || [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    let applied = null;
    try {
      applied = applyEvent(state, event);
    } catch (error) {
      applied = null;
    }
    stepOk.push(applied !== null);
    stepKind.push(event && typeof event.kind === "string" ? event.kind : "?");
    if (applied !== null) {
      state = applied;
      if (event.kind === "merge") {
        roundSteps.push(index + 1);
      }
    }
    steps.push(copy(state));
  }
  return {
    subst: state.subst,
    shows: state.shows,
    rounds: state.rounds,
    codes: state.codes,
    unifies: state.unifies,
    oks: state.oks,
    bad: state.bad,
    growth: state.growth,
    resets: state.resets,
    looks: state.looks,
    subst_ok: substOk(state),
    rounds_ok: roundsOk(state),
    shows_ok: showsOk(state),
    codes_ok: codesOk(state),
    steps: steps,
    step_ok: stepOk,
    step_kind: stepKind,
    round_steps: roundSteps,
    count_events: (spec.events || []).length,
    failed_events: stepOk.filter(function (flag) { return !flag; }).length,
    last_round: state.rounds.length > 0 ? state.rounds[state.rounds.length - 1] : null
  };
}
