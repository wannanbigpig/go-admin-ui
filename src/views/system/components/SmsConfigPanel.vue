<template>
    <div class="sms-panel">
        <div class="panel-header">
            <div class="panel-title-wrapper">
                <span class="panel-title-bar"></span>
                <h3 class="panel-title">{{ t('system.sms.title') }}</h3>
            </div>
            <p class="panel-description">{{ t('system.sms.description') }}</p>
        </div>

        <el-alert v-if="hasUnsavedChanges" class="sms-unsaved-alert" type="warning" :title="t('system.sms.unsavedChanges')" :closable="false" show-icon />

        <el-skeleton v-if="loading" animated :rows="10" />

        <el-alert v-else-if="loadError" :title="t('system.sms.loadFailed')" type="error" :closable="false" show-icon>
            <el-button @click="loadConfig">{{ t('common.actions.retry') }}</el-button>
        </el-alert>

        <el-form v-else-if="configLoaded" ref="formRef" :model="formData" :rules="formRules" :validate-on-rule-change="false" scroll-to-error :scroll-into-view-options="{ block: 'center', behavior: 'smooth' }" label-width="190px" class="sms-form">
            <el-form-item :label="t('system.sms.enabled')" prop="enabled">
                <el-switch v-model="formData.enabled" />
            </el-form-item>

            <el-divider>{{ t('system.sms.providerTitle') }}</el-divider>
            <section v-for="provider in smsProviderForms" :key="provider.key" class="sms-provider">
                <component :is="provider.component" v-model="formData.providers[provider.key]" />
            </section>

            <el-divider>{{ t('system.sms.sceneTitle') }}</el-divider>
            <section class="sms-scene">
                <div class="sms-scene__header">
                    <div>
                        <h4>{{ t('system.sms.loginScene') }}</h4>
                        <p>{{ t('system.sms.loginSceneHint') }}</p>
                    </div>
                    <el-tag type="success">{{ t('system.sms.requiredScene') }}</el-tag>
                </div>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.sms.routeProvider')" prop="routes.login_otp.provider">
                            <el-select v-model="formData.routes.login_otp.provider" @change="handleSceneProviderChange('login_otp')">
                                <el-option v-for="provider in providerOptions" :key="provider.value" :label="provider.label" :value="provider.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.sms.routeTemplate')" prop="routes.login_otp.template">
                            <el-select v-model="formData.routes.login_otp.template" @change="ensureSceneTemplate('login_otp')">
                                <el-option v-for="template in sceneTemplateOptions('login_otp')" :key="template.value" :label="template.label" :value="template.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.sms.signName')" :prop="sceneTemplateProp('login_otp', 'sign_name')" :rules="sceneTemplateRules('login_otp', 'sign_name')">
                            <el-input v-model.trim="loginTemplateSignName" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.sms.templateCode')" :prop="sceneTemplateProp('login_otp', 'template_code')" :rules="sceneTemplateRules('login_otp', 'template_code')">
                            <el-input v-model.trim="loginTemplateCode" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('system.sms.templateVariables')">
                    <el-tag v-for="variable in sceneVariables.login_otp" :key="variable" type="info">{{ variable }}</el-tag>
                </el-form-item>
                <p class="sms-field-tip">{{ t('system.sms.routeHint') }}</p>
            </section>

            <section class="sms-scene">
                <div class="sms-scene__header">
                    <div>
                        <h4>{{ t('system.sms.todoScene') }}</h4>
                        <p>{{ t('system.sms.todoSceneHint') }}</p>
                    </div>
                    <el-switch v-model="todoDueEnabled" :active-text="t('system.sms.enableTodoScene')" />
                </div>
                <template v-if="todoDueEnabled">
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item :label="t('system.sms.routeProvider')" prop="routes.todo_due.provider">
                                <el-select v-model="todoDueRoute.provider" @change="handleSceneProviderChange('todo_due')">
                                    <el-option v-for="provider in providerOptions" :key="provider.value" :label="provider.label" :value="provider.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="t('system.sms.routeTemplate')" prop="routes.todo_due.template">
                                <el-select v-model="todoDueRoute.template" @change="ensureSceneTemplate('todo_due')">
                                    <el-option v-for="template in sceneTemplateOptions('todo_due')" :key="template.value" :label="template.label" :value="template.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item :label="t('system.sms.signName')" :prop="sceneTemplateProp('todo_due', 'sign_name')" :rules="sceneTemplateRules('todo_due', 'sign_name')">
                                <el-input v-model.trim="todoTemplateSignName" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="t('system.sms.templateCode')" :prop="sceneTemplateProp('todo_due', 'template_code')" :rules="sceneTemplateRules('todo_due', 'template_code')">
                                <el-input v-model.trim="todoTemplateCode" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item :label="t('system.sms.templateVariables')">
                        <div class="sms-tags">
                            <el-tag v-for="variable in sceneVariables.todo_due" :key="variable" type="info">{{ variable }}</el-tag>
                        </div>
                    </el-form-item>
                    <p class="sms-field-tip">{{ t('system.sms.todoRouteHint') }}</p>
                </template>
            </section>

            <el-divider>{{ t('system.sms.otpTitle') }}</el-divider>
            <el-row :gutter="16">
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.ttlSeconds')" prop="otp.ttl_seconds">
                        <el-input-number v-model="formData.otp.ttl_seconds" :min="60" :step="60" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.resendInterval')" prop="otp.resend_interval_seconds">
                        <el-input-number v-model="formData.otp.resend_interval_seconds" :min="1" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.maxAttempts')" prop="otp.max_attempts">
                        <el-input-number v-model="formData.otp.max_attempts" :min="1" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.ipLimit')" prop="otp.ip_limit_per_10_minutes">
                        <el-input-number v-model="formData.otp.ip_limit_per_10_minutes" :min="1" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.phoneDailyLimit')" prop="otp.phone_daily_limit">
                        <el-input-number v-model="formData.otp.phone_daily_limit" :min="1" />
                    </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="8">
                    <el-form-item :label="t('system.sms.globalDailyLimit')" prop="otp.global_daily_limit">
                        <el-input-number v-model="formData.otp.global_daily_limit" :min="1" />
                    </el-form-item>
                </el-col>
            </el-row>

            <div class="panel-actions-bottom">
                <xl-action-button v-permission="'sms:test'" code="sms:test" :text="t('system.sms.test')" type="default" :show-icon="false" :loading="testing" :disabled="!configLoaded || loading || saving" @click="handleTest" />
                <xl-action-button v-permission="'sms:update'" code="sms:update" :text="t('system.sms.save')" type="primary" :show-icon="false" :loading="saving" :disabled="!configLoaded || loading || testing" @click="handleSave" />
            </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlActionButton from '@/components/actionButton/index.vue'
