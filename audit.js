// audit.js：四条不变量（给定，不写）
import { normOf } from "./unify.js";

const ALLOWED = ["E_UNIFY", "E_OCCURS", "E_BAD_TYPE", "E_BAD_VAR"];

function hasVar(term, id) {
  if (!Array.isArray(term) || term.length === 0) {
    return false;
  }
  if (term[0] === "var") {
    return term[1] === id;
  }
  if (term[0] === "fun") {
    return hasVar(term[1], id) || hasVar(term[2], id);
  }
  return false;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function substOk(state) {
  try {
    const subst = state.subst || [];
    for (let at = 0; at < subst.length; at += 1) {
      const pair = subst[at];
      if (!Array.isArray(pair) || pair.length !== 2) {
        return false;
      }
      if (!Number.isInteger(pair[0]) || pair[0] < 0) {
        return false;
      }
      if (at > 0 && subst[at - 1][0] >= pair[0]) {
        return false;
      }
      if (hasVar(pair[1], pair[0])) {
        return false;
      }
      if (!same(normOf(pair[1], subst), pair[1])) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function roundsOk(state) {
  try {
    const rounds = state.rounds || [];
    if (rounds.length !== state.unifies) {
      return false;
    }
    if (state.oks + state.bad !== state.unifies) {
      return false;
    }
    if ((state.codes || []).length !== state.bad) {
      return false;
    }
    const seen = [];
    for (const row of rounds) {
      if (!Array.isArray(row) || row.length !== 4) {
        return false;
      }
      if (row[2] === true) {
        if (row[3] !== "") {
          return false;
        }
      } else if (row[2] === false) {
        if (typeof row[3] !== "string" || row[3] === "") {
          return false;
        }
        seen.push(row[3]);
      } else {
        return false;
      }
    }
    return same(seen, state.codes || []);
  } catch (error) {
    return false;
  }
}

export function showsOk(state) {
  try {
    const shows = state.shows || [];
    if (shows.length !== state.looks) {
      return false;
    }
    for (const row of shows) {
      if (!Array.isArray(row) || row.length !== 2) {
        return false;
      }
      normOf(row[0], []);
      normOf(row[1], []);
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function codesOk(state) {
  try {
    if ((state.codes || []).length !== state.bad) {
      return false;
    }
    for (const code of state.codes || []) {
      if (ALLOWED.indexOf(code) < 0) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}
