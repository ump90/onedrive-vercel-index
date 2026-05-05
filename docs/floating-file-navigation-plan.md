## 文件预览切换交互改造方案

### 目标

将当前文件预览页的“上一个 / 下一个”文字按钮改造为更轻量的沉浸式导航：

- 使用圆形按钮，仅显示左右箭头图标，不再显示文字。
- 按钮悬浮在页面垂直中间，分别贴近左侧和右侧。
- 点击无可切换文件时弹出提示，而不是静默失败。
- 不提供键盘快捷键支持，避免影响浏览器、播放器和页面默认快捷键行为。

### 影响范围

预计主要修改以下位置：

- `src/features/drive/AppDriveClientShell.tsx`
  - 当前文件夹 / 文件导航上下文位于该客户端组件中。
  - 适合集中计算当前文件在同级文件列表中的位置，并处理跳转。
  - 适合挂载悬浮按钮和无可切换文件提示。
- `public/locales/*/common.json`
  - 如项目要求所有文案走 i18n，应补充提示文案。
  - 可先添加英文 key，后续再补齐其他语言；或使用已有通用文案组合。

### 交互设计

#### 悬浮按钮

- 左侧按钮：
  - 位置：`fixed left-3 md:left-6 top-1/2 -translate-y-1/2`
  - 图标：`faArrowLeft`
  - 语义：上一个文件
- 右侧按钮：
  - 位置：`fixed right-3 md:right-6 top-1/2 -translate-y-1/2`
  - 图标：`faArrowRight`
  - 语义：下一个文件
- 样式建议：
  - 圆形：`h-11 w-11 rounded-full`
  - 半透明背景：`bg-white/85 dark:bg-gray-900/85`
  - 阴影和边框：`shadow-lg border border-gray-900/10 dark:border-gray-500/30`
  - 层级：低于 navbar，但高于预览内容，例如 `z-40`
  - hover / focus：保持可见焦点环，符合键盘可访问性。
- 原文字按钮应移除，避免与悬浮导航重复。

#### 无文件提示

当触发“上一个 / 下一个”但目标不存在时，弹出简短提示：

- 上一个不存在：`已经是第一个文件`
- 下一个不存在：`已经是最后一个文件`

实现方式建议：

1. 如果项目已有 toast 组件，优先复用。
2. 如果没有 toast 组件，先使用轻量状态实现一个页面内提示条：
   - `useState` 保存提示文案。
   - 显示在页面底部或顶部中间。
   - `setTimeout` 约 1600-2200ms 后自动消失。
3. 不建议使用浏览器 `alert()`，因为会打断视频 / 音频播放和连续点击切换体验。

### 文件导航数据计算

当前页面如果是文件预览，应基于当前文件夹的 children 计算同级可导航文件：

1. 从当前文件夹列表中排除 folder 项，只保留文件项。
2. 用当前 `path` 或 `file.id` 定位当前文件 index。
3. `previousFile = files[currentIndex - 1]`。
4. `nextFile = files[currentIndex + 1]`。
5. 跳转时使用现有 `itemPath(parentPath, target.name)` 或已有路径构造工具，保持 URL 编码规则一致。

边界处理：

- 如果当前文件不在列表中，两个按钮仍可显示，但点击时提示无法切换；也可以隐藏按钮。推荐显示按钮并在点击时提示，符合“没有文件就弹提示”的要求。
- 如果目录内只有一个文件，左右按钮点击均弹提示。
- 如果 API 还在加载 children，不触发跳转，提示稍后再试或直接忽略。

### 组件拆分建议

为避免 `AppDriveClientShell.tsx` 继续变大，建议新增小组件：

```tsx
type FloatingFileNavigationProps = {
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
}
```

组件职责：

- 渲染左右悬浮圆形箭头按钮。
- 不直接关心文件列表和路由。
- 通过 props 接收是否可切换和回调。
- 按钮不要设置 `disabled`，否则无法点击后弹出“已经是第一个 / 最后一个文件”的提示；可用 `aria-disabled` 表达不可用状态。

toast 提示可以放在父组件中，也可以抽成独立 hook，例如 `useFileNavigationToast()`。

### 可访问性

- 圆形按钮虽然不显示文字，但必须保留：
  - `aria-label={t('Previous file')}`
  - `title={t('Previous file')}`
  - `aria-label={t('Next file')}`
  - `title={t('Next file')}`
- 保留清晰 focus ring，方便键盘用户发现当前焦点。
- 提示条建议使用 `role="status"` 或 `aria-live="polite"`。

### i18n 文案建议

建议新增 key：

```json
{
  "Previous file": "Previous file",
  "Next file": "Next file",
  "Already the first file": "Already the first file",
  "Already the last file": "Already the last file"
}
```

中文可翻译为：

```json
{
  "Previous file": "上一个文件",
  "Next file": "下一个文件",
  "Already the first file": "已经是第一个文件",
  "Already the last file": "已经是最后一个文件"
}
```

### 实施步骤

1. 在 `AppDriveClientShell.tsx` 中确认当前文件预览页已有的 previous / next 逻辑和按钮位置。
2. 将原文字按钮替换为悬浮圆形按钮组件。
3. 将切换逻辑统一为 `goToPreviousFile()` / `goToNextFile()`，在无目标文件时调用提示。
4. 明确不新增 `keydown` 监听，不注册 `ArrowLeft`、`ArrowRight`、`Space` 等键盘切换逻辑。
5. 补充 i18n 文案。
6. 运行 `pnpm lint`，并手动验证常见预览类型。

### 验证清单

- 文件夹中有多个文件：
  - 左侧圆形按钮可切换到上一个文件。
  - 右侧圆形按钮可切换到下一个文件。
  - 原有文字按钮不再出现。
- 文件夹中只有一个文件：
  - 点击左侧按钮提示已经是第一个文件。
  - 点击右侧按钮提示已经是最后一个文件。
- 第一个文件：
  - 点击左侧按钮弹提示。
  - 点击右侧按钮正常跳转。
- 最后一个文件：
  - 点击右侧按钮弹提示。
  - 点击左侧按钮正常跳转。
- 键盘：
  - `ArrowLeft`、`ArrowRight`、`Space` 不触发文件切换。
  - 视频 / 音频文件中，`Space` 保留播放器或浏览器默认行为。
  - 输入框 / 搜索框中按这些键不会触发文件切换。
- 移动端：
  - 悬浮按钮不遮挡主要内容，必要时可降低尺寸或增加透明度。

### 风险和注意事项

- 方案不注册键盘快捷键，避免抢占视频 / 音频播放器的空格播放控制，也避免影响浏览器默认滚动和输入行为。
- 如果文件列表分页未完全加载，当前同级文件列表可能不完整，需要确认现有数据是否已包含完整 children。
- 悬浮按钮可能遮挡图片或 PDF 内容，需在移动端重点检查。
- 如果原导航逻辑包含跨文件夹或搜索结果上下文，改造时需保留原行为。