import { validateFormSafely } from '@/modules/shared/form'
import { fetchSmsConfig, testSmsConnection, updateSmsConfig } from '@/modules/system/service'
import type { SmsAliyunProviderConfig, SmsConfig, SmsConfigPayload, SmsProviderConfig, SmsRouteConfig, SmsTemplateConfig } from '@/types/system'
import { Logger } from '@/utils/logger'
import { ALIYUN_SMS_ENDPOINT, createRegisteredSmsProviderDefaults, createRegisteredSmsTemplateDefaults, smsProviderForms } from './smsProviders/registry'

const { t } = useI18n()
type SmsScene = 'login_otp' | 'todo_due'
type SmsTemplateField = 'sign_name' | 'template_code'

const sceneVariables: Record<SmsScene, string[]> = {
    login_otp: ['code'],
    todo_due: ['title', 'due_at'],
}

const cloneTemplates = (templates: SmsConfig['templates'] | Record<string, Record<string, SmsTemplateConfig>>) =>
    Object.fromEntries(
        Object.entries(templates).map(([provider, providerTemplates]) => [
            provider,
            Object.fromEntries(Object.entries(providerTemplates).map(([name, template]) => [name, { ...template, variables: [...template.variables] }])),
        ])
    ) as SmsConfig['templates']

