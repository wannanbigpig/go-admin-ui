import { expect, type Page, test } from '@playwright/test'

const login = async (page: Page) => {
    // These scenarios use the in-browser development Mock only.
    await page.route('**/admin/**', (route) => route.abort())
    await page.goto('/login')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.locator('input[name="captcha"]').fill('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}

const captureMockRequests = async (page: Page, module: 'system' | 'auth', path: string) => {
    await page.evaluate(async ({ module, path }) => {
        const moduleURL = `/src/mock/modules/${module}.ts`
        const loaded = await import(moduleURL)
        const routes = loaded[`${module}Mock`] as { pattern: RegExp; handler: (params: unknown) => unknown }[]
        const route = routes.find((item) => item.pattern.test(path))
        if (!route) throw new Error(`Missing development Mock route: ${path}`)
        const original = route.handler
        const browser = window as typeof window & { reviewRequests: Record<string, unknown>[] }
        browser.reviewRequests = []
        route.handler = (params) => {
            browser.reviewRequests.push(JSON.parse(JSON.stringify(params || {})))
            return original(params)
        }
    }, { module, path })
}

const lastRequest = (page: Page) => page.evaluate(() => (window as typeof window & { reviewRequests: Record<string, unknown>[] }).reviewRequests.at(-1))

test('在线会话选择今天后搜索完整本地日范围', async ({ page }) => {
    await login(page)
    await page.goto('/log/session')
    await expect(page.getByRole('button', { name: '查询', exact: true })).toBeEnabled()
    await captureMockRequests(page, 'system', '/v1/auth/session/list')
    await page.getByText('展开', { exact: true }).click()
    await page.locator('.el-range-input').first().click()
    await page.getByRole('button', { name: '今天', exact: true }).click()
    await page.getByRole('button', { name: '查询', exact: true }).click()
    const expected = await page.evaluate(() => {
        const now = new Date()
        return {
            start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
            end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        }
    })
    await expect.poll(() => lastRequest(page)).toMatchObject(expected)
})

test('任务记录下钻后重置清除URL与查询条件', async ({ page }) => {
    await login(page)
    await page.goto('/task/center?tab=run&task_code=cron%3Ademo&status=failed&time_basis=finished_at')
    await expect(page.getByPlaceholder('请输入任务编码')).toHaveValue('cron:demo')
    await expect(page.getByRole('button', { name: '重置', exact: true })).toBeEnabled()
    await captureMockRequests(page, 'system', '/v1/task/run/list')
    await page.getByRole('button', { name: '重置', exact: true }).click()
    await expect(page).toHaveURL(/\/task\/center\?tab=run$/)
    await expect(page.getByPlaceholder('请输入任务编码')).toHaveValue('')
    // The shared request layer removes empty filters before the request reaches Mock.
    await expect.poll(() => lastRequest(page)).toEqual({ page: 1, per_page: 10 })
})

test('个人资料清空邮箱后保存并重新打开保持为空', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await captureMockRequests(page, 'auth', '/v1/admin-user/update-profile')
    await page.getByRole('button', { name: '编辑资料', exact: true }).click()
    const email = page.getByPlaceholder('请输入邮箱')
    await expect(email).toHaveValue('admin@example.com')
    await email.fill('')
    await page.getByRole('button', { name: '提交', exact: true }).click()
    await expect.poll(() => lastRequest(page)).toMatchObject({ email: '' })
    await expect(email).toBeHidden()
    await page.getByRole('button', { name: '编辑资料', exact: true }).click()
    await expect(email).toHaveValue('')
})

test('全部已读请求失败后通知仍未读且不显示成功', async ({ page }) => {
    await login(page)
    await page.goto('/system/notification')
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/system.ts'
        const { systemMock } = await import(moduleURL)
        const route = systemMock.find((item: { pattern: RegExp }) => item.pattern.test('/v1/system/notification/list'))
        route.handler = () => ({ list: [{ id: 801, title: 'Review unread notification', message: 'Keep unread after failure', is_read: 0, created_at: new Date().toISOString() }], total: 1 })
    })
    await page.getByRole('button', { name: '查询', exact: true }).click()
    await expect(page.locator('.notification-center-page .notification-item.is-unread')).toHaveCount(1)
    await page.getByRole('button', { name: '全部已读', exact: true }).click()
    await page.getByRole('button', { name: '确认', exact: true }).click()
    // No read-all Mock exists and all business requests are aborted by login().
    await expect(page.locator('.el-message--error')).toBeVisible()
    await expect(page.locator('.el-message--success')).toHaveCount(0)
    await expect(page.locator('.notification-center-page .notification-item.is-unread')).toHaveCount(1)
    await expect(page.getByRole('button', { name: '全部已读', exact: true })).toBeEnabled()
})

