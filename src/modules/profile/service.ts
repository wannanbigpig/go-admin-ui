import { getUserInfo, updateProfile } from '@/api/auth'
import { uploadAvatarFile } from '@/modules/adminUser/service'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { normalizeDetailData } from '@/modules/shared/response'
import type { UserInfo } from '@/types/auth'

export async function fetchProfile(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, createEmptyUserInfo())
}

export async function modifyProfile(data: Record<string, unknown>) {
    return await updateProfile(data)
}

export async function uploadProfileAvatar(file: File, extra: Record<string, unknown>) {
    return uploadAvatarFile(file, extra)
}
