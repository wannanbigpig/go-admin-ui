import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { DirectiveBinding, ObjectDirective } from 'vue'
import permissionDirective from './permission'
import { hasPermission } from '@/utils/auth'
import { ElMessage } from 'element-plus'

vi.mock('@/utils/auth', () => ({
    hasPermission: vi.fn(),
}))

vi.mock('element-plus', () => ({
    ElMessage: {
        warning: vi.fn(),
    },
}))

vi.mock('@/locales', () => ({
    translate: (key: string) => key,
}))

const mockHasPermission = vi.mocked(hasPermission)
const mockWarning = vi.mocked(ElMessage.warning)
const permissionObjectDirective = permissionDirective as ObjectDirective<HTMLElement, unknown>
const vnode = {} as Parameters<NonNullable<typeof permissionObjectDirective.mounted>>[2]

const createBinding = (value: unknown, options: { arg?: string; modifiers?: Record<string, boolean> } = {}) =>
    ({
        value,
        oldValue: undefined,
        arg: options.arg,
        modifiers: options.modifiers || {},
        instance: null,
        dir: permissionDirective,
    }) as DirectiveBinding

const mountDirective = (el: HTMLElement, binding: DirectiveBinding) => {
    permissionObjectDirective.mounted?.(el, binding, vnode, null)
}

const updateDirective = (el: HTMLElement, binding: DirectiveBinding) => {
    permissionObjectDirective.updated?.(el, binding, vnode, vnode)
}

describe('directives/permission.ts', () => {
    beforeEach(() => {
        mockHasPermission.mockReset()
        mockWarning.mockReset()
        document.body.innerHTML = ''
    })

    it('无权限时默认隐藏元素，权限恢复后应还原显示', () => {
        const el = document.createElement('button')
        document.body.appendChild(el)
        mockHasPermission.mockReturnValueOnce(false)

        mountDirective(el, createBinding('demo:update'))

        expect(el.style.display).toBe('none')
        expect(el.getAttribute('data-permission-hidden')).toBe('true')

        mockHasPermission.mockReturnValueOnce(true)
        updateDirective(el, createBinding('demo:update'))

        expect(el.style.display).not.toBe('none')
        expect(el.hasAttribute('data-permission-hidden')).toBe(false)
    })

    it('disabled 修饰符应禁用交互并拦截点击提示无权限', () => {
        const el = document.createElement('button')
        document.body.appendChild(el)
        mockHasPermission.mockReturnValue(false)

        mountDirective(el, createBinding('demo:delete', { modifiers: { disabled: true } }))
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

        expect(el.getAttribute('data-permission-disabled')).toBe('true')
        expect(el.style.cursor).toBe('not-allowed')
        expect(mockWarning).toHaveBeenCalledWith('layout.noPermission')
    })

    it('remove 修饰符在 mounted 阶段应移除元素', () => {
        const parent = document.createElement('div')
        const el = document.createElement('button')
        parent.appendChild(el)
        document.body.appendChild(parent)
        mockHasPermission.mockReturnValue(false)

        mountDirective(el, createBinding('demo:create', { modifiers: { remove: true } }))

        expect(parent.contains(el)).toBe(false)
    })

    it('or 参数应在任一权限满足时显示元素', () => {
        const el = document.createElement('button')
        document.body.appendChild(el)
        mockHasPermission.mockImplementation((permission) => permission === 'demo:update')

        mountDirective(el, createBinding(['demo:create', 'demo:update'], { arg: 'or' }))

        expect(el.style.display).toBe('')
        expect(mockHasPermission).toHaveBeenCalledWith('demo:create', true)
        expect(mockHasPermission).toHaveBeenCalledWith('demo:update', true)
    })

    it('once 修饰符在 updated 阶段不应重复检查权限', () => {
        const el = document.createElement('button')
        document.body.appendChild(el)
        mockHasPermission.mockReturnValue(true)
        const binding = createBinding('demo:update', { modifiers: { once: true } })

        mountDirective(el, binding)
        updateDirective(el, binding)

        expect(mockHasPermission).toHaveBeenCalledTimes(1)
    })

    it('unmounted 应移除 disabled 模式下的点击拦截', () => {
        const el = document.createElement('button')
        document.body.appendChild(el)
        mockHasPermission.mockReturnValue(false)

        mountDirective(el, createBinding('demo:delete', { modifiers: { disabled: true } }))
        permissionObjectDirective.unmounted?.(el, createBinding('demo:delete'), vnode, null)
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

        expect(mockWarning).not.toHaveBeenCalled()
    })
})
