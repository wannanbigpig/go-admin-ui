import type { WithId, WithTimestamp } from './common'

export interface Role extends WithId, WithTimestamp {
    name: string
    code: string
    sort?: number
    description?: string
    menu_list?: number[]
    permission_ids?: number[]
    status: number
    remark?: string
    is_system?: number
    data_scope: number // 1=全部数据, 2=本部门及子级, 3=本部门, 4=仅本人, 5=自定义部门
    dept_ids?: number[] // 自定义部门时的部门 ID 列表
}
