# Contributing

本项目是 Vue 3 后台管理脚手架前端。贡献应保持动态菜单、按钮权限、请求层和模块边界简单清晰，不把项目扩展成 SaaS、微前端平台或 ERP 成品。

## 开发流程

1. 先读取相关页面、`src/modules`、API 类型和测试，确认真实调用链。
2. 使用 Conventional Commits：`feat:`、`fix:`、`refactor:`、`test:`、`docs:`、`ci:`、`chore:`。
3. API 错误默认由 `src/utils/request.ts` 统一展示；业务层需要定制提示时使用 `silent`，避免重复 toast。
4. 一次性、无独立语义的小函数优先留在业务流程内；新增抽象需说明复用、测试价值和导航成本。
5. 动态路由和按钮必须来自后端菜单树，不能通过静态路由绕过权限。

## 提交前验证

```bash
corepack pnpm run lint --no-cache
corepack pnpm run type-check
corepack pnpm run test:run
corepack pnpm run build:production
git diff --check
```