test('回收站删除失败显示明细保留勾选，恢复后出现父目录', async ({ page }) => {
    await login(page)
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/system.ts'
        const { systemMock } = await import(moduleURL)
        let restored = false
        const file = { id: 901, origin_name: 'recover.txt', name: 'recover.txt', size: 12, folder_id: 900, created_at: '2026-10-01 10:00:00', deleted_at: '2026-10-02 10:00:00' }
        const handlers: Record<string, () => unknown> = {
            '/v1/system/file/trash/list': () => ({ list: restored ? [] : [file], total: restored ? 0 : 1 }),
            '/v1/system/file/folder/tree': () => restored ? [{ id: 900, name: 'Restored ancestor', parent_id: null, children: [] }] : [],
            '/v1/system/file/trash/batch-destroy': () => ({ total: 1, destroyed: 0, failed: 1, failures: [{ id: 901, message: 'Storage temporarily unavailable' }] }),
            '/v1/system/file/trash/restore': () => { restored = true; return {} },
        }
        for (const [path, handler] of Object.entries(handlers)) {
            const route = systemMock.find((item: { pattern: RegExp }) => item.pattern.test(path))
            if (!route) throw new Error(`Missing Mock route ${path}`)
            route.handler = handler
        }
        const routerURL = '/src/router/index.ts'
        const { default: router } = await import(routerURL)
        await router.push('/system/file')
    })
    await page.locator('.file-sidebar').getByText('回收站', { exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '回收站', exact: true })
    await expect(dialog.getByText('recover.txt', { exact: true })).toBeVisible()
    await dialog.locator('tbody .el-checkbox').click()
    await dialog.getByRole('button', { name: '批量彻底删除', exact: true }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await expect(dialog.getByText('#901: Storage temporarily unavailable', { exact: true })).toBeVisible()
    await expect(dialog.locator('tbody input[type="checkbox"]')).toBeChecked()
    await expect(dialog.getByRole('button', { name: '批量彻底删除', exact: true })).toBeEnabled()
    await dialog.getByRole('button', { name: '恢复', exact: true }).click()
    await expect(dialog.getByText('recover.txt', { exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: '关闭此对话框' }).click()
    await expect(page.getByText('Restored ancestor', { exact: true }).first()).toBeVisible()
})

test('高危Cron旧配置打开后关闭且禁用重试', async ({ page }) => {
    await login(page)
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/system.ts'
        const { systemMock } = await import(moduleURL)
        const route = systemMock.find((item: { pattern: RegExp }) => item.pattern.test('/v1/task/list'))
        route.handler = () => ({ list: [{ id: 801, code: 'cron:risky', name: 'High-risk cron', kind: 'cron', status: 1, allow_manual: 1, allow_retry: 1, is_high_risk: 1, cron_spec: '0 * * * * *' }], total: 1 })
        const routerURL = '/src/router/index.ts'
        const { default: router } = await import(routerURL)
        await router.push('/task/center?tab=definition')
    })
    await page.getByRole('button', { name: '运营配置', exact: true }).click()
    const retryItem = page.locator('.el-drawer .el-form-item').filter({ hasText: '允许重试' })
    await expect(retryItem.getByRole('switch')).toBeDisabled()
    await expect(retryItem.getByRole('switch')).not.toBeChecked()
    await expect(retryItem.getByText('高危定时任务不支持重试，请使用立即执行并完成风险确认。')).toBeVisible()
})
