import { changeProfilePhone, getProfileSecurityOptions, getUserInfo, sendProfileCode, updateProfile } from '@/api/auth'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { normalizeDetailData } from '@/modules/shared/response'
import type { ChangePhonePayload, ProfileCodePayload, ProfileSecurityOptions, SmsCodeSendResult, UpdateProfilePayload, UserInfo } from '@/types/auth'

export async function fetchProfile(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, createEmptyUserInfo())
}

export async function modifyProfile(data: UpdateProfilePayload) {
    return await updateProfile(data)
}

export async function fetchProfileSecurityOptions(): Promise<ProfileSecurityOptions> {
    const result = await getProfileSecurityOptions()
    if (!result || typeof result.sms_verification_required !== 'boolean') throw new Error('Invalid profile security options')
    return result
}

export async function requestProfileCode(data: ProfileCodePayload): Promise<SmsCodeSendResult> {
    const result = await sendProfileCode(data)
    if (!result || typeof result.challenge_id !== 'string') throw new Error('Invalid SMS challenge response')
    return result
}

export const submitPhoneChange = (data: ChangePhonePayload) => changeProfilePhone(data)
