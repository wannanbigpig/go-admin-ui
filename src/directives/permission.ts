import { hasPermission } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import { Logger } from '@/utils/logger'
import type { Directive, DirectiveBinding } from 'vue'
import { translate } from '@/locales'

interface PermissionHTMLElement extends HTMLElement {
    disabled?: boolean
    [key: string]: unknown
}

/**
 * 增强版按钮权限指令。
 *
 * 语义约定（TypeSafe 实验 + 产品核对后保持现状）：
 * - `v-permission` 调用 `hasPermission(code, true)`，同时校验权限码与 `is_show`。
 * - `is_show=0` 表示“UI 不展示”，不是“无权限”：API/Casbin 仍以权限码为权威。
 * - 需要“有码即可见、隐藏只靠别的开关”时，用 `hasPermission(code)`（checkShow=false），不要改本指令默认行为。
 */
const permissionDirective: Directive = {
    mounted(el: PermissionHTMLElement, binding: DirectiveBinding) {
        handlePermission(el, binding, true)
    },
    updated(el: PermissionHTMLElement, binding: DirectiveBinding) {
        if (binding.modifiers.once) {
            return
        }
        handlePermission(el, binding, false)
    },
    unmounted(el: PermissionHTMLElement) {
        el.removeEventListener('click', showNoPermissionMessage, true)
    },
}

/**
 * 处理权限逻辑
 */
function handlePermission(el: PermissionHTMLElement, binding: DirectiveBinding, isMounted: boolean) {
    const { value, arg, modifiers } = binding

    try {
        if (value === null || value === undefined || value === '') {
            resetElement(el)
            return
        }

        const hasAuth = arg === 'or' ? (Array.isArray(value) ? value.some((perm) => hasPermission(perm, true)) : hasPermission(value, true)) : hasPermission(value, true)

        if (!hasAuth) {
            if (modifiers.disabled) {
                disableElement(el)
            } else if (modifiers.hide || !modifiers.remove) {
                hideElement(el)
            } else if (isMounted) {
                removeElement(el)
            } else {
                hideElement(el)
            }
            return
        }

        resetElement(el)
    } catch (error) {
        Logger.error('[v-permission] 权限检查出错:', error)
        hideElement(el)
    }
}

function disableElement(el: PermissionHTMLElement) {
    if (el.hasAttribute('data-permission-disabled')) {
        return
    }
    if (!el.hasAttribute('data-original-disabled')) {
        el.setAttribute('data-original-disabled', el.disabled ? 'true' : 'false')
    }

    const isNativeControl = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
    el.setAttribute('data-permission-disabled', 'true')
    el.style.pointerEvents = 'auto'
    el.style.cursor = 'not-allowed'
    el.style.opacity = isNativeControl ? '0.8' : '0.6'
    el.addEventListener('click', showNoPermissionMessage, true)
}

function hideElement(el: PermissionHTMLElement) {
    if (!el.hasAttribute('data-original-display')) {
        const originalDisplay = window.getComputedStyle(el).display
        el.setAttribute('data-original-display', originalDisplay || '')
    }
    el.style.display = 'none'
    el.setAttribute('data-permission-hidden', 'true')
}

function removeElement(el: PermissionHTMLElement) {
    if (el.parentNode) {
        el.parentNode.removeChild(el)
    }
}

function resetElement(el: PermissionHTMLElement) {
    if (el.hasAttribute('data-permission-disabled')) {
        if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            const originalDisabled = el.getAttribute('data-original-disabled')
            el.disabled = originalDisabled === 'true'
            el.removeAttribute('data-original-disabled')
        }

        el.style.pointerEvents = ''
        el.style.cursor = ''
        el.style.opacity = ''
        el.removeEventListener('click', showNoPermissionMessage, true)
        el.removeAttribute('data-permission-disabled')
    }

    if (el.hasAttribute('data-permission-hidden')) {
        const originalDisplay = el.getAttribute('data-original-display')
        el.style.display = originalDisplay || ''
        el.removeAttribute('data-original-display')
        el.removeAttribute('data-permission-hidden')
    }
}

function showNoPermissionMessage(event: Event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    ElMessage.warning(translate('layout.noPermission'))
}

export default permissionDirective
