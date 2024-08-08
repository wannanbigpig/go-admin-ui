import { defineStore } from 'pinia'
import { randomStr } from '@/utils/helper'
import { ref } from 'vue'

export const useRefreshStore = defineStore('refresh', () => {
  const key = ref('')
  function setKey() {
    key.value = randomStr(8)
  }

  return { key, setKey }
})
