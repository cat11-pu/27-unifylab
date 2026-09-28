// unify.js：类型项的规范形态与合一
function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function validTerm(term) {
  if (!Array.isArray(term) || term.length === 0) {
    fail("E_BAD_TYPE");
  }
  if (term[0] === "var") {
    const id = term[1];
    if (!Number.isInteger(id) || id < 0) {
      fail("E_BAD_VAR");
    }
    if (term.length !== 2) {
      fail("E_BAD_TYPE");
    }
    return;
  }
  if (term[0] === "int") {
    if (term.length !== 1) {
      fail("E_BAD_TYPE");
    }
    return;
  }
  if (term[0] === "fun") {
    if (term.length !== 3) {
      fail("E_BAD_TYPE");
    }
    validTerm(term[1]);
    validTerm(term[2]);
    return;
  }
  fail("E_BAD_TYPE");
}

function occurs(id, term) {
  if (term[0] === "var") {
    return term[1] === id;
  }
  if (term[0] === "fun") {
    return occurs(id, term[1]) || occurs(id, term[2]);
  }
  return false;
}

// 写入一条新绑定，并让它回头作用到表里每一条已有值上
function bind(id, value, subst) {
  const merged = [];
  let placed = false;
  for (const pair of subst) {
    if (!placed && id < pair[0]) {
      merged.push([id, value]);
      placed = true;
    }
    merged.push([pair[0], pair[1]]);
  }
  if (!placed) {
    merged.push([id, value]);
  }
  return merged.map(function (pair) {
    return [pair[0], normOf(pair[1], merged)];
  });
}

export function normOf(term, subst) {
  validTerm(term);
  if (term[0] === "var") {
    const id = term[1];
    for (const pair of subst) {
      if (pair[0] === id) {
        return normOf(pair[1], subst);
      }
    }
    return ["var", id];
  }
  if (term[0] === "int") {
    return ["int"];
  }
  return ["fun", normOf(term[1], subst), normOf(term[2], subst)];
}

export function unify(left, right, subst) {
  const a = normOf(left, subst);
  const b = normOf(right, subst);
  if (a[0] === "var" && b[0] === "var" && a[1] === b[1]) {
    return subst;
  }
  if (a[0] === "var") {
    if (occurs(a[1], b)) {
      fail("E_OCCURS");
    }
    return bind(a[1], b, subst);
  }
  if (b[0] === "var") {
    if (occurs(b[1], a)) {
      fail("E_OCCURS");
    }
    return bind(b[1], a, subst);
  }
  if (a[0] === "int" && b[0] === "int") {
    return subst;
  }
  if (a[0] === "fun" && b[0] === "fun") {
    const afterLeft = unify(a[1], b[1], subst);
    return unify(a[2], b[2], afterLeft);
  }
  fail("E_UNIFY");
}
