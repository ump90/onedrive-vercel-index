# 技术栈升级迁移计划

## 1. 当前项目现状

当前项目是一个基于 Next.js Pages Router 的前端/轻服务端项目，主要特点如下：

- 框架：Next.js 13.1.6
- UI：React 18.2 + Tailwind CSS 3.2
- 语言：TypeScript 5.1
- 国际化：next-i18next 13
- 数据获取：SWR 2 + axios
- 部署形态：Vercel 优先，配合 Next API Routes
- 路由结构：`src/pages` + `src/pages/api`
- 当前未使用 `src/app`，说明尚未迁移到 App Router

结合代码结构看，项目已经具备较完整的业务功能，但技术栈版本偏旧，且仍以 Pages Router 为核心，后续升级会受到框架演进、国际化方案、构建链路和运行时约束的影响。

## 2. 建议升级目标

建议将下一阶段升级目标定义为“现代化但可控”的版本，而不是一次性激进重写。

### 目标技术栈

- Next.js：升级到当前稳定主线版本
- React：升级到 React 19
- TypeScript：升级到当前稳定 5.x
- Tailwind CSS：升级到 4.x
- ESLint：升级到与 Next 当前版本兼容的最新版
- 国际化：评估 next-i18next 新版本是否继续保留；若转向 App Router，优先评估基于 i18next/react-i18next 的原生方案
- 构建与开发体验：逐步适配 Turbopack / 新版 Next 构建约定

## 3. 迁移总体策略

建议拆成“两阶段迁移”，降低一次性升级风险。

### 阶段 A：同架构升级

目标：在尽量不改业务结构的前提下，先把基础依赖升级到当前稳定版本。

范围建议：

- 升级 Next.js、React、React DOM、TypeScript、ESLint、Tailwind 等基础依赖
- 保持 `pages` 路由结构不变
- 保持 `src/pages/api` API Routes 不变
- 修复因 React 19、Next 新版本、类型定义变化带来的兼容问题
- 升级 next-i18next 到适配当前 Pages Router 的版本，并调整 import 方式
- 补齐 typecheck / lint / build 校验链路

这一步的价值是：

- 先完成“版本现代化”
- 将风险限制在依赖兼容层
- 为下一阶段 App Router 迁移建立稳定基线

### 阶段 B：架构升级

目标：从 Pages Router 迁移到 App Router，逐步贴近 Next 当前推荐架构。

范围建议：

- 新增 `src/app` 并逐步迁移页面
- 将 `_app.tsx` / `_document.tsx` 的职责迁移到 `app/layout.tsx`
- 将部分 `pages/api/*.ts` 迁移为 Route Handlers
- 重构国际化接入方式，使其适配 App Router
- 重新审视数据获取方式：区分服务端获取、客户端 SWR 获取与缓存策略
- 评估是否保留全部 API 中转逻辑，或按运行时能力拆分 Node/Edge 方案

当前执行进度（已落地）：

- 已新增 `src/app/layout.tsx`，把全局样式、Font Awesome 初始化与字体注入收敛为 App Router 基线
- 已将 `/api`、`/api/item`、`/api/search`、`/api/raw`、`/api/thumbnail`、`/api/name/[name]` 迁移为 Route Handlers，并删除 `src/pages/api`
- 页面路由仍暂时保留在 `src/pages`，下一批迁移重点为首页/目录页与 OAuth 页面
- 已移除 `next.config.js` 的 `i18n` 依赖，改为仓库内自管理的 `react-i18next` + cookie 语言方案，为后续页面迁移到 App Router 清除硬阻塞

## 4. 重点风险点

### 4.1 国际化方案

当前项目大量依赖 `next-i18next`、`appWithTranslation` 和 `serverSideTranslations`。这套模式与 Pages Router 绑定较深，是后续迁移到 App Router 的主要阻力之一。

建议：

- 若短期只做版本升级，先保留 Pages Router + next-i18next
- 若进入 App Router 迁移，优先单独立项改造 i18n 层，避免把路由迁移和国际化迁移耦合在一起

### 4.2 API Routes 与运行时差异

当前 `src/pages/api` 中存在 OneDrive 访问、鉴权、重定向、搜索、原始文件代理等逻辑，且依赖 Node 侧能力、axios、cors、Redis 等实现方式。

建议：

- 先保持 API Routes 可运行
- 在 App Router 阶段再评估哪些接口迁移到 Route Handlers
- 对流式响应、重定向、鉴权头、缓存头分别做兼容验证

### 4.3 Tailwind 4 升级

Tailwind 4 相比 3.x 在配置方式和构建集成上变化较大，当前项目还有自定义颜色、字体、插件配置。

建议：

- 先确认 Tailwind 4 是否能无损覆盖当前主题配置
- 如迁移成本过高，可在阶段 A 先升级 Next/React/TS，Tailwind 4 延后到阶段 B 或单独处理

### 4.4 React 19 兼容性

项目依赖较多第三方组件库，例如播放器、阅读器、代码高亮、Headless UI 等，需要逐个验证兼容性。

建议：

- 优先核查高风险依赖：`react-reader`、`plyr-react`、`mpegts.js`、`preview-office-docs`、`react-use-system-theme`
- 对无法兼容的库准备替代方案或局部降级方案

## 5. 推荐执行顺序

1. 盘点依赖兼容性与高风险第三方库
2. 建立独立升级分支
3. 先完成阶段 A：基础版本升级但不改路由架构
4. 通过 lint、typecheck、build、关键功能回归测试
5. 再启动阶段 B：App Router 与 i18n 架构迁移
6. 最后处理性能优化、缓存策略和部署细节收敛

## 6. 下一阶段的具体交付建议

下一阶段建议输出以下内容作为正式实施输入：

- 一份依赖升级清单（按必须升级 / 建议升级 / 待评估分类）
- 一份高风险依赖兼容性检查结果
- 一份 App Router 迁移拆解清单（页面、API、国际化、布局、状态管理）
- 一套回归验证清单（首页、目录浏览、文件预览、下载、搜索、鉴权、OAuth）

## 7. 结论

本项目适合采用“先升级版本，再升级架构”的渐进式迁移方案。

不建议直接一步重写到最新架构；更合理的路径是：

- 先把项目升级到当前稳定依赖版本，确保仍运行在 Pages Router
- 再单独推进 App Router、i18n、Route Handlers 等结构性迁移

这样可以在控制风险的同时，逐步完成向当前主流 Next.js 技术栈的演进。
