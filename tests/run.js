import assert from "node:assert";
import { normOf, unify } from "../unify.js";
import { merge } from "../ops.js";
import { render } from "../app.js";

const base = {
  subst: [], shows: [], rounds: [], codes: [],
  unifies: 0, oks: 0, bad: 0, growth: 0, resets: 0, looks: 0
};
const spec = {
  state: base,
  events: [{ kind: "show", term: ["var", 0] }, { kind: "merge", left: ["var", 0], right: ["int"] }]
};

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok " + name);
  } catch (error) {
    failed += 1;
    console.log("FAIL " + name + " :: " + error.message);
  }
}

check("normOf 给数组", () => {
  assert.ok(Array.isArray(normOf(["var", 0], [])));
});

check("normOf 未绑定变量原样", () => {
  assert.deepStrictEqual(normOf(["var", 0], []), ["var", 0]);
});

check("unify 给表", () => {
  assert.ok(Array.isArray(unify(["var", 0], ["int"], [])));
});

check("merge 记一步", () => {
  assert.strictEqual(merge(base, ["var", 0], ["int"]).unifies, 1);
});

check("render 数事件", () => {
  assert.strictEqual(render(spec).count_events, 2);
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
