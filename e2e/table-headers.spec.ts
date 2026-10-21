import { expect, type Page, test } from '@playwright/test'

const login = async (page: Page) => {
    await page.route('**/admin/**', (route) => route.abort())
    await page.goto('/login')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.locator('input[name="captcha"]').fill('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}

const navigate = async (page: Page, path: string) => {
    const previousHeader = (await page.locator('thead').count()) ? await page.locator('thead').first().elementHandle() : null
    await page.evaluate(async (target) => {
        const moduleURL = '/src/router/index.ts'
        const { default: router } = await import(moduleURL)
        await router.push(target)
    }, path)
    if (previousHeader) await page.waitForFunction((element) => !element.isConnected, previousHeader)
}

const expectSingleLineHeaders = async (page: Page) => {
    await expect(page.locator('thead th .cell').first()).toBeVisible()
    const problems = await page.locator('thead th .cell').evaluateAll((cells) =>
        cells.flatMap((cell) => {
            if (!cell.textContent?.trim()) return []
            const lineHeight = Number.parseFloat(getComputedStyle(cell).lineHeight)
            const wrapped = cell.getBoundingClientRect().height > lineHeight + 2
            const clipped = cell.scrollWidth > cell.clientWidth + 1
            return wrapped || clipped ? [{ label: cell.textContent.trim(), wrapped, clipped }] : []
        })
    )
    expect(problems).toEqual([])
}

for (const scenario of [
    { width: 1440, locale: 'zh-CN', dark: false },
    { width: 1440, locale: 'en-US', dark: false },
    { width: 390, locale: 'zh-CN', dark: true },
] as const) {
    test(`${scenario.width}px ${scenario.locale} 表头标题和图标单行完整显示且排序仍生效`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: scenario.width, height: 900 })
        await page.emulateMedia({ colorScheme: scenario.dark ? 'dark' : 'light' })
        await login(page)
        if (scenario.locale === 'en-US') {
            await page.getByLabel('语言切换', { exact: true }).click()
            await page.getByRole('menuitem', { name: 'English' }).click()
        }

        await navigate(page, '/permission/list')
        const methodLabel = scenario.locale === 'en-US' ? 'Method' : '请求方法'
        const method = page.getByRole('columnheader').filter({ has: page.getByText(methodLabel, { exact: true }) })
        await expect(method).toBeVisible()
        await expect(page.locator('.page-heading p')).toHaveText(scenario.locale === 'en-US' ? 'View the API catalog, request methods, and authentication requirements.' : '查看接口目录、请求方法与鉴权要求。')
        await expectSingleLineHeaders(page)
        await method.locator('.sort-caret.ascending').click()
        await expect(method).toHaveAttribute('aria-sort', 'ascending')
        await method.locator('.sort-caret.descending').click()
        await expect(method).toHaveAttribute('aria-sort', 'descending')
        await page.locator('.el-table__header-wrapper').screenshot({ path: testInfo.outputPath('api-headers.png') })

        await navigate(page, '/log/session')
        const uidLabel = scenario.locale === 'en-US' ? 'User ID' : '用户ID'
        await expect(page.getByRole('columnheader').first()).toContainText(uidLabel)
        await expect(page.getByRole('columnheader').first().locator('.caret-wrapper')).toHaveCount(0)
        await expect(page.locator('.page-heading p')).toHaveText(scenario.locale === 'en-US' ? 'Review login sessions and expiry status, and revoke sessions when needed.' : '查看登录会话及到期状态，按需强制下线。')
        await expectSingleLineHeaders(page)

        for (const path of ['/log/admin-login-log', '/log/request-log', '/my-request-log', '/permission/admin-user-list', '/permission/role-list', '/permission/department-list', '/permission/menu-list', '/business/product', '/task/center?tab=run', '/my-exports']) {
            await navigate(page, path)
            await expect(page).toHaveURL(new RegExp(path.split('?')[0].replaceAll('/', '\\/')))
            await expectSingleLineHeaders(page)
            await expect(page.locator('.page-heading h2')).toBeVisible()
            await expect(page.locator('.page-heading p')).not.toBeEmpty()
            if (path === '/my-request-log') await expect(page.locator('.page-heading h2')).toHaveText(scenario.locale === 'en-US' ? 'My Request Log' : '我的操作日志')
            if (path === '/permission/admin-user-list') {
                await page.locator('.page-heading').scrollIntoViewIfNeeded()
                await page.screenshot({ path: testInfo.outputPath('admin-list.png') })
            }
        }
    })
}

for (const width of [1440, 390]) {
    test(`${width}px 系统配置和字典的页面说明随 Tab 更新`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ colorScheme: width === 390 ? 'dark' : 'light' })
        await login(page)
        await navigate(page, '/system/config')
        const description = page.locator('.page-heading p')
        await expect(description).toHaveText('维护通用业务参数及其类型、分组和生效状态。')
        for (const [tab, text] of [
            ['存储配置', '配置文件存储驱动、访问地址及上传限制。'],
            ['短信配置', '配置短信供应商、发送场景及发送限制。'],
            ['数据脱敏', '配置请求日志与操作审计中的敏感字段脱敏规则。'],
        ]) {
            await page.getByRole('tab', { name: tab, exact: true }).click()
            await expect(description).toHaveText(text)
        }
        await navigate(page, '/system/dict')
        await expect(description).toHaveText('维护字典分类和类型编码，统一业务选项的分组。')
        await page.getByRole('tab', { name: '字典项', exact: true }).click()
        await expect(description).toHaveText('维护字典选项的标签、取值、状态及展示顺序。')
        const bounds = await page.locator('.page-heading').boundingBox()
        expect(bounds!.height).toBeLessThan(140)
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
        await navigate(page, '/todo/list')
        await expect(page.locator('.page-heading h2')).toHaveText('我的待办')
        await expect(page.locator('.page-heading p')).toHaveText('管理你创建的待办，并跟进业务系统分配的事项')
    })
}
