# OneDrive Vercel Index 最新框架迁移方案

日期：2026-05-04

## 目标

将当前从老项目迁移过来的 Pages Router 前端，升级为基于最新稳定 Web 栈的可维护版本。迁移目标不是简单依赖升级，而是把核心产品链路迁到现代 Next.js App Router 架构上：

- OAuth 初始化与 token 刷新
- Redis/Upstash token 存储
- OneDrive 目录浏览、分页、面包屑
- 文件预览、搜索、raw 下载
- 基础国际化
- Vercel 预览环境可验收

## 版本前提

以下版本以 2026-05-04 查询到的官方文档为准：

| 项目 | 当前仓库 | 目标 |
| --- | --- | --- |
| Next.js | 13.1.6，Pages Router | Next.js 16.x，App Router |
| React | 18.2 | React 19.x |
| Tailwind CSS | 3.2 | Tailwind CSS 4.x |
| Node.js | 未固定，本机为 24.15.0 | Node.js 24 LTS |
| pnpm | 未固定，lockfile v6 | 迁移期固定 pnpm 8；完成依赖升级后切到 pnpm 10 并重建 lockfile |
| i18n | next-i18next | i18next/react-i18next 的轻量集成，或 App Router 兼容的自建薄封装 |

参考：

- Next.js 升级文档：https://nextjs.org/docs/app/getting-started/upgrading
- Next.js 16 升级指南：https://nextjs.org/docs/app/guides/upgrading/version-16
- React 版本文档：https://react.dev/versions
- React 19 升级指南：https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- Tailwind CSS v4 升级指南：https://tailwindcss.com/docs/upgrade-guide
- Node.js 发布周期：https://nodejs.org/en/about/releases/

## 当前状态摘要

当前仓库仍保留老架构：

- 页面入口在 `src/pages/index.tsx`、`src/pages/[...path].tsx` 和 `src/pages/onedrive-vercel-index-oauth/*`。
- API 在 `src/pages/api/*`，仍使用 `NextApiRequest` / `NextApiResponse`。
- 目录浏览与搜索主要依赖客户端 SWR 请求 `/api/*`。
- 配置仍是 CommonJS JavaScript：`config/site.config.js`、`config/api.config.js`。
- `next-i18next` 与 `nextjs-progressbar` 仍挂在 `_app.tsx`。
- 预览组件里存在 SSR 不安全依赖，例如 `plyr-react` 顶层导入会在服务端访问 `document`。
- 暂无测试脚本和测试目录。

这说明迁移应该按“重建现代核心，再逐步替换旧入口”的方式推进，而不是在旧 Pages Router 内继续扩大改动。

## 迁移原则

1. 先保证旧版本可构建、可回归，再开始大版本迁移。
2. App Router 新代码与 Pages Router 旧代码短期并存，但每个阶段都要减少旧入口依赖。
3. OneDrive、Redis、OAuth、配置读取全部放在服务端边界内。
4. UI 组件只负责展示和交互，不直接拼 Graph API 或 Redis 逻辑。
5. 浏览、搜索、下载是 Phase 1 必须闭环的主链路；长尾预览格式可以延后。
6. 每个阶段以 `pnpm lint`、`pnpm build`、核心路径手测和 Vercel Preview 验收作为出口。

## 目标目录结构

```text
src/
  app/
    layout.tsx
    page.tsx
    [...path]/page.tsx
    onedrive-vercel-index-oauth/
      step-1/page.tsx
      step-2/page.tsx
      step-3/page.tsx
    api/
      drive/route.ts
      raw/route.ts
      search/route.ts
      thumbnail/route.ts
      item/route.ts
      name/[name]/route.ts
    error.tsx
    loading.tsx
    not-found.tsx
  features/
    auth/
    drive/
    preview/
    i18n/
  lib/
    config/
    graph/
    redis/
    http/
  components/
    layout/
    drive/
    preview/
    ui/
  styles/
```

## 模块迁移映射

| 旧模块 | 新模块 |
| --- | --- |
| `src/pages/[...path].tsx` | `src/app/[...path]/page.tsx` |
| `src/pages/index.tsx` | `src/app/page.tsx` |
| `src/pages/api/index.ts` | `src/app/api/drive/route.ts` + `src/features/drive` |
| `src/pages/api/raw.ts` | `src/app/api/raw/route.ts` |
| `src/pages/api/search.ts` | `src/app/api/search/route.ts` |
| `src/pages/api/thumbnail.ts` | `src/app/api/thumbnail/route.ts` |
| `src/utils/oAuthHandler.ts` | `src/features/auth/oauth.ts` |
| `src/utils/odAuthTokenStore.ts` | `src/lib/redis/token-store.ts` |
| `config/*.config.js` | `src/lib/config/*.ts` |
| `src/utils/getPreviewType.ts` | `src/features/preview/preview-type.ts` |
| `src/components/previews/*` | `src/components/preview/*`，按 Client Component 边界拆分 |