const mergeTemplates = (defaults: SmsConfig['templates'], configured: SmsConfig['templates'] | undefined): SmsConfig['templates'] => {
    const merged = cloneTemplates(defaults)
    for (const [provider, providerTemplates] of Object.entries(configured || {})) {
        merged[provider] ||= {}
        for (const [name, template] of Object.entries(providerTemplates)) {
            const fallback = merged[provider][name]
            merged[provider][name] = {
                ...fallback,
                ...template,
                variables: [...(template.variables || fallback?.variables || [])],
            }
        }
    }
    return merged
}

const createDefaultConfig = (): SmsConfig => {
    const providers = createRegisteredSmsProviderDefaults() as SmsConfig['providers']
    const templates = createRegisteredSmsTemplateDefaults() as SmsConfig['templates']
    return {
        enabled: false,
        providers,
        templates,
        routes: {
            login_otp: {
                provider: 'aliyun',
                template: 'login_otp',
            },
        },
        otp: {
            ttl_seconds: 300,
            resend_interval_seconds: 60,
            max_attempts: 5,
            ip_limit_per_10_minutes: 10,
            phone_daily_limit: 20,
            global_daily_limit: 1000,
        },
    }
}

const formRef = ref<FormInstance>()
const loading = ref(false)
const configLoaded = ref(false)
const loadError = ref(false)
const saving = ref(false)
const testing = ref(false)
const formData = reactive(createDefaultConfig())
const savedConfigSignature = ref('')
const todoDueEnabled = ref(false)
const todoDueRoute = reactive({ provider: 'aliyun', template: 'todo_due' })
const providerOptions = computed(() => {
    const labels = new Map(smsProviderForms.map((provider) => [provider.key, provider.label]))
    return [...new Set([...smsProviderForms.map((provider) => provider.key), ...Object.keys(formData.providers)])].map((provider) => ({
        label: labels.get(provider) || provider,
        value: provider,
    }))
})

const routeForScene = (scene: SmsScene): SmsRouteConfig => (scene === 'login_otp' ? formData.routes.login_otp : todoDueRoute)
const isSceneEnabled = (scene: SmsScene) => formData.enabled && (scene === 'login_otp' || todoDueEnabled.value)
const sameVariables = (left: string[], right: string[]) => left.length === right.length && left.every((value) => right.includes(value))

const ensureSceneTemplate = (scene: SmsScene): SmsTemplateConfig => {
    const route = routeForScene(scene)
    const provider = route.provider.trim()
    const template = route.template.trim()
    formData.templates[provider] ||= {}
    formData.templates[provider][template] ||= {
        sign_name: '',
        template_code: '',
        variables: [...sceneVariables[scene]],
    }
    return formData.templates[provider][template]
}

const sceneTemplateOptions = (scene: SmsScene) => {
    const route = routeForScene(scene)
    return Object.entries(formData.templates[route.provider] || {})
        .filter(([name, template]) => name === route.template || sameVariables(template.variables, sceneVariables[scene]))
        .map(([name]) => ({ label: name, value: name }))
}

const handleSceneProviderChange = (scene: SmsScene) => {
    const route = routeForScene(scene)
    const templates = formData.templates[route.provider] || {}
    const compatible = Object.entries(templates).find(([, template]) => sameVariables(template.variables, sceneVariables[scene]))?.[0]
    route.template = templates[scene] ? scene : compatible || scene
    ensureSceneTemplate(scene)
}

const sceneTemplateProp = (scene: SmsScene, field: SmsTemplateField) => {
    const route = routeForScene(scene)
    return ['templates', route.provider, route.template, field]
}

const sceneTemplateRules = (scene: SmsScene, field: SmsTemplateField) => [
    {
        required: isSceneEnabled(scene),
        message: t(field === 'sign_name' ? 'system.sms.form.signNameRequired' : 'system.sms.form.templateCodeRequired'),
        trigger: 'blur',
    },
]

const sceneTemplateField = (scene: SmsScene, field: SmsTemplateField) =>
    computed({
        get: () => ensureSceneTemplate(scene)[field],
        set: (value: string) => {
            ensureSceneTemplate(scene)[field] = value
        },
    })

