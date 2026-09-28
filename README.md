# unifylab

合一推演台（原生 ES 模块，零依赖）：类型项在替换表下解到规范形态；合一写进一条新绑定时，要回头作用到表里每一条旧绑定上，
变量自己套自己（自引用）与构造冲突都要报码，失败一动都不许动替换表。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ 即可操作：上面是推进尺，点刻度或拖尺看第 k 步；
中间是替换表与项路（项画成括号块，已绑定的变量就地标出解到哪），下面是合一流水与账。

## 要补的文件

    unify.js   normOf / unify
    ops.js     show / merge / reset

audit.js、app.js、check_sample.js、tests/run.js 与页面都已写好，只调不写。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js
