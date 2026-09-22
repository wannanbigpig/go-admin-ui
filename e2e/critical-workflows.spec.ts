import { expect, type Page, test } from '@playwright/test'

const loginWithPassword = async (page: Page) => {
    await page.goto('/login')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.locator('input[name="captcha"]').fill('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 })
}

test('短信验证码登录应完成发码、登录与认证状态初始化', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: '验证码登录' }).click()
    await page.locator('input[name="country-code"]').fill('86')
    await page.locator('input[name="phone-number"]').fill('13800138000')
    await page.locator('input[name="captcha"]').fill('1234')
    await page.getByRole('button', { name: '发送验证码', exact: true }).click()

    await expect(page.getByText('验证码已发送')).toBeVisible()
    await page.locator('input[name="sms-code"]').fill('123456')
    await page.getByRole('button', { name: '登录', exact: true }).click()

    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 })
    await expect.poll(() => page.evaluate(() => localStorage.getItem('auth'))).toBeNull()
})

test('短信配置页应加载掩码配置并提供权限化操作', async ({ page }) => {
    await loginWithPassword(page)
    await page.goto('/system/config?tab=sms')

    await expect(page.getByRole('tab', { name: '短信配置' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: '短信配置' })).toBeVisible()
    await expect(page.getByText('模板变量').first()).toBeVisible()
    await expect(page.getByText('code', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '待办到期提醒（todo_due）' })).toBeVisible()
    await expect(page.getByText('title', { exact: true })).toBeVisible()
    await expect(page.getByText('due_at', { exact: true })).toBeVisible()
    await expect(page.locator('.sms-scene').filter({ hasText: '待办到期提醒' }).getByRole('switch')).toBeChecked()
    await expect(page.getByRole('textbox', { name: 'Endpoint' })).toHaveAttribute('readonly', '')
    await expect(page.getByText('固定使用阿里云短信完整官方 URL')).toBeVisible()
    const testButton = page.getByRole('button', { name: '测试配置', exact: true })
    await expect(testButton).toBeVisible()
    await expect(page.getByRole('button', { name: '保存配置', exact: true })).toBeVisible()

    await page.getByRole('textbox', { name: '短信签名' }).first().fill('未保存签名')
    await expect(page.getByText('当前有未保存的修改；测试会使用当前草稿，但正式运行仍使用已保存配置。')).toBeVisible()
    await expect(testButton).toBeEnabled()
    await testButton.click()
    await expect(page.getByText('测试将使用当前表单草稿且不会保存。')).toBeVisible()
})

test('任务异常统计应携带全量统计窗口下钻到执行记录', async ({ page }) => {
    await loginWithPassword(page)
    await page.goto('/task/stats')
    await page.getByTestId('task-stats-failed').click()

    await expect(page).toHaveURL(/\/task\/center\?/)
    await expect
        .poll(() => {
            const url = new URL(page.url())
            return Object.fromEntries(url.searchParams.entries())
        })
        .toMatchObject({
            tab: 'run',
            status: 'failed',
            time_basis: 'finished_at',
            detail_start_time: '2026-06-09 00:00:00',
            detail_end_time: '2026-06-10 23:59:59',
        })
    await expect(page.getByRole('heading', { name: '任务运维' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '执行记录' })).toHaveAttribute('aria-selected', 'true')
})

test('工作台、个人日志和管理员日志应保持各自的数据边界', async ({ page }) => {
    await loginWithPassword(page)

    await expect(page.getByText('今日工作台')).toBeVisible()
    await expect(page.getByText('全局运营与系统状态')).toBeVisible()
    await expect(page.getByText('我的最近操作')).toBeVisible()
    await expect(page.getByTestId('dashboard-monitor-refresh')).toBeVisible()

    await page.goto('/my-request-log')
    await expect(page.getByText('更新个人资料', { exact: true })).toBeVisible()
    await expect(page.getByText('导出日志')).toHaveCount(0)
    await expect(page.getByText('脱敏配置')).toHaveCount(0)
    await page.getByRole('button', { name: '详情', exact: true }).first().click()
    await expect(page.getByTestId('self-change-summary')).toContainText('昵称 从 管理员 改为 超级管理员')
    await expect(page.getByText('JWT ID')).toHaveCount(0)
    await expect(page.getByText('响应体')).toHaveCount(0)

    await page.goto('/log/request-log')
    await expect(page.getByText('请求 ID')).toBeVisible()
    await expect(page.getByText('导出日志')).toBeVisible()
    await expect(page.getByText('脱敏配置')).toBeVisible()
})