const loginTemplateSignName = sceneTemplateField('login_otp', 'sign_name')
const loginTemplateCode = sceneTemplateField('login_otp', 'template_code')
const todoTemplateSignName = sceneTemplateField('todo_due', 'sign_name')
const todoTemplateCode = sceneTemplateField('todo_due', 'template_code')

const isProviderRouted = (provider: string) => formData.routes.login_otp.provider === provider || (todoDueEnabled.value && todoDueRoute.provider === provider)
const requiredWhenEnabled = computed(() => formData.enabled && formData.providers.aliyun.enabled && isProviderRouted('aliyun'))
const formRules = computed(() => ({
    'providers.aliyun.access_key_id': [{ required: requiredWhenEnabled.value, message: t('system.sms.form.accessKeyIdRequired'), trigger: 'blur' }],
    'providers.aliyun.access_key_secret': [{ required: requiredWhenEnabled.value, message: t('system.sms.form.accessKeySecretRequired'), trigger: 'blur' }],
    'providers.aliyun.endpoint': [{ required: requiredWhenEnabled.value, message: t('system.sms.form.endpointRequired'), trigger: 'blur' }],
    'routes.login_otp.provider': [{ required: formData.enabled, message: t('system.sms.form.routeProviderRequired'), trigger: 'blur' }],
    'routes.login_otp.template': [{ required: formData.enabled, message: t('system.sms.form.routeTemplateRequired'), trigger: 'blur' }],
}))

const applyConfig = (config: Partial<SmsConfig>) => {
    const defaults = createDefaultConfig()
    const providers = { ...defaults.providers } as SmsConfig['providers']
    for (const [provider, providerConfig] of Object.entries(config.providers || {})) {
        providers[provider] = { ...providers[provider], ...providerConfig } as SmsProviderConfig
    }
    providers.aliyun = {
        ...defaults.providers.aliyun,
        ...(config.providers?.aliyun || {}),
        endpoint: ALIYUN_SMS_ENDPOINT,
    } as SmsAliyunProviderConfig
    const merged: SmsConfig = {
        enabled: config.enabled ?? defaults.enabled,
        providers,
        templates: mergeTemplates(defaults.templates, config.templates),
        routes: {
            ...config.routes,
            login_otp: { ...defaults.routes.login_otp, ...(config.routes?.login_otp || {}) },
        },
        otp: { ...defaults.otp, ...(config.otp || {}) },
    }
    Object.assign(formData, merged)
    todoDueEnabled.value = Boolean(config.routes?.todo_due)
    Object.assign(todoDueRoute, config.routes?.todo_due || { provider: 'aliyun', template: 'todo_due' })
    ensureSceneTemplate('login_otp')
    ensureSceneTemplate('todo_due')
}

const buildPayload = (): SmsConfigPayload => {
    const routes: Record<string, SmsRouteConfig> = {
        ...formData.routes,
        login_otp: {
            provider: formData.routes.login_otp.provider.trim(),
            template: formData.routes.login_otp.template.trim(),
        },
    }
    if (todoDueEnabled.value) {
        routes.todo_due = { provider: todoDueRoute.provider.trim(), template: todoDueRoute.template.trim() }
    } else {
        delete routes.todo_due
    }
    const templates = cloneTemplates(formData.templates)
    const normalizeSceneTemplate = (scene: SmsScene, route: SmsRouteConfig) => {
        const source = formData.templates[route.provider]?.[route.template] || ensureSceneTemplate(scene)
        templates[route.provider] ||= {}
        templates[route.provider][route.template] = {
            ...source,
            sign_name: source.sign_name.trim(),
            template_code: source.template_code.trim(),
            variables: [...sceneVariables[scene]],
        }
    }
    normalizeSceneTemplate('login_otp', routes.login_otp)
    if (routes.todo_due) normalizeSceneTemplate('todo_due', routes.todo_due)
    return {
        enabled: formData.enabled,
        providers: {
            ...formData.providers,
            aliyun: {
                enabled: formData.providers.aliyun.enabled,
                access_key_id: formData.providers.aliyun.access_key_id.trim(),
                access_key_secret: formData.providers.aliyun.access_key_secret.trim(),
                endpoint: ALIYUN_SMS_ENDPOINT,
            },
        },
        templates,
        routes: routes as SmsConfigPayload['routes'],
        otp: {
            ttl_seconds: Number(formData.otp.ttl_seconds),
            resend_interval_seconds: Number(formData.otp.resend_interval_seconds),
            max_attempts: Number(formData.otp.max_attempts),
            ip_limit_per_10_minutes: Number(formData.otp.ip_limit_per_10_minutes),
            phone_daily_limit: Number(formData.otp.phone_daily_limit),
            global_daily_limit: Number(formData.otp.global_daily_limit),
        },
    }
}

