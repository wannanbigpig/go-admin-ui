import { defineComponent, h, onActivated, onDeactivated, onMounted, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

vi.mock('vue-i18n', async (importOriginal) => ({ ...await importOriginal<typeof import('vue-i18n')>(), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('../components/TaskDefinitionPanel.vue', () => ({ default: { name: 'TaskDefinitionPanel', render: () => null } }))
vi.mock('../components/TaskRunPanel.vue', () => ({ default: { name: 'TaskRunPanel', render: () => null } }))
vi.mock('../components/CronStatePanel.vue', () => ({ default: { name: 'CronStatePanel', render: () => null } }))
import TaskPage from './index.vue'

describe('task tab content and cache', () => {
    it('renders content inside its tab pane and deactivates cached run panels', async () => {
        const mounted = vi.fn()
        const activated = vi.fn()
        const deactivated = vi.fn()
        const RunPanel = defineComponent({
            props: ['active'],
            setup() {
                const count = ref(0)
                onMounted(mounted)
                onActivated(activated)
                onDeactivated(deactivated)
                return () => h('button', { 'data-panel': 'run', onClick: () => count.value++ }, String(count.value))
            },
        })
        const wrapper = mount(TaskPage, { global: { plugins: [ElementPlus], stubs: {
            TaskDefinitionPanel: { template: '<div data-panel="definition" />' },
            TaskRunPanel: RunPanel,
            CronStatePanel: { template: '<div data-panel="cron" />' },
        } } })
        await flushPromises()
        expect(wrapper.get('#pane-definition').find('[data-panel="definition"]').exists()).toBe(true)
        await wrapper.get('#tab-run').trigger('click')
        await flushPromises()
        await wrapper.get('#pane-run [data-panel="run"]').trigger('click')
        expect(wrapper.get('#pane-run [data-panel="run"]').text()).toBe('1')
        await wrapper.get('#tab-cron').trigger('click')
        await flushPromises()
        expect(deactivated).toHaveBeenCalledTimes(1)
        expect(wrapper.find('[data-panel="run"]').exists()).toBe(false)
        expect(wrapper.get('#pane-cron').find('[data-panel="cron"]').exists()).toBe(true)
        await wrapper.get('#tab-run').trigger('click')
        await flushPromises()
        expect(wrapper.get('#pane-run [data-panel="run"]').text()).toBe('1')
        expect(mounted).toHaveBeenCalledTimes(1)
        expect(activated).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })
})
