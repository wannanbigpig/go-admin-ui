<template>
  <div class="xl-right-content">
    <el-dropdown size="large" type="default" trigger="hover" @command="handleCommand" class="xl-user-dropdown">
      <div class="xl-user-info pointer">
        <div class="user-name">
          <el-text truncated="true" size="default">{{ authStore.userInfo.nickname }}</el-text>
          <br />
          <el-text type="info" size="small" truncated="true">{{ authStore.userInfo.username }}</el-text>
        </div>
        <div class="user-avatar">
          <el-avatar :size="40" :src="authStore.userInfo.avatar" shape="circle"> <i-ep-avatar width="30" height="30" /> </el-avatar>
        </div>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="user-detail">
            <el-icon class="el-icon--right">
              <i-ep-postcard />
            </el-icon>
            个人资料
          </el-dropdown-item>
          <el-dropdown-item divided command="logout">
            <el-icon class="el-icon--right">
              <i-ant-design-logout-outlined />
            </el-icon>
            退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // 确保在组件挂载时获取用户信息
  if (Object.keys(authStore.userInfo).length === 0) {
    authStore.refreshUserInfo()
  }
})
const handleCommand = (command) => {
  switch (command) {
    case 'logout':
      ElMessageBox.confirm('确定退出系统当前登录账号吗?', '温馨提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        autofocus: false,
        type: 'warning',
      })
        .then(() => {
          ElMessage({ type: 'success', message: '退出成功' })
          authStore.logout(router.currentRoute.value.fullPath)
        })
        .catch(() => {
          ElMessage({ type: 'info', message: '已取消操作' })
        })
      break
    default:
      ElMessage(`click on item ${command}`)
  }
}
</script>

<style lang="scss" scoped>
.xl-right-content {
  display: flex;
  align-items: center;
  height: 100%;
  .xl-user-dropdown {
    height: 100%;
    // border-left: solid 1px #e6e6e6;
    padding-left: 20px;

    .xl-user-info {
      display: flex;
      align-items: center;
      .user-name {
        max-width: 100px;
        margin-right: 10px;
      }
      .user-avatar {
        width: 40px;
        height: 40px;
      }
    }
  }
}
</style>
