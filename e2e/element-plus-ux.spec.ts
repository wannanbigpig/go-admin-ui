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

const navigate = (page: Page, path: string) => page.evaluate(async (target) => {
    const routerURL = '/src/router/index.ts'
    const { default: router } = await import(routerURL)
    await router.push(target)
}, path)

test('编辑抽屉正确重置详情，关闭后键盘焦点返回原行', async ({ page }) => {
    await login(page)
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/auth.ts'
        const { authMock } = await import(moduleURL)
        const route = authMock.find((item: { pattern: RegExp }) => item.pattern.test('/v1/department/list'))
        const original = route.handler
        route.pattern = /^\/v1\/department\/(?:list|detail)$/
        route.handler = (params: { id?: number } = {}) => params.id
            ? { id: params.id, name: 'Audit department', pid: 0, sort: 100, description: 'Saved detail' }
            : original(params)
    })
    await navigate(page, '/permission/department-list')
    await expect(page.locator('.el-pagination')).toHaveCount(0)
    const edit = page.locator('.xl-action-buttons').getByRole('button', { name: '编辑', exact: true }).first()
    await page.keyboard.press('Tab')
    await edit.focus()
    expect(await edit.evaluate((button) => getComputedStyle(button).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: '编辑部门', exact: true })
    const name = drawer.getByPlaceholder('请输入部门名称')
    await expect(name).toHaveValue('Audit department')
    await expect(drawer.getByRole('button', { name: '提交', exact: true })).toBeEnabled()
    await name.fill('Changed draft')
    await drawer.getByRole('button', { name: '重置', exact: true }).click()
    await expect(name).toHaveValue('Audit department')
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(edit).toBeFocused()
    await expect(page.getByRole('button', { name: '刷新页面' })).toBeVisible()
})

for (const scheme of ['light', 'dark'] as const) {
    test(`390px ${scheme} 编辑抽屉标题和表单保持在视口内`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.setViewportSize({ width: 390, height: 844 })
        await login(page)
        await navigate(page, '/permission/department-list')
        await page.getByRole('button', { name: '新增', exact: true }).first().click()
        const drawer = page.getByRole('dialog', { name: '新增部门', exact: true })
        await expect(drawer).toBeVisible()
        await expect(drawer).toHaveCSS('width', '390px')
        await page.waitForTimeout(400)
        const bounds = await drawer.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(-1)
        const title = await drawer.locator('h4').boundingBox()
        expect(title!.x).toBeGreaterThanOrEqual(0)
        if (scheme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        await page.screenshot({ path: testInfo.outputPath('drawer.png') })
    })
}

test('资料未保存关闭可取消，确认放弃后恢复原资料', async ({ page }) => {
    await login(page)
    await navigate(page, '/profile')
    await page.getByRole('button', { name: '编辑资料', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: '编辑个人资料', exact: true })
    const nickname = drawer.getByPlaceholder('请输入昵称')
    const saved = await nickname.inputValue()
    await nickname.fill('Unsaved nickname')
    await drawer.getByRole('button', { name: '取消', exact: true }).click()
    const confirmation = page.getByRole('dialog', { name: '编辑资料', exact: true })
    await expect(confirmation.getByText('有未保存的修改，是否放弃并关闭？')).toBeVisible()
    await confirmation.getByRole('button', { name: '取消', exact: true }).click()
    await expect(confirmation).toBeHidden()
    await expect(drawer).toBeVisible()
    await expect(nickname).toHaveValue('Unsaved nickname')
    await page.keyboard.press('Escape')
    await confirmation.getByRole('button', { name: '确认', exact: true }).click()
    await expect(drawer).toBeHidden()
    await page.getByRole('button', { name: '编辑资料', exact: true }).click()
    await expect(nickname).toHaveValue(saved)
})

test('任务面板属于对应Tabs，切换保留查询且内容可见', async ({ page }) => {
    await login(page)
    await navigate(page, '/task/center')
    const definition = page.getByRole('tabpanel', { name: '任务定义', exact: true })
    const query = definition.getByPlaceholder('请输入任务编码')
    await expect(query).toBeVisible()
    await query.fill('audit:task')
    await page.getByRole('tab', { name: '执行记录', exact: true }).click()
    await expect(page.getByRole('tabpanel', { name: '执行记录', exact: true }).getByRole('button', { name: '查询', exact: true })).toBeVisible()
    await expect(definition).toBeHidden()
    await page.getByRole('tab', { name: '任务定义', exact: true }).click()
    await expect(query).toHaveValue('audit:task')
})

test('短信读取失败不能保存，重试成功后恢复编辑', async ({ page }) => {
    await login(page)
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/system.ts'
        const { systemMock } = await import(moduleURL)
        const route = systemMock.find((item: { method: string; pattern: RegExp }) => item.method === 'GET' && item.pattern.test('/v1/system/sms/config'))
        const original = route.handler
        let first = true
        route.handler = (params: unknown) => {
            if (first) { first = false; throw new Error('Temporary config read failure') }
            return original(params)
        }
    })
    await navigate(page, '/system/config?tab=sms')
    const panel = page.getByRole('tabpanel', { name: '短信配置', exact: true })
    await expect(panel.getByText('读取短信配置失败，请重试后再编辑。')).toBeVisible()
    await expect(panel.getByRole('button', { name: '保存配置', exact: true })).toHaveCount(0)
    await panel.getByRole('button', { name: '重试', exact: true }).click()
    await expect(panel.getByRole('button', { name: '保存配置', exact: true })).toBeEnabled()
    await expect(panel.getByText('读取短信配置失败，请重试后再编辑。')).toHaveCount(0)
})

test('通知可用键盘打开具名移动抽屉并关闭', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
    await page.evaluate(async () => {
        const moduleURL = '/src/mock/modules/system.ts'
        const { systemMock } = await import(moduleURL)
        const route = systemMock.find((item: { pattern: RegExp }) => item.pattern.test('/v1/system/notification/list'))
        route.handler = () => ({ list: [{ id: 901, title: 'Keyboard notification', message: 'Complete notification text', is_read: 1, created_at: new Date().toISOString() }], total: 1 })
    })
    await navigate(page, '/system/notification')
    const notification = page.locator('.notification-item').filter({ hasText: 'Keyboard notification' })
    await notification.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Keyboard notification', exact: true })
    await expect(drawer.getByText('Complete notification text')).toBeVisible()
    await expect(notification).toHaveAttribute('aria-pressed', 'true')
    await drawer.getByRole('button', { name: '关闭', exact: true }).focus()
    await page.keyboard.press('Space')
    await expect(drawer).toBeHidden()
})

test('多语言弹窗的语言标签关联输入并适配窄屏', async ({ page }) => {
    await login(page)
    await navigate(page, '/permission/menu-list')
    await page.getByRole('button', { name: /新增/ }).first().click()
    const drawer = page.locator('.el-drawer.open')
    await drawer.getByRole('button', { name: '编辑', exact: true }).first().click()
    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog).toBeVisible()
    const input = dialog.getByRole('textbox', { name: '简体中文', exact: true })
    await dialog.locator('label').filter({ hasText: '简体中文' }).click()
    await expect(input).toBeFocused()
    await expect(dialog.getByRole('textbox', { name: 'English', exact: true })).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    const bounds = await dialog.boundingBox()
    expect(bounds!.width).toBeLessThanOrEqual(358)
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
})
