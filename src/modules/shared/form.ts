import type { FormInstance } from 'element-plus'
import { Logger } from '@/utils/logger'

/**
 * 统一处理表单校验：
 * - 校验通过返回 true
 * - 校验失败（包括缺失 formRef）返回 false
 */
export async function validateFormSafely(formRef: FormInstance | undefined | null, formName: string): Promise<boolean> {
    if (!formRef) {
        Logger.warn(`[${formName}] 表单实例不存在，已跳过提交`)
        return false
    }

    try {
        await formRef.validate()
        return true
    } catch (error) {
        // 校验失败属于预期分支，统一在此处收敛处理，避免业务层使用空 catch。
        Logger.warn(`[${formName}] 表单校验未通过`, error)
        return false
    }
}
