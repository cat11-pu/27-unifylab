import fs from "node:fs";
import { normOf, unify } from "./unify.js";
import { show, merge, reset } from "./ops.js";
import { applyEvent } from "./app.js";
import { substOk, roundsOk, showsOk, codesOk } from "./audit.js";

const __lines = [];
function emit(label, value) {
  __lines.push([String(label), value]);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/unify.json", "utf8"));

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function run(events) {
  let state = copy(spec.state);
  let failed = 0;
  for (const event of events) {
    try {
      state = applyEvent(state, event);
    } catch (error) {
      failed += 1;
    }
  }
  return { state: state, failed: failed };
}

function fingerprint(state) {
  return JSON.stringify([state.subst, state.shows, state.rounds, state.codes, state.unifies,
                         state.oks, state.bad, state.growth, state.resets, state.looks]);
}

const whole = run(spec.events || []);
const state = whole.state;
const half = Math.ceil((spec.events || []).length / 2);
const part = run((spec.events || []).slice(0, half));
let tail = part.state;
let tailFailed = 0;
for (const event of (spec.events || []).slice(half)) {
  try {
    tail = applyEvent(tail, event);
  } catch (error) {
    tailFailed += 1;
  }
}
const replay = run(spec.events || []);

function keepsTableOnFailure() {
  let probe = copy(spec.state);
  probe = merge(probe, ["var", 0], ["int"]);
  const before = JSON.stringify(probe.subst);
  probe = merge(probe, ["int"], ["fun", ["int"], ["int"]]);
  return JSON.stringify(probe.subst) === before ? 1 : 0;
}

function idempotent() {
  let probe = copy(spec.state);
  probe = merge(probe, ["var", 0], ["int"]);
  probe = merge(probe, ["var", 1], ["var", 0]);
  probe = merge(probe, ["fun", ["var", 1], ["var", 2]], ["fun", ["var", 0], ["int"]]);
  if (probe.subst.length !== 3) {
    return 0;
  }
  for (const pair of probe.subst) {
    const once = normOf(pair[1], probe.subst);
    if (JSON.stringify(once) !== JSON.stringify(pair[1])) {
      return 0;
    }
    if (JSON.stringify(normOf(once, probe.subst)) !== JSON.stringify(once)) {
      return 0;
    }
  }
  return 1;
}

function identityLength() {
  let probe = copy(spec.state);
  probe = merge(probe, ["var", 2], ["var", 2]);
  return probe.subst.length;
}

emit("替换表", state.subst);
emit("表长", state.subst.length);
emit("项规范形态", state.shows);
emit("合一流水", state.rounds);
emit("流水标记", state.rounds.map(function (row) { return row[2] ? 1 : 0; }));
emit("失败码", state.codes);
emit("合一次数与成败", [state.unifies, state.oks, state.bad]);
emit("累计绑定", state.growth);
emit("重置次数", state.resets);
emit("记项次数", state.looks);
emit("表自洽", substOk(state));
emit("流水自洽", roundsOk(state));
emit("记项自洽", showsOk(state));
emit("码账自洽", codesOk(state));
emit("失败不动表", keepsTableOnFailure());
emit("替换幂等", idempotent());
emit("重放不新增", fingerprint(replay.state) === fingerprint(state) ? 0 : 1);
emit("重放报错", replay.failed);
emit("中态不同", fingerprint(part.state) !== fingerprint(state));
emit("拆两轮一致", fingerprint(tail) === fingerprint(state) && tailFailed === whole.failed - part.failed);
emit("异常事件数", whole.failed);
emit("恒等合一表长", identityLength());

// ---- 异常路径探针：真调用实现，看它报出什么码 ----
try {
  unify(["int"], ["fun", ["int"], ["int"]], []);
  emit("构造冲突", "没有报错");
} catch (error) {
  emit("构造冲突", error && error.code ? error.code : String(error.message));
}
try {
  unify(["var", 0], ["fun", ["var", 0], ["int"]], []);
  emit("自引用", "没有报错");
} catch (error) {
  emit("自引用", error && error.code ? error.code : String(error.message));
}
try {
  normOf(["pair", ["int"]], []);
  emit("坏标签", "没有报错");
} catch (error) {
  emit("坏标签", error && error.code ? error.code : String(error.message));
}
try {
  normOf(["var", -2], []);
  emit("坏变量号", "没有报错");
} catch (error) {
  emit("坏变量号", error && error.code ? error.code : String(error.message));
}
try {
  unify(["fun", ["int"]], ["fun", ["int"], ["int"]], []);
  emit("元数不对", "没有报错");
} catch (error) {
  emit("元数不对", error && error.code ? error.code : String(error.message));
}
try {
  const held = unify(["var", 0], ["int"], []);
  unify(["var", 0], ["fun", ["int"], ["int"]], held);
  emit("已绑定冲突", "没有报错");
} catch (error) {
  emit("已绑定冲突", error && error.code ? error.code : String(error.message));
}

// ---- 期望值（参考模型算出）----
const EXPECTED = {
  "替换表": [],
  "表长": 0,
  "项规范形态": [
    [
      [
        "fun",
        [
          "var",
          1
        ],
        [
          "var",
          3
        ]
      ],
      [
        "fun",
        [
          "int"
        ],
        [
          "var",
          3
        ]
      ]
    ],
    [
      [
        "var",
        3
      ],
      [
        "int"
      ]
    ]
  ],
  "合一流水": [
    [
      [
        "var",
        0
      ],
      [
        "int"
      ],
      true,
      ""
    ],
    [
      [
        "fun",
        [
          "var",
          1
        ],
        [
          "var",
          2
        ]
      ],
      [
        "fun",
        [
          "var",
          0
        ],
        [
          "int"
        ]
      ],
      true,
      ""
    ],
    [
      [
        "var",
        3
      ],
      [
        "var",
        1
      ],
      true,
      ""
    ],
    [
      [
        "var",
        4
      ],
      [
        "fun",
        [
          "var",
          4
        ],
        [
          "int"
        ]
      ],
      false,
      "E_OCCURS"
    ],
    [
      [
        "int"
      ],
      [
        "fun",
        [
          "int"
        ],
        [
          "int"
        ]
      ],
      false,
      "E_UNIFY"
    ],
    [
      [
        "var",
        2
      ],
      [
        "var",
        2
      ],
      true,
      ""
    ]
  ],
  "流水标记": [
    1,
    1,
    1,
    0,
    0,
    1
  ],
  "失败码": [
    "E_OCCURS",
    "E_UNIFY"
  ],
  "合一次数与成败": [
    6,
    4,
    2
  ],
  "累计绑定": 4,
  "重置次数": 1,
  "记项次数": 2,
  "表自洽": true,
  "流水自洽": true,
  "记项自洽": true,
  "码账自洽": true,
  "失败不动表": 1,
  "替换幂等": 1,
  "重放不新增": 0,
  "重放报错": 1,
  "中态不同": true,
  "拆两轮一致": true,
  "异常事件数": 1,
  "恒等合一表长": 0,
  "构造冲突": "E_UNIFY",
  "自引用": "E_OCCURS",
  "坏标签": "E_BAD_TYPE",
  "坏变量号": "E_BAD_VAR",
  "元数不对": "E_BAD_TYPE",
  "已绑定冲突": "E_UNIFY"
};
function __same(got, want) {
  if (typeof got === "string") {
    try {
      const parsed = JSON.parse(got);
      if (JSON.stringify(parsed) === JSON.stringify(want)) {
        return true;
      }
    } catch (error) {
      return JSON.stringify(got) === JSON.stringify(want);
    }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find(function (pair) { return pair[0] === label; });
  if (!found) {
    __bad += 1;
    console.log("缺失验收项 " + label);
    continue;
  }
  if (__same(found[1], want)) {
    console.log("一致 " + label + " = " + JSON.stringify(found[1]));
  } else {
    __bad += 1;
    console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(found[1]));
  }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
