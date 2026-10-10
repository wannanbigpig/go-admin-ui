import { expect, test } from '@playwright/test'

for (const mime of ['text/html', 'image/svg+xml', 'application/octet-stream']) {
    test(`私有 ${mime} 仅下载且不能执行同源脚本`, async ({ page, context }) => {
        // Only the local Vite app and development Mock are used.
        await page.route('**/admin/**', (route) => route.abort())
        await page.goto('/login')
        await page.evaluate(async (mime) => {
            const vueURL = '/node_modules/.vite/deps/vue.js'
            const componentURL = '/src/views/system/components/FileDetailDrawer.vue'
            const localeURL = '/src/locales/index.ts'
            const mockURL = '/src/mock/modules/system.ts'
            const [{ createApp }, { default: Drawer }, { i18n }, { systemMock }] = await Promise.all([
                import(vueURL), import(componentURL), import(localeURL), import(mockURL),
            ])
            const browser = window as typeof window & { fileSecurityRequests: number }
            browser.fileSecurityRequests = 0
            localStorage.removeItem('file-security-script-ran')
            const code = "localStorage.setItem('file-security-script-ran', 'yes')"
            const content = mime === 'image/svg+xml'
                ? `<svg xmlns="http://www.w3.org/2000/svg" onload="${code}"/>`
                : `<html><script>${code}</script></html>`
            // Replace one shared Mock route object before making the file request.
            const route = systemMock.find((item: { method: string }) => item.method === 'GET')
            route.pattern = /^\/v1\/file\/security-fixture$/
            route.handler = () => {
                browser.fileSecurityRequests++
                return new Blob([content], { type: mime })
            }
            const host = document.createElement('div')
            document.body.appendChild(host)
            createApp(Drawer, {
                modelValue: true, references: [], loading: false,
                file: { uuid: 'security-fixture', origin_name: 'untrusted-document.' + (mime === 'text/html' ? 'html' : mime === 'image/svg+xml' ? 'svg' : 'bin'), url: '/admin/v1/file/security-fixture', is_public: 0, file_type: 'document', mime_type: 'application/pdf' },
            }).use(i18n).mount(host)
        }, mime)
        const downloadPromise = page.waitForEvent('download')
        await page.locator('.detail-link').click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe('untrusted-document.' + (mime === 'text/html' ? 'html' : mime === 'image/svg+xml' ? 'svg' : 'bin'))
        expect(await download.failure()).toBeNull()
        expect(await page.evaluate(() => localStorage.getItem('file-security-script-ran'))).toBeNull()
        expect(await page.evaluate(() => (window as typeof window & { fileSecurityRequests: number }).fileSecurityRequests)).toBe(1)
        await expect.poll(() => context.pages().length).toBe(1)
    })
}
