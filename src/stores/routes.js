import { defineStore } from 'pinia'
import { getUserMenuList } from '@/api/user'

export const useRouteStore = defineStore('route', () => {
  const routes = ref([])
  async function getRoutes() {
    const response = await getUserMenuList()
    routes.value = response.data
  }

  return { routes, getRoutes }
})
