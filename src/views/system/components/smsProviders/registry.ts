import type { Component } from 'vue'
import type { SmsAliyunProviderConfig, SmsProviderConfig, SmsTemplateConfig } from '@/types/system'
import AliyunSmsProviderForm from './AliyunSmsProviderForm.vue'

export const ALIYUN_SMS_ENDPOINT = 'https://dysmsapi.aliyuncs.com'

export interface SmsProviderFormDefinition<T extends SmsProviderConfig = SmsProviderConfig> {
    key: string
    label: string
    component: Component
    createDefaultConfig: () => T
    createDefaultTemplates: () => Record<string, SmsTemplateConfig>
}

const aliyunProvider: SmsProviderFormDefinition<SmsAliyunProviderConfig> = {
    key: 'aliyun',
    label: 'Aliyun SMS',
    component: AliyunSmsProviderForm,
    createDefaultConfig: () => ({
        enabled: false,
        access_key_id: '',
        access_key_secret: '',
        endpoint: ALIYUN_SMS_ENDPOINT,
    }),
    createDefaultTemplates: () => ({
        login_otp: { sign_name: '', template_code: '', variables: ['code'] },
        todo_due: { sign_name: '', template_code: '', variables: ['title', 'due_at'] },
    }),
}

// Explicit UI extension point. A provider owns its credential form and template
// defaults; the main panel handles scene routing without provider branches.
export const smsProviderForms: SmsProviderFormDefinition[] = [aliyunProvider]

export const registerSmsProviderForm = (definition: SmsProviderFormDefinition): (() => void) => {
    const key = definition.key.trim()
    if (!key || smsProviderForms.some((item) => item.key === key)) {
        throw new Error(`SMS provider form ${key || '<empty>'} is already registered or invalid`)
    }
    const normalized = { ...definition, key }
    smsProviderForms.push(normalized)
    return () => {
        const index = smsProviderForms.indexOf(normalized)
        if (index >= 0) smsProviderForms.splice(index, 1)
    }
}

export const createRegisteredSmsProviderDefaults = () => Object.fromEntries(smsProviderForms.map((definition) => [definition.key, definition.createDefaultConfig()])) as Record<string, SmsProviderConfig>

export const createRegisteredSmsTemplateDefaults = () =>
    Object.fromEntries(smsProviderForms.map((definition) => [definition.key, definition.createDefaultTemplates()])) as Record<string, Record<string, SmsTemplateConfig>>
