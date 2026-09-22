import type { Component } from 'vue'
import type { StorageConfig, StorageSecretField } from '@/types/system'
import LocalStorageProviderForm from './LocalStorageProviderForm.vue'
import AliyunOssProviderForm from './AliyunOssProviderForm.vue'

export type StorageProviderConfig = Record<string, unknown>

export interface StorageSecretRevealDefinition {
    // 只有后端 DriverDefinition 已声明的 SensitiveField 才能通过凭据接口读取；
    // 前端注册不能绕过后端字段白名单和 storage:secret 权限。
    driver: string
    field: StorageSecretField
    getValue: (config: StorageProviderConfig) => string
    setValue: (config: StorageProviderConfig, value: string) => void
}

export interface StorageProviderFormDefinition<T extends StorageProviderConfig = StorageProviderConfig> {
    key: string
    label: string
    labelKey?: string
    component: Component
    createDefaultConfig: () => T
    secretReveal?: StorageSecretRevealDefinition
}

const localProvider: StorageProviderFormDefinition = {
    key: 'local',
    label: 'Local Storage',
    labelKey: 'system.storage.drivers.local',
    component: LocalStorageProviderForm,
    createDefaultConfig: () => ({ base_path: '', public_base_path: '', private_base_path: '' }),
}

const aliyunOssProvider: StorageProviderFormDefinition = {
    key: 'aliyun_oss',
    label: 'Aliyun OSS',
    labelKey: 'system.storage.drivers.aliyunOss',
    component: AliyunOssProviderForm,
    createDefaultConfig: () => ({
        endpoint: '',
        region: '',
        bucket: '',
        access_key_id: '',
        access_key_secret: '',
        public_domain: '',
        internal_endpoint: '',
        force_path_style: false,
    }),
    secretReveal: {
        driver: 'aliyun_oss',
        field: 'access_key_secret',
        getValue: (config) => String(config.access_key_secret || ''),
        setValue: (config, value) => {
            config.access_key_secret = value
        },
    },
}

// 显式 UI 扩展点：供应商维护自己的字段、校验和默认值，主面板只负责
// 选择、渲染与保存。未知供应商不会被删除，仍按原始配置回传。
export const storageProviderForms: StorageProviderFormDefinition[] = [localProvider, aliyunOssProvider]

export const registerStorageProviderForm = (definition: StorageProviderFormDefinition): (() => void) => {
    const key = definition.key.trim()
    if (!key || storageProviderForms.some((item) => item.key === key)) {
        throw new Error(`Storage provider form ${key || '<empty>'} is already registered or invalid`)
    }
    const normalized = { ...definition, key }
    storageProviderForms.push(normalized)
    return () => {
        const index = storageProviderForms.indexOf(normalized)
        if (index >= 0) storageProviderForms.splice(index, 1)
    }
}

export const createRegisteredStorageProviderDefaults = (): Record<string, StorageProviderConfig> => Object.fromEntries(storageProviderForms.map((definition) => [definition.key, definition.createDefaultConfig()]))

export const mergeRegisteredStorageProviderDefaults = (config: StorageConfig['config']): StorageConfig['config'] => {
    const result = { ...config } as StorageConfig['config']
    for (const definition of storageProviderForms) {
        const configured = config[definition.key]
        result[definition.key] = {
            ...definition.createDefaultConfig(),
            ...(configured && typeof configured === 'object' ? configured : {}),
        }
    }
    return result
}
