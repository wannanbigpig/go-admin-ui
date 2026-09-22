import { expect, test } from '@playwright/test'

test('导出记录独立于任务运维，登录用户可查看个人导出页面', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('请输入用户名').fill('super_admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.getByPlaceholder('验证码').fill('1234')
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 })

    await page.locator('[aria-label="导出中心"]').click()
    await expect(page).toHaveURL(/\/my-exports$/)
    await expect(page.getByText('我的导出').first()).toBeVisible()
    await expect(page.getByText('cf70a3fa', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('queue publisher unavailable')).toHaveCount(0)
    await page.getByText('详情', { exact: true }).first().click()
    await expect(page.getByText('导出编号', { exact: true }).last()).toBeVisible()
    await expect(page.getByText('执行记录ID', { exact: true })).toHaveCount(0)

    await page.goto('/task/center')
    await expect(page.getByRole('tab', { name: '导出记录' })).toHaveCount(0)
})
