import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import Pagination from './index.vue'

const ElPagination = defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:current-page', 'update:page-size'],
    template: '<div />',
})

describe('pagination model and legacy callbacks', () => {
    it('forwards model updates and public events once without duplicating function props', async () => {
        const sizeListener = vi.fn()
        const pageListener = vi.fn()
        const legacySize = vi.fn()
        const legacyPage = vi.fn()
        const wrapper = mount(Pagination, {
            props: { currentPage: 3, pageSize: 10, pageChange: legacyPage, pageSizeChange: legacySize, onSizeChange: sizeListener, onCurrentChange: pageListener },
            global: { components: { ElPagination } },
        })
        const control = wrapper.getComponent(ElPagination)
        control.vm.$emit('update:page-size', 20)
        control.vm.$emit('update:current-page', 1)
        expect(sizeListener).toHaveBeenCalledExactlyOnceWith(20)
        expect(pageListener).toHaveBeenCalledExactlyOnceWith(1)
        expect(legacySize).not.toHaveBeenCalled()
        expect(legacyPage).not.toHaveBeenCalled()
        expect(wrapper.emitted('update:pageSize')).toEqual([[20]])
        expect(wrapper.emitted('update:currentPage')).toEqual([[1]])
    })

    it('keeps legacy prop names and function callbacks', () => {
        const callback = vi.fn()
        const wrapper = mount(Pagination, { props: { page: 2, page_size: 50, pageChange: callback }, global: { components: { ElPagination } } })
        const control = wrapper.getComponent(ElPagination)
        expect(control.props()).toMatchObject({ currentPage: 2, pageSize: 50 })
        control.vm.$emit('update:current-page', 3)
        expect(callback).toHaveBeenCalledExactlyOnceWith(3)
    })
})
