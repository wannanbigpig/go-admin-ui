import { getUserInfo, updateProfile } from '@/api/auth'
import { normalizeDetailData } from '@/modules/shared/response'
import type { UserInfo } from '@/types/auth'

export async function fetchProfile(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, {} as UserInfo)
}

export async function modifyProfile(data: any) {
    return await updateProfile(data)
}