const hasUnsavedChanges = computed(() => savedConfigSignature.value !== '' && JSON.stringify(buildPayload()) !== savedConfigSignature.value)

const loadConfig = async () => {
    loading.value = true
    configLoaded.value = false
    loadError.value = false
    try {
        applyConfig(await fetchSmsConfig())
        savedConfigSignature.value = JSON.stringify(buildPayload())
        configLoaded.value = true
    } catch (error) {
        loadError.value = true
        Logger.error('获取短信配置失败:', error)
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    if (!configLoaded.value || loading.value || saving.value || testing.value) return
    if (saving.value || !(await validateFormSafely(formRef.value, 'system-sms-form'))) return
    saving.value = true
    try {
        await updateSmsConfig(buildPayload())
        ElMessage.success(t('common.result.updateSuccess'))
        await loadConfig()
    } catch (error) {
        Logger.error('保存短信配置失败:', error)
    } finally {
        saving.value = false
    }
}

const handleTest = async () => {
    if (!configLoaded.value || loading.value || saving.value || testing.value) return
    if (testing.value || !(await validateFormSafely(formRef.value, 'system-sms-test-form'))) return
    testing.value = true
    try {
        const { value } = await ElMessageBox.prompt(t('system.sms.testPrompt'), t('system.sms.testTitle'), {
            confirmButtonText: t('system.sms.testConfirm'),
            cancelButtonText: t('common.actions.cancel'),
            inputValue: '+86 ',
            inputPlaceholder: t('system.sms.testPhonePlaceholder'),
            inputPattern: /^(?:\+?86\s*)?1[3-9]\d{9}$/,
            inputErrorMessage: t('system.sms.testPhoneInvalid'),
        })
        const matched = String(value || '')
            .trim()
            .match(/^(?:\+?(86)\s*)?(1[3-9]\d{9})$/)
        if (!matched) return
        const result = await testSmsConnection({ country_code: matched[1] || '86', phone_number: matched[2], config: buildPayload() })
        ElMessage.success(result.message || t('system.sms.testSuccess'))
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('测试短信配置失败:', error)
    } finally {
        testing.value = false
    }
}

onMounted(loadConfig)
</script>

<style scoped lang="scss">
.sms-panel {
    padding: 20px;
    border-radius: 12px;
    background-color: var(--xl-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.panel-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .panel-title-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .panel-title-bar {
        width: 4px;
        height: 18px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
        flex-shrink: 0;
    }

    .panel-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--el-text-color-primary);
    }

    .panel-description {
        margin: 8px 0 0 14px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
    }
}

.panel-actions-bottom {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
}

.sms-form {
    max-width: 980px;
}

.sms-scene {
    padding: var(--xl-space-4);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--xl-radius-sm);

    & + & {
        margin-top: var(--xl-space-4);
    }
}

.sms-scene__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--xl-space-4);
    margin-bottom: var(--xl-space-3);

    h4,
    p {
        margin: 0;
    }

    p {
        margin-top: var(--xl-space-1);
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
    }
}

.sms-tags {
    display: flex;
    gap: var(--xl-space-2);
}

.sms-unsaved-alert {
    margin-bottom: var(--xl-space-4);
}

.sms-field-stack {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: var(--xl-space-1);
}

.sms-field-tip {
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
    line-height: 1.4;
}
</style>
