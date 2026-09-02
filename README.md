# Mini Coding Agent

一个刻意模拟真实 Coding Agent 核心结构的教学项目，目标是最终能读懂 [OpenCode](https://github.com/sst/opencode) 一类源码。

当前是 **V1：CLI + Agent + LLM + Tool + Registry + Permission**。

V1 已经把骨架搭好，但还没有真正的 Tool Calling。Agent 只会把用户输入交给 LLM，然后原样返回回答。

```text
User → CLI → Agent → LLM → 回答
```

真正的 Agent Loop（LLM 决定调工具 → 执行 → 再问 LLM）留给 V2。

## 架构

```text
mini-coding-agent/
│
├── src/
│   ├── main.ts                 # CLI 入口
│   ├── agent/
│   │   ├── agent.ts            # Agent 核心循环（V1 只有一轮对话）
│   │   └── types.ts            # Message / ToolCall
│   ├── llm/
│   │   └── llm.ts              # OpenAI 兼容封装
│   ├── tools/
│   │   ├── tool.ts             # Tool 接口
│   │   ├── registry.ts         # Tool 注册表
│   │   ├── read-file.ts
│   │   ├── write-file.ts
│   │   └── shell.ts
│   ├── permission/
│   │   └── permission.ts       # 权限（V1 只占位，尚未接入循环）
│   └── utils/
│       └── logger.ts
├── package.json
├── tsconfig.json
└── README.md
```

调用链：

```text
User
 │
 ▼
CLI (main.ts)
 │
 ▼
Agent
 │
 ├──────────────┐
 ▼              │
LLM             │   ← V1 还不会走这条路
 │              │
 │ Tool Call    │
 ▼              │
Tool Registry ──┘
 │
 ├── read_file
 ├── write_file
 └── shell
```

## 环境

- Node.js 22+
- pnpm

## 安装

```bash
pnpm install
cp .env.example .env
```

编辑 `.env`，填入 API Key。官方 OpenAI：

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

兼容 OpenAI API 的服务（Qwen / DeepSeek 等）再加：

```text
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
```

## 运行

开发模式（tsx 直接跑 TypeScript）：

```bash
pnpm dev
```

编译后运行：

```bash
pnpm build
pnpm start
```

你会看到：

```text
================================
 Mini Coding Agent
 输入 exit 退出
================================

You >
```

输入 `exit` 退出。

## V1 能做什么 / 不能做什么

能做：

- 在终端里和模型多轮对话（`Agent.messages` 会记住历史）
- 用 TypeScript 把 Tool / Registry / Permission / LLM 拆开
- 换任意 OpenAI 兼容模型

不能做（留给 V2）：

- 模型不会真正调用 `read_file` / `write_file` / `shell`
- 没有 Agent Loop：不会「调工具 → 把结果喂回模型 → 再决定下一步」
- Permission 还没有接到 Tool 执行路径上

## 第一阶段学习任务

不要只看一遍就关。先把这几个文件读透：

```text
src/tools/tool.ts
src/tools/registry.ts
src/tools/read-file.ts
src/tools/write-file.ts
src/agent/types.ts
src/agent/agent.ts
```

自己回答这 10 个问题：

### TypeScript

1. `interface` 和 `type` 有什么区别？
2. `Tool<TInput>` 中的 `TInput` 是什么？
3. 为什么 `execute()` 返回 `Promise<string>`？
4. `Tool | undefined` 为什么必须这么写？
5. `Record<string, unknown>` 是什么意思？

### JavaScript / Node

6. `async/await` 到底是什么？
7. `Map` 和 Java `HashMap` 有什么区别？
8. `fs.promises.readFile()` 为什么可以 `await`？
9. `import type` 和普通 `import` 有什么区别？
10. `new Promise((resolve) => {})` 到底在干什么？

## 版本路线

| 版本 | 目标 |
| --- | --- |
| V1 | CLI + Agent + LLM + Tool + Registry |
| V2 | 真正的 Tool Calling + Agent Loop |
| V3 | edit_file / list_directory / search 等 Coding Tools |
| V4 | Session / Context / Token |
| V5 | MCP Client |
| V6 | 接近 OpenCode 的完整结构 |

下一步：V2，让 LLM 返回 `tool_calls`，由 Registry 执行，再把结果送回模型，直到给出最终回答。
