# GitHub Pages 部署指南

本指南将帮助你将项目部署到 GitHub Pages，使其他人可以通过 GitHub 访问你的站点。

## 📋 前置条件

1. 项目已推送到 GitHub 仓库
2. 确保你的主分支名称（通常是 `main` 或 `master`）

## 🚀 部署步骤

### 方法一：使用 GitHub Actions（推荐）

这是自动部署方式，每次推送到主分支时会自动构建和部署。

#### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
    - 选择 **GitHub Actions** 作为部署源
    - 或者选择 **Deploy from a branch**，然后选择分支和文件夹（`/root` 或 `/docs`）

#### 2. 配置工作流文件

项目已包含 `.github/workflows/deploy.yml` 工作流文件，它会：

-   在推送到主分支时自动触发
-   构建生产版本
-   部署到 GitHub Pages

#### 3. 修改仓库名称（如果需要）

如果你的仓库名称不是 `x-l-admin-vue3`，需要修改 `.github/workflows/deploy.yml` 中的 `VITE_BASE_URL`：

```yaml
VITE_BASE_URL: /你的仓库名称/
```

例如，如果仓库名称是 `my-admin`，则设置为：

```yaml
VITE_BASE_URL: /my-admin/
```

#### 4. 推送代码

```bash
git add .
git commit -m "配置 GitHub Pages 部署"
git push origin main
```

#### 5. 查看部署状态

1. 进入仓库的 **Actions**（操作）标签页
2. 查看工作流运行状态
3. 部署完成后，访问你的站点：
    - 如果使用仓库名称部署：`https://你的用户名.github.io/仓库名称/`
    - 如果使用自定义域名：`https://你的自定义域名/`

### 方法二：手动部署

如果你想手动部署：

#### 1. 构建项目

```bash
# 设置 base 路径（替换为你的仓库名称）
export VITE_BASE_URL=/你的仓库名称/

# 构建生产版本
npm run build:production
```

#### 2. 部署到 GitHub Pages

有几种方式：

**方式 A：使用 gh-pages 分支**

```bash
# 安装 gh-pages（如果还没有）
npm install --save-dev gh-pages

# 在 package.json 中添加部署脚本
# "deploy": "npm run build:production && gh-pages -d dist"

# 部署
npm run deploy
```

**方式 B：手动推送到 gh-pages 分支**

```bash
# 进入 dist 目录
cd dist

# 初始化 git（如果还没有）
git init
git add .
git commit -m "Deploy to GitHub Pages"

# 推送到 gh-pages 分支
git branch -M gh-pages
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -f origin gh-pages
```

## ⚙️ 配置说明

### Base 路径配置

-   **仓库根目录部署**：使用 `/仓库名称/` 作为 base 路径
-   **自定义域名部署**：使用 `/` 作为 base 路径

### 环境变量

在 `.github/workflows/deploy.yml` 中可以设置：

-   `VITE_BASE_URL`：应用的 base 路径

### 路由配置

项目已配置支持 base 路径，路由会自动适配。

## 🔧 常见问题

### 1. 页面显示空白

-   检查 `vite.config.js` 中的 `base` 配置是否正确
-   检查浏览器控制台是否有错误
-   确保所有资源路径都是相对路径

### 2. 路由刷新 404

-   确保使用 `createWebHistory` 并设置了正确的 base 路径
-   GitHub Pages 不支持服务端路由，需要配置 404 重定向（已自动处理）

### 3. 资源加载失败

-   检查 `base` 路径配置
-   确保所有静态资源使用相对路径

## 📝 注意事项

1. **首次部署**：首次部署可能需要几分钟时间
2. **更新部署**：每次推送到主分支会自动触发重新部署
3. **自定义域名**：如果需要使用自定义域名，需要：
    - 在仓库 Settings > Pages 中配置自定义域名
    - 将 `VITE_BASE_URL` 设置为 `/`
    - 配置 DNS 记录

## 🔗 相关链接

-   [GitHub Pages 文档](https://docs.github.com/en/pages)
-   [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
-   [Vue Router History 模式](https://router.vuejs.org/guide/essentials/history-mode.html)
