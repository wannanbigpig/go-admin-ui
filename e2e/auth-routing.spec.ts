import { expect, test } from '@playwright/test'

test('登录后应进入权限动态路由且不持久化认证状态', async ({ page }) => {
    await page.goto('/login')
    const captchaInput = page.getByPlaceholder('验证码')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await captchaInput.fill('1234')
    await expect(captchaInput).toHaveValue('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()

    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 })
    await expect.poll(() => page.evaluate(() => localStorage.getItem('auth'))).toBeNull()

    await page.goto('/system/notification-manage')
    await expect(page).toHaveURL(/\/system\/notification-manage$/)
    await expect(page.getByRole('button', { name: '提交', exact: true })).toBeVisible()
})
