import { fetchCurrentUser, saveProfile } from '@/modules/auth/service'
import { uploadAvatarFile } from '@/modules/adminUser/service'

export async function fetchProfileDetail() {
    return fetchCurrentUser()
}

export async function updateProfileDetail(data) {
    return saveProfile(data)
}

export async function uploadProfileAvatar(files, extra = {}) {
    return uploadAvatarFile(files, extra)
}
