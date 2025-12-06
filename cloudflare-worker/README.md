# Cloudflare Worker - OneDrive 文件代理

这个 Cloudflare Worker 用于加速 OneDrive 文件的预览和下载。

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 部署 Worker

```bash
cd cloudflare-worker
wrangler deploy
```

### 4. 配置环境变量

在 Cloudflare Dashboard 中设置以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ALLOWED_ORIGINS` | 允许的来源域名（逗号分隔） | `https://your-site.vercel.app,https://your-domain.com` |
| `PROXY_SECRET` | 代理密钥（防止滥用） | 随机字符串，如 `your-secret-key-here` |
| `RATE_LIMIT_PER_MINUTE` | 每 IP 每分钟请求限制 | `60` |

#### 设置 Secret（推荐）

```bash
wrangler secret put PROXY_SECRET
# 输入你的密钥
```

### 5. 配置 Vercel 环境变量

在 Vercel 项目中添加以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_CF_PROXY_URL` | Worker URL，如 `https://onedrive-proxy.your-account.workers.dev` |
| `NEXT_PUBLIC_CF_PROXY_SECRET` | 与 Worker 中的 `PROXY_SECRET` 相同 |

## 安全特性

1. **Origin 验证**：只允许配置的域名访问
2. **Secret 验证**：请求需要携带正确的密钥
3. **速率限制**：防止单 IP 过多请求
4. **域名白名单**：只代理 OneDrive/SharePoint 的 URL

## 使用方式

Worker 部署后会自动在前端代码中使用。下载/预览链接会通过 Worker 代理，加速国内访问速度。
