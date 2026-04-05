# 下一步工作基线

本文档用于承接 [migration-plan.md](D:/Workspace/onedrive-vercel-index/doc/migration-plan.md) 的阶段 B，作为下一轮实施的直接基线。

## 1. 当前真实状态

已完成：

- 基础依赖已升级到当前主线版本，可正常 `typecheck / lint / build`
- 已建立 `src/app/layout.tsx`，App Router 基线已存在
- 已将 `src/pages/api` 迁移为 `src/app/api/*` Route Handlers
- 已移除 `next.config.js` 中的 `i18n` 配置
- 已将国际化改为仓库内自管理的 `react-i18next` + cookie 方案

未完成：

- 页面路由仍主要位于 `src/pages`
- 首页、目录页、OAuth 三步页尚未迁入 `src/app`
- 组件中仍有较多 `next/router` 依赖
- 数据获取仍以现有客户端 SWR 模式为主，尚未按 App Router 重新分层

## 2. 下一阶段目标

目标：完成“页面层”的 App Router 迁移，使项目从“API 已迁移”推进到“路由主干已迁移”。

## 3. 任务拆分

### 任务 A：迁移首页与目录页

目标：

- 将 `/` 和 `/[...path]` 迁移到 `src/app`
- 建立首页与目录页共享的页面壳层

范围：

- 抽出共享布局，减少首页和目录页重复结构
- 在 App Router 下重建 page 与必要的 metadata
- 保持现有 URL、页面行为、下载与预览逻辑不变

完成标准：

- 首页和目录页已由 `src/app` 承接
- 原有浏览、预览、下载流程无回归
- `pnpm typecheck`、`pnpm lint`、`pnpm build` 通过

### 任务 B：迁移 OAuth 页面并清理路由依赖

目标：

- 将 `/onedrive-vercel-index-oauth/step-1~3` 迁移到 `src/app`
- 清理页面迁移过程中对 `next/router` 的旧依赖

范围：

- 迁移 OAuth 三步页
- 梳理相关组件中的 `next/router` 使用点
- 能切换到 App Router 导航方式的优先切换
- 对仍需兼容旧页面的组件保留过渡层

完成标准：

- OAuth 三步页已由 `src/app` 承接
- OAuth 初始化、授权、回跳、存储流程可用
- 关键组件的路由依赖不再阻塞后续迁移
- `pnpm typecheck`、`pnpm lint`、`pnpm build` 通过

### 任务 C：整理数据获取与迁移收尾

目标：

- 在页面迁移完成后，整理数据获取边界
- 为后续性能优化和结构收尾建立稳定基础

范围：

- 评估首页、目录页、搜索、预览中现有 SWR 使用方式
- 区分哪些逻辑继续保留客户端获取，哪些适合转到服务端
- 保守处理缓存策略，本轮不做激进重写
- 页面迁移稳定后，再决定是否删除对应 `src/pages` 文件

完成标准：

- 页面层数据获取边界清晰
- 页面迁移后的结构稳定，无重复入口长期并存
- 核心流程回归通过

## 4. 总体验收标准

满足以下条件可视为本轮阶段完成：

- 首页、目录页、OAuth 页面已由 `src/app` 承接
- `pnpm typecheck` 通过
- `pnpm lint` 通过
- `pnpm build` 通过
- 核心流程可用：
- 首页访问
- 目录浏览
- 文件预览
- 文件下载
- 搜索
- 受保护目录鉴权
- OAuth 初始化流程

## 5. 暂不处理

本阶段不建议一起做：

- Tailwind 主题重构
- 组件视觉重设计
- 大规模服务端渲染重写
- Node / Edge 运行时进一步拆分
- 第三方依赖替换

## 6. 执行顺序

后续按以下顺序执行：

1. 先执行任务 A
2. 再执行任务 B
3. 最后执行任务 C

任务 A 和 B 完成后，项目主路由将基本切换到 App Router；任务 C 用于收口结构和数据获取边界。
