import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingStore = defineStore(
  'setting',
  () => {
    const isHeaderFixed = ref(true)
    const isSideFixed = ref(true)
    const isCollapse = ref(false)

    return { isHeaderFixed, isSideFixed, isCollapse }
  },
  {
    persist: true,
  }
)