## 阶段计划

### 阶段 0：迁移前稳定化

目标：让当前旧项目有一个可验证基线。

- 固定运行环境：`engines.node`、`packageManager`、`.npmrc`。
- 明确 pnpm 策略：短期用 pnpm 8 跑现有 lockfile；升级依赖后切 pnpm 10 并提交新 lockfile。
- 修复当前生产构建中的 SSR 问题，尤其是视频预览的 `plyr-react` 顶层导入。
- 增加最小测试基础：Vitest，先覆盖 path 编码、preview type、protected route 匹配。
- 记录当前核心手测路径：OAuth、首页目录、子目录、搜索、raw 下载、图片/视频/Markdown 预览。

出口标准：

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm build`
- 旧主链路手测通过

### 阶段 1：升级基础依赖

目标：把工具链升级到最新稳定栈，但暂不重写全部业务。

- 运行 Next 官方升级工具或 codemod。
- 升级 `next`、`react`、`react-dom`、`eslint-config-next`。
- 升级 `@types/react`、`@types/react-dom`、TypeScript。
- 升级 Tailwind CSS 到 v4，迁移 `globals.css`、`postcss.config.*`、Tailwind 配置。
- 移除或替换与新架构不匹配的依赖：`next-i18next`、`nextjs-progressbar`。
- 审查 preview 相关依赖，把 SSR 不安全库放入 Client Component 或动态加载。

出口标准：

- 新依赖安装可复现
- lockfile 与 pnpm 版本一致
- `pnpm lint`、`pnpm build` 通过
- 样式没有明显回退

### 阶段 2：建立 App Router 外壳

目标：让新路由骨架先跑起来。

- 新增 `src/app/layout.tsx`、`src/app/page.tsx`、`src/app/[...path]/page.tsx`。
- 建立 `loading.tsx`、`error.tsx`、`not-found.tsx`。
- 把 Navbar、Footer、Breadcrumb、Layout Switch 拆成可复用组件。
- 路由读取从 `next/router` 迁移到 App Router 的 params/searchParams。
- 新页面优先使用 Server Component，交互局部使用 `"use client"`。

出口标准：

- 首页和任意路径页面由 App Router 渲染
- 旧 `pages` 入口可以暂留，但不再是主入口

### 阶段 3：迁移服务端领域层

目标：把核心业务逻辑从 API handler 和组件里抽到服务端模块。

- `src/lib/config`：类型化读取站点配置和 API 配置，加入 env 校验。
- `src/lib/redis`：封装 Redis client，处理缺失 `REDIS_URL` 的明确错误。
- `src/lib/graph`：封装 Microsoft Graph 请求、错误转换和缓存策略。
- `src/features/auth`：OAuth URL、code exchange、token refresh、protected route 校验。
- `src/features/drive`：路径编码、目录读取、分页 token、item 查询、搜索。
- `src/features/preview`：预览类型判断与服务端可用 metadata。

出口标准：

- API route 和页面都复用同一套领域层
- 单元测试覆盖核心纯函数和错误转换

### 阶段 4：Route Handlers 替换 `pages/api`

目标：完成 API 到 App Router Route Handlers 的迁移。

- `/api/drive`：目录、文件 metadata、分页。
- `/api/raw`：raw 下载、CORS、Cloudflare proxy。
- `/api/search`：OneDrive search。
- `/api/thumbnail`：缩略图代理。
- `/api/item`：item by id。
- `/api/name/[name]`：兼容旧 raw-by-name 行为。
- 为所有操作性路由显式设置 Node.js runtime。
- 统一错误响应结构，区分未配置、未认证、无权限、404、Graph 限流、Redis 不可用。

出口标准：

- 前端主链路全部切到新 Route Handlers
- 旧 `src/pages/api` 可删除或只保留兼容重定向

### 阶段 5：目录浏览与搜索重建

目标：用 server-first 数据流替换客户端拉取主路径。

- 目录页在 Server Component 中读取首屏数据。
- 分页加载作为 Client Component 增量交互。
- 搜索弹窗保留 Client Component，但请求新 `/api/search`。
- protected route 登录态仅保存在客户端，服务端通过 header/cookie 校验。
- 面包屑和路径解析统一使用 `features/drive`。

出口标准：

- 首页目录、嵌套目录、分页、protected route、搜索导航可用
- 首屏不再依赖 SWR 获取目录主体数据

### 阶段 6：预览与下载迁移

目标：完成核心预览，不追求所有长尾格式一次性等价。

- 第一批必须支持：image、text、code、markdown、pdf、audio、video、office fallback、default download。
- SSR 不安全播放器和 reader 类库必须放在 Client Component 内动态加载。
- Markdown 渲染保留安全策略，明确 `rehype-raw` 的风险边界。
- 多文件下载和文件夹打包先保留客户端实现，后续再评估是否迁到 Route Handler 或 Server Action。

出口标准：

- 核心预览类型可打开
- 不支持的类型降级为下载，不导致页面崩溃

### 阶段 7：国际化迁移

目标：移除 `next-i18next`，保留已有翻译资产。

- 复用 `public/locales/*/common.json`。
- 建立 App Router 可用的 server/client i18n helper。
- `SwitchLang` 改为 App Router 导航方式。
- 先保证主语言完整，再逐步补齐其他语言。

出口标准：

- 默认语言和至少一个备用语言可切换
- 页面和核心交互文案能正常显示

### 阶段 8：清理旧架构

目标：移除迁移完成后的遗留代码和依赖。

- 删除 `src/pages` 中已替换页面和 API。
- 删除 `_app.tsx`、`_document.tsx` 相关旧入口。
- 删除 `next-i18next.config.js`、旧 i18n parser 配置或迁移为新脚本。
- 删除未使用依赖和类型包。
- 收紧 TypeScript：关闭 `allowJs`，逐步启用更严格的隐式类型检查。

出口标准：

- `rg "next/router|next-i18next|NextApiRequest|NextApiResponse"` 没有业务代码命中
- `pnpm lint`、`pnpm build` 通过
- Vercel Preview 主链路验收通过

## 验证策略

### 本地验证

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- 纯函数测试：路径编码、preview 类型、配置校验、Graph 响应适配、protected route 匹配

### Vercel Preview 验证

本项目涉及 Microsoft Graph、Redis、Vercel runtime 和 OAuth redirect，本地无法完全替代部署环境。每个里程碑都必须在 Vercel Preview 上人工验收：

- OAuth 初始化完成
- Redis token 写入与刷新
- 首页目录打开
- 嵌套目录打开
- 分页加载
- 文件预览
- 搜索结果跳转
- raw 下载
- protected route 验证

## 风险与应对

| 风险 | 应对 |
| --- | --- |
| Next 13 到 16 跨版本过大 | 先稳定旧构建，再使用 codemod，并分阶段提交 |
| React 19 类型变化导致组件报错 | 先升级类型并跑 lint/build，再处理 ref、children、第三方库兼容 |
| Tailwind v4 样式回退 | 使用升级工具后逐页视觉回归，重点检查 border、shadow、rounded、opacity 类 |
| `next-i18next` 不兼容 App Router | 提前抽象 `t()` 和语言切换，不在业务组件直接依赖旧包 |
| 第三方预览库 SSR 不安全 | 所有播放器、reader、浏览器 API 依赖放入 Client Component 动态导入 |
| OAuth/Redis 只能部署验收 | 每个阶段保留 Vercel Preview 手测清单 |
| 大迁移造成难以 review | 每阶段独立 PR，禁止混入无关 UI 重构 |

## 建议提交顺序

1. `chore: pin package manager and runtime`
2. `fix: make legacy build pass before migration`
3. `test: add core utility coverage`
4. `chore: upgrade next react tailwind baseline`
5. `feat: add app router shell`
6. `feat: add typed config and graph clients`
7. `feat: migrate drive route handlers`
8. `feat: migrate browse and search pages`
9. `feat: migrate core previews`
10. `feat: migrate i18n`
11. `refactor: remove pages router legacy code`

## 完成标准

迁移完成时应满足：

- 项目运行在 Next.js 16 App Router。
- React 19 和 Tailwind CSS 4 已升级并通过构建。
- `src/pages` 不再承载主要业务入口。
- 所有 API 已迁到 Route Handlers。
- 配置、Graph、Redis、OAuth 都在服务端模块内。
- 主链路在 Vercel Preview 验收通过。
- 旧依赖和旧入口清理完成。
- 有最小但有效的测试覆盖，后续可以继续扩展。

