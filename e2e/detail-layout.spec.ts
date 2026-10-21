import { expect, type Page, test } from '@playwright/test'

const tokenHash = '8bd64cf0a10a1b00548ef6e9e74962fd3814cbb0ed4ac07b24242fc40a5c6e77'
const refreshHash = 'a93d2199503004ff87a0fab82e581dd1d2ac5fd3becc2b3e3fa1034780eba13b'
const loginDetail = {
    id: 1,
    username: 'super_admin',
    ip: '127.0.0.1',
    type: 2,
    login_status: 1,
    execution_time: 4,
    os: 'Intel Mac OS X 10_15_7',
    browser: 'Chrome',
    created_at: '2026-10-21 16:39:29',
    token_hash: tokenHash,
    refresh_token_hash: refreshHash,
    is_revoked: 0,
    login_fail_reason: '',
    revoked_reason: '',
}

const login = async (page: Page) => {
    await page.route('**/admin/**', (route) => route.abort())
    await page.goto('/login')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.locator('input[name="captcha"]').fill('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}

const navigate = (page: Page, path: string) =>
    page.evaluate(async (target) => {
        const moduleURL = '/src/router/index.ts'
        const { default: router } = await import(moduleURL)
        await router.push(target)
    }, path)

const installLogFixture = (page: Page, kind: 'login' | 'request', detail: Record<string, unknown>) =>
    page.evaluate(
        async ({ kind, detail }) => {
            const moduleURL = '/src/mock/modules/system.ts'
            const { systemMock } = await import(moduleURL)
            const route = systemMock.find((item: { method: string; pattern: RegExp }) => item.method === 'GET' && item.pattern.test(`/v1/log/${kind}/list`))
            route.pattern = new RegExp(`^/v1/log/${kind}/(?:list|detail)$`)
            route.handler = (params: { id?: number } = {}) => (params.id ? { ...detail } : { total: 1, per_page: 10, current_page: 1, last_page: 1, data: [{ ...detail }] })
        },
        { kind, detail }
    )

const expectNoDetailOverflow = async (page: Page) => {
    const grids = page.getByRole('dialog').locator('dl')
    await expect(grids.first()).toBeVisible()
    expect(await grids.evaluateAll((elements) => elements.every((element) => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
}

for (const width of [1440, 390]) {
    for (const scheme of ['light', 'dark'] as const) {
        test(`${width}px ${scheme} 登录详情长哈希完整显示且保留失败和撤销信息`, async ({ page }, testInfo) => {
            await page.setViewportSize({ width, height: 1000 })
            await page.emulateMedia({ colorScheme: scheme })
            await login(page)
            await installLogFixture(page, 'login', loginDetail)
            await navigate(page, '/log/admin-login-log')
            await page.getByRole('button', { name: '详情', exact: true }).first().click()
            const drawer = page.getByRole('dialog', { name: '登录日志详细信息' })
            await expect(drawer.getByText(tokenHash, { exact: true })).toBeVisible()
            await expect(drawer.getByText(refreshHash, { exact: true })).toBeVisible()
            await expect(drawer.getByText('失败原因', { exact: true })).toHaveCount(0)
            await expect(drawer.getByText('撤销说明', { exact: true })).toHaveCount(0)
            await expectNoDetailOverflow(page)
            const columns = await drawer
                .locator('dl')
                .first()
                .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
            expect(columns).toBe(width === 390 ? 1 : 2)
            if (scheme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
            await expect(page.getByText('登录成功', { exact: true })).toBeHidden()
            await drawer.screenshot({ path: testInfo.outputPath('login-detail.png') })

            await page.keyboard.press('Escape')
            await expect(drawer).toBeHidden()
            await installLogFixture(page, 'login', { ...loginDetail, login_status: 0, is_revoked: 1, login_fail_reason: '密码错误', revoked_reason: '管理员已撤销此会话' })
            await page.getByRole('button', { name: '详情', exact: true }).first().click()
            await expect(drawer.getByText('密码错误', { exact: true })).toBeVisible()
            await expect(drawer.getByText('管理员已撤销此会话', { exact: true })).toBeVisible()
            await expectNoDetailOverflow(page)
        })
    }
}

test('操作日志长路径和 User Agent 在窄屏不撑破详情，响应内容仍可展开', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
    const detail = {
        id: 1,
        operation_name: '查询文件',
        request_id: 'request-id-with-long-context'.repeat(4),
        method: 'GET',
        base_url: `/admin/v1/system/file/${'long-path/'.repeat(12)}`,
        request_kind: 'business',
        operation_status: 0,
        execution_time: 12,
        execution_time_scope: 'handler',
        response_code: 0,
        ip: '127.0.0.1',
        operator_account: 'super_admin',
        operator_name: '管理员',
        jwt_id: 'jwt-audit-identifier'.repeat(8),
        os: 'Mac OS X',
        browser: 'Chrome',
        created_at: '2026-10-21 16:39:29',
        user_agent: 'VeryLongUserAgent'.repeat(24),
        response_body: '{"result":"detail-response-preview"}',
    }
    await installLogFixture(page, 'request', detail)
    await navigate(page, '/log/request-log')
    await page.getByRole('button', { name: '详情', exact: true }).first().click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByText(detail.user_agent, { exact: true })).toBeVisible()
    await expectNoDetailOverflow(page)
    await drawer.getByRole('button', { name: '响应体' }).click()
    await expect(drawer.locator('pre')).toContainText('detail-response-preview')
})

for (const width of [1440, 390]) {
    test(`${width}px 文件引用、任务来源和导出编号可完整阅读`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: width === 390 ? 'dark' : 'light' })
        await login(page)
        const longSource = 'audit-source-with-long-identifier'.repeat(6)
        await page.evaluate(async (source) => {
            const moduleURL = '/src/mock/modules/system.ts'
            const { systemMock } = await import(moduleURL)
            const find = (path: string) => systemMock.find((item: { method: string; pattern: RegExp }) => item.method === 'GET' && item.pattern.test(path))
            const references = [
                { id: 1, owner_type: 'system_config', source_name: '品牌配置', owner_field: 'logo', field_name: '站点标识', created_at: '2026-10-21 16:39:29' },
                { id: 2, owner_type: 'admin_user', source_name: source, owner_field: 'avatar', field_name: '用户头像', created_at: '2026-10-21 16:39:29' },
            ]
            const fileRoute = find('/v1/system/file/detail')
            const original = fileRoute.handler
            fileRoute.handler = (params: unknown) => ({ ...original(params), references, reference_count: references.length })
            const runRoute = find('/v1/task/run/list')
            const row = { ...runRoute.handler().data[0], source_id: source }
            runRoute.pattern = /^\/v1\/task\/run\/(?:list|detail|events)$/
            runRoute.handler = (params: { id?: number; run_id?: number } = {}) => (params.id ? row : params.run_id ? [] : { total: 1, data: [row] })
        }, longSource)

        await navigate(page, '/system/file')
        await page.locator('.file-item').first().click({ button: 'right' })
        await page.locator('.context-menu-popover').getByText('详情', { exact: true }).click()
        const fileDrawer = page.getByRole('dialog', { name: '文件资源详情' })
        await expect(fileDrawer.locator('.reference-list > li')).toHaveCount(2)
        await expect(fileDrawer.getByText('品牌配置', { exact: true })).toBeVisible()
        await expect(fileDrawer.getByText(longSource, { exact: true })).toBeVisible()
        await expectNoDetailOverflow(page)
        await fileDrawer.screenshot({ path: testInfo.outputPath('file-detail.png') })
        await page.keyboard.press('Escape')
        await expect(fileDrawer).toBeHidden()

        await navigate(page, '/task/center?tab=run')
        await page.getByRole('tabpanel', { name: '执行记录', exact: true }).getByRole('button', { name: '详情', exact: true }).first().click()
        const runDrawer = page.getByRole('dialog', { name: '执行记录详情' })
        await expect(runDrawer.getByText(longSource, { exact: true })).toBeVisible()
        await expectNoDetailOverflow(page)
        await runDrawer.screenshot({ path: testInfo.outputPath('task-detail.png') })
        await page.keyboard.press('Escape')
        await expect(runDrawer).toBeHidden()

        await navigate(page, '/my-exports')
        await expect(page.getByRole('textbox', { name: '导出编号', exact: true })).toBeVisible()
        await page.getByRole('button', { name: '详情', exact: true }).first().click()
        const exportDrawer = page.getByRole('dialog', { name: '导出记录详情' })
        await expect(exportDrawer.getByText('导出编号', { exact: true })).toBeVisible()
        await expect(exportDrawer.locator('code')).toContainText('cf70a3fa')
        await expectNoDetailOverflow(page)
        await exportDrawer.screenshot({ path: testInfo.outputPath('export-detail.png') })
    })
}

test('监控详情信息在窄卡片内自动切换为单列', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
    // This optional page has no default mock menu entry; mount it through a test-only route.
    await page.evaluate(async () => {
        const routerURL = '/src/router/index.ts'
        const componentURL = '/src/views/system/monitor/index.vue'
        const { default: router } = await import(routerURL)
        const { default: component } = await import(componentURL)
        router.addRoute({ path: '/__detail-layout-monitor', component })
        await router.push('/__detail-layout-monitor')
    })
    const runtime = page.locator('.el-card').filter({ hasText: 'Go 运行时' })
    await expect(runtime.locator('dt').first()).toHaveText('Go 版本')
    expect(await runtime.locator('dl').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1)
    expect(await runtime.locator('dl').evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
})
