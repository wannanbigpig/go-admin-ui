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
    // 如果使用了 once 修饰符，跳过更新
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
    // 如果没有传入权限值，默认显示
    if (value === null || value === undefined || value === '') {
      resetElement(el)
      return
    }

    // 检查权限（同时检查显示状态）
    let hasAuth = false

    if (arg === 'or') {
      // 或逻辑：满足任意一个权限即可
      hasAuth = Array.isArray(value) ? value.some((perm) => hasPermission(perm, true)) : hasPermission(value, true)
    } else {
      // 默认逻辑：需要满足所有权限
      hasAuth = hasPermission(value, true)
    }

    // 根据修饰符处理无权限的情况
    if (!hasAuth) {
      if (modifiers.disabled) {
        // disabled 修饰符：禁用元素
        disableElement(el)
      } else if (modifiers.hide) {
        // hide 修饰符：隐藏但保留占位
        hideElement(el)
      } else {
        // 默认：移除元素（仅在首次挂载时）
        if (isMounted) {
          removeElement(el)
        } else {
          hideElement(el)
        }
      }
    } else {
      // 有权限：恢复元素状态
      resetElement(el)
    }
  } catch (error) {
    console.error('[v-permission] 权限检查出错:', error)
    // 出错时默认隐藏元素，避免权限泄露
    hideElement(el)
  }
}

/**
 * 禁用元素
 * @param {HTMLElement} el - DOM 元素
 */
function disableElement(el) {
  // 保存原始 disabled 状态（如果存在）
  if (!el.hasAttribute('data-original-disabled')) {
    el.setAttribute('data-original-disabled', el.disabled ? 'true' : 'false')
  }

  if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
    // 不使用 disabled 属性，而是通过样式和事件处理来模拟禁用
    // 这样点击事件仍然可以触发
    el.setAttribute('data-permission-disabled', 'true')
    el.style.pointerEvents = 'auto'
    el.style.cursor = 'not-allowed'
    el.style.opacity = '0.8'
    // 添加点击事件监听器，显示提示（使用捕获阶段，确保优先执行）
    el.addEventListener('click', showNoPermissionMessage, true)
  } else {
    // 对于其他元素，添加禁用样式和阻止点击
    el.style.pointerEvents = 'auto'
    el.style.opacity = '0.6'
    el.style.cursor = 'not-allowed'
    el.setAttribute('data-permission-disabled', 'true')
    // 添加点击事件监听器，显示提示
    el.addEventListener('click', showNoPermissionMessage, true)
  }
}

/**
 * 隐藏元素但保留占位
 * @param {HTMLElement} el - DOM 元素
 */
function hideElement(el) {
  // 保存原始 display 值
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
  // 恢复 disabled 状态
  if (el.hasAttribute('data-permission-disabled')) {
    if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      // 恢复原始 disabled 状态
      const originalDisabled = el.getAttribute('data-original-disabled')
      if (originalDisabled === 'true') {
        el.disabled = true
      } else {
        el.disabled = false
      }
      el.removeAttribute('data-original-disabled')
      // 移除样式
      el.style.pointerEvents = ''
      el.style.cursor = ''
      el.style.opacity = ''
      // 移除点击事件监听器
      el.removeEventListener('click', showNoPermissionMessage, true)
    } else {
      el.style.pointerEvents = ''
      el.style.opacity = ''
      el.style.cursor = ''
      // 移除点击事件监听器
      el.removeEventListener('click', showNoPermissionMessage, true)
    }
    el.removeAttribute('data-permission-disabled')
  }

  // 恢复显示状态
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
