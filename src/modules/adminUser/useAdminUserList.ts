import { reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { useListPage } from '@/composables/useListPage'
import { fetchAdminUserFullEmail, fetchAdminUserFullPhone, fetchAdminUserList } from '@/modules/adminUser/service'
import { fetchDepartmentList } from '@/modules/department/service'
import { flattenTree } from '@/utils/helper'
import type { AdminUser } from '@/types/adminUser'
import type { FormInstance } from 'element-plus'

export function useAdminUserList() {
    const queryFormRef = ref<FormInstance>()
    const departmentOptions = ref<{ label: string; value: string | number }[]>([])
    const fullInfoCache = new Map<string, unknown>()
    const queryWhere = reactive({
        page: 1,
        per_page: 10,
        username: undefined as string | undefined,
        phone_number: undefined as string | undefined,
        status: undefined as number | undefined,
        email: undefined as string | undefined,
        dept_id: null as number | null,
    })

    const getDepartmentOptions = async () => {
        try {
            const departmentData = await fetchDepartmentList()
            if (!Array.isArray(departmentData)) {
                departmentOptions.value = []
                return
            }

            const flattenedOptions = flattenTree(departmentData)
            departmentOptions.value = flattenedOptions
                .filter((item): item is { label: string; value: string | number } => {
                    return typeof item.value === 'string' || typeof item.value === 'number'
                })
                .map((item) => ({
                    label: item.label,
                    value: item.value,
                }))
        } catch (error) {
            Logger.error('获取部门列表失败:', error)
        }
    }

    const {
        loading,
        items: adminUserList,
        pagination,
        getList,
        handleSearch,
        handleReset,
    } = useListPage<AdminUser, typeof queryWhere>({
        query: queryWhere,
        queryFormRef,
        transformParams: (query) => ({
            ...query,
            username: query.username?.trim() || undefined,
        }),
        fetcher: async (params) => {
            try {
                const result = await fetchAdminUserList(params)
                fullInfoCache.clear()
                return result
            } catch (error) {
                Logger.error('获取管理员列表失败:', error)
                return {
                    list: [],
                    total: 0,
                    page: params.page ?? 1,
                    pageSize: params.per_page ?? 10,
                }
            }
        },
    })

    const createToggleFullInfo = (field: string, oldField: string, fetchFn: (id: string | number) => Promise<Record<string, unknown>>) => {
        return async (row: AdminUser) => {
            const r = row as AdminUser & Record<string, unknown>
            const showField = `showFull${field.charAt(0).toUpperCase() + field.slice(1)}`
            const loadingField = `${showField}Loading`
            const cacheKey = `${r.id}:${field}`
            if (r[loadingField]) return

            const swapValues = () => {
                const oldValue = r[oldField]
                r[oldField] = r[field]
                r[field] = oldValue
            }

            if (r[showField]) {
                swapValues()
                r[showField] = false
                return
            }

            if (r[oldField] === undefined) {
                r[oldField] = r[field]
            }

            if (fullInfoCache.has(cacheKey)) {
                r[field] = fullInfoCache.get(cacheKey)
                r[showField] = true
                return
            }

            r[loadingField] = true
            try {
                const detail = await fetchFn(r.id)
                const fullValue = detail[field]
                fullInfoCache.set(cacheKey, fullValue)
                r[field] = fullValue
                r[showField] = true
            } catch (error) {
                Logger.error('获取完整敏感信息失败:', error)
                r[field] = r[oldField]
                r[showField] = false
            } finally {
                r[loadingField] = false
            }
        }
    }

    const isFullInfoLoading = (row: AdminUser, field: string) => {
        const showField = `showFull${field.charAt(0).toUpperCase() + field.slice(1)}`
        return Boolean((row as Record<string, unknown>)[`${showField}Loading`])
    }

    return {
        loading,
        adminUserList,
        departmentOptions,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        getDepartmentOptions,
        handleSearch,
        handleReset,
        createToggleFullInfo,
        isFullInfoLoading,
        fetchAdminUserFullPhone,
        fetchAdminUserFullEmail,
    }
}
