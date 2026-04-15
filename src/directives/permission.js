import { hasPermission } from '@/utils/auth'
import { ElMessage } from 'element-plus'

/**
 * 增强版按钮权限指令
 *
 * 使用方法：
 * v-permission="'adminUser:edit'" - 单个权限（默认：无权限时移除元素）
 * v-permission="['adminUser:edit', 'adminUser:delete']" - 多个权限（需要全部满足）
 * v-permission:or="['adminUser:edit', 'adminUser:delete']" - 多个权限（满足任意一个）
 *
 * 修饰符：
 * v-permission.disabled="'adminUser:edit'" - 无权限时禁用元素（而非隐藏）
 * v-permission.hide="'adminUser:edit'" - 无权限时隐藏元素但保留占位
 * v-permission.once="'adminUser:edit'" - 只检查一次，不响应权限更新
 * v-permission.disabled.hide.once="'adminUser:edit'" - 可以组合使用
 */
export default {
    mounted(el, binding) {
        handlePermission(el, binding, true)
    },
    updated(el, binding) {
        if (binding.modifiers.once) {
            return
        }
        handlePermission(el, binding, false)
    },
}

/**
 * 处理权限逻辑
 * @param {HTMLElement} el - DOM 元素
 * @param {Object} binding - 指令绑定对象
 * @param {boolean} isMounted - 是否是首次挂载
 */
function handlePermission(el, binding, isMounted) {
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
            } else if (modifiers.hide) {
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
        console.error('[v-permission] 权限检查出错:', error)
        hideElement(el)
    }
}

/**
 * 禁用元素
 * @param {HTMLElement} el - DOM 元素
 */
function disableElement(el) {
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

/**
 * 隐藏元素但保留占位
 * @param {HTMLElement} el - DOM 元素
 */
function hideElement(el) {
    if (!el.hasAttribute('data-original-display')) {
        const originalDisplay = window.getComputedStyle(el).display
        el.setAttribute('data-original-display', originalDisplay || '')
    }
    el.style.display = 'none'
    el.setAttribute('data-permission-hidden', 'true')
}

/**
 * 移除元素
 * @param {HTMLElement} el - DOM 元素
 */
function removeElement(el) {
    if (el.parentNode) {
        el.parentNode.removeChild(el)
    }
}

/**
 * 恢复元素状态
 * @param {HTMLElement} el - DOM 元素
 */
function resetElement(el) {
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

/**
 * 显示无权限提示消息
 * @param {Event} event - 事件对象
 */
function showNoPermissionMessage(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    ElMessage.warning('暂无权限')
}
