import { init, use, type EChartsType } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

export type DashboardChart = EChartsType

let registered = false

export function initDashboardChart(el: HTMLElement) {
    if (!registered) {
        use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])
        registered = true
    }
    return init(el)
}
