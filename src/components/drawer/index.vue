<template>
  <el-drawer v-model="model" :direction="direction" :size="size">
    <template #header>
      <h4>{{ title }}</h4>
    </template>
    <template #default>
      <slot />
    </template>
    <template #footer>
      <el-divider />
      <div class="drawer-footer">
        <el-button v-if="withReset" type="warning" @click="handleReset">重置</el-button>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :disabled="isSubmitting" :loading="isSubmitting" @click="handleConfirm">
          {{ isSubmitting ? '提交中...' : '提交' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
// ==================== Props 定义 ====================
const props = defineProps({
  /** 抽屉打开方向 */
  direction: {
    type: String,
    default: 'rtl',
    validator: (value) => ['ltr', 'rtl', 'ttb', 'btt'].includes(value),
  },
  /** 抽屉标题 */
  title: {
    type: String,
    default: '',
  },
  /** 是否显示重置按钮 */
  withReset: {
    type: Boolean,
    default: true,
  },
  /** 提交中状态，控制提交按钮是否禁用 */
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  /** 抽屉尺寸 */
  size: {
    type: [String, Number],
    default: '30%',
  },
  /** 确认提交回调函数 */
  onConfirm: {
    type: Function,
    default: undefined,
  },
  /** 重置回调函数，如果不提供则使用 formRef 的 resetFields 方法 */
  onReset: {
    type: Function,
    default: undefined,
  },
  /** 取消回调函数，如果不提供则关闭抽屉 */
  onCancel: {
    type: Function,
    default: undefined,
  },
  /** 表单引用对象，用于调用 resetFields 方法 */
  formRef: {
    type: Object,
    default: null,
  },
})

// ==================== 响应式数据 ====================
const model = defineModel()

// ==================== 方法 ====================
/**
 * 重置表单
 * 优先使用 onReset 回调，其次使用 formRef 的 resetFields 方法
 */
const handleReset = () => {
  if (props.onReset) {
    props.onReset()
  } else if (props.formRef?.resetFields) {
    props.formRef.resetFields()
  } else {
    throw new Error('自定义重置方法和表单Ref二者必传一个，否则重置按钮无效')
  }
}

/**
 * 取消操作
 * 优先使用 onCancel 回调，否则关闭抽屉
 */
const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  } else {
    model.value = false
  }
}

/**
 * 确认提交
 * 必须提供 onConfirm 回调函数
 */
const handleConfirm = () => {
  if (props.onConfirm) {
    props.onConfirm()
  } else {
    throw new Error('自定义表单提交方法必传，否则提交按钮无效')
  }
}
</script>

<style lang="scss" scoped>
.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
