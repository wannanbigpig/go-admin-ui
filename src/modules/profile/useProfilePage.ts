import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { fetchProfile, modifyProfile } from '@/modules/profile/service'
import { useAuthStore } from '@/stores/auth'

export function useProfilePage() {
    const loading = ref(false)
    const isSubmitting = ref(false)
    const formDataRef = ref<FormInstance>()
    const authStore = useAuthStore()

    const formData = reactive({
        nickname: '',
        avatar: '',
        mobile: '',
        email: '',
    })

    const getProfile = async () => {
        loading.value = true
        try {
            const data = await fetchProfile()
            Object.assign(formData, {
                nickname: data.nickname || '',
                avatar: data.avatar || '',
                mobile: data.mobile || '',
                email: data.email || '',
            })
        } catch (error) {
            console.error('获取个人信息失败:', error)
        } finally {
            loading.value = false
        }
    }

    const handleSubmit = async () => {
        const valid = await formDataRef.value?.validate().catch(() => false)
        if (!valid) return

        isSubmitting.value = true
        try {
            await modifyProfile(formData)
            ElMessage.success('修改成功')
            // 更新 Store 中的用户信息
            await authStore.refreshUserInfo()
        } catch (error) {
            console.error('修改失败:', error)
        } finally {
            isSubmitting.value = false
        }
    }

    return {
        loading,
        isSubmitting,
        formDataRef,
        formData,
        getProfile,
        handleSubmit,
    }
}
