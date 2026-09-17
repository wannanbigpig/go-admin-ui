import { getUserInfo, updateProfile } from '@/api/auth'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { normalizeDetailData } from '@/modules/shared/response'
import type { UpdateProfilePayload, UserInfo } from '@/types/auth'

export async function fetchProfile(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, createEmptyUserInfo())
}

export async function modifyProfile(data: UpdateProfilePayload) {
    return await updateProfile(data)
}
