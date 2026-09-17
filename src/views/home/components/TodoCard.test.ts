import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TodoCard from './TodoCard.vue'

const mocks = vi.hoisted(() => ({ list: vi.fn(), summary: vi.fn(), push: vi.fn() }))
vi.mock('@/modules/todo/service', () => ({
    fetchTodoList: mocks.list,
    fetchTodoSummary: mocks.summary,
    isTodoOverdue: (item: { is_overdue?: boolean }) => Boolean(item.is_overdue),
    sortActiveTodos: (items: Array<{ status: string; is_overdue?: boolean }>) => items.filter((item) => item.status === 'pending' || item.status === 'processing').sort((a, b) => Number(Boolean(b.is_overdue)) - Number(Boolean(a.is_overdue))),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

describe('TodoCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.summary.mockResolvedValue({ pending: 6, processing: 2, overdue: 1, due_today: 0 })
        mocks.list.mockImplementation(({ status }: { status: string }) =>
            Promise.resolve({
                list:
                    status === 'pending'
                        ? Array.from({ length: 5 }, (_, index) => ({ id: index + 1, title: `todo-${index + 1}`, priority: 'normal', status: 'pending', is_overdue: index === 4 }))
                        : [{ id: 6, title: 'todo-6', priority: 'normal', status: 'processing' }],
                total: status === 'pending' ? 5 : 1,
            })
        )
    })

    it('shows at most five active todos with overdue first', async () => {
        const wrapper = shallowMount(TodoCard)
        await flushPromises()

        expect(wrapper.findAll('.todo-card__item')).toHaveLength(5)
        expect(wrapper.find('.todo-card__item').text()).toContain('todo-5')
    })

    it('shows a retryable error instead of an empty state when loading fails', async () => {
        mocks.list.mockRejectedValueOnce(new Error('offline'))
        const wrapper = shallowMount(TodoCard)
        await flushPromises()

        expect(wrapper.find('.todo-card__error').exists()).toBe(true)
        expect(wrapper.find('el-empty-stub').exists()).toBe(false)
    })
})
