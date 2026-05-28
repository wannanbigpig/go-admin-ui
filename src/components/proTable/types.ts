import type { TableColumn } from '@/types/common'

/**
 * 搜索字段控件类型。
 */
export type ProTableSearchType = 'input' | 'select' | 'daterange'

/**
 * 单项搜索字段 schema。
 *
 * - input：普通文本输入
 * - select：下拉选择
 * - daterange：日期范围
 */
export interface ProTableSearchOption {
    label: string
    value: string | number | boolean | null
}

export interface ProTableSearchField {
    /** 字段名，对应 query 的 key */
    prop: string
    /** 表单 label，默认从 column.label 推导 */
    label?: string
    /** 控件类型，默认 input */
    type?: ProTableSearchType
    /** 占位符 */
    placeholder?: string
    /** select 的可选项 */
    options?: ProTableSearchOption[]
    /** el-col span，默认 6 */
    span?: number
    /** 自定义渲染（高级用法，留扩展位） */
    customRender?: boolean
}

export type ProTableSearchSchema = ProTableSearchField[]

/**
 * 单元格内置渲染类型。
 *
 * - tag：渲染 el-tag，依赖列 tag map
 * - avatar：渲染 el-avatar
 * - eye：渲染 eye 切换显隐
 * - custom：交给 default slot 自行处理（保留向后兼容）
 */
export type ProTableCellType = 'tag' | 'avatar' | 'eye' | 'custom'

/**
 * ProTable 列定义。继承自 TableColumn，附加内置渲染类型与列内嵌搜索配置。
 */
export interface ProTableColumn<T = unknown> extends TableColumn<T> {
    type?: ProTableCellType
    label?: string
    search?: Omit<ProTableSearchField, 'prop' | 'label'> & { label?: string }
}

export type ProTableColumns<T = unknown> = ProTableColumn<T>[]
