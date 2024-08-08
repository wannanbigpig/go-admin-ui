<template>
  <div class="login-container">
    <div class="top">
      <div></div>
      <div>
        <el-link class="login-top-text" href="https://github.com/wannanbigpig" target="_blank"><img src="@/assets/images/bigpig.jpg" class="top-logo" /></el-link>
      </div>
    </div>
    <div class="login">
      <div class="left">
        <transition class="animate__animated animate__fadeInLeft">
          <div class="left-dh" v-if="showLeftDh">
            <img src="@/assets/images/logo-frontend.png" alt="" />

            <div class="left-text">X-L-Admin 后台管理系统</div>
          </div>
        </transition>
      </div>
      <div class="right">
        <transition class="animate__animated animate__fadeInRight">
          <div v-if="showRightDh">
            <div class="login-title">用 户 登 录</div>

            <div class="login-form">
              <el-form :model="loginForm" ref="loginFormRef" :rules="loginFormRules">
                <el-form-item prop="username">
                  <el-input v-model.trim="loginForm.username" class="input" placeholder="请输入用户名" @keyup.enter="handleLogin(loginFormRef)">
                    <template #prefix>
                      <i-ep-user></i-ep-user>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item prop="password">
                  <el-input v-model.trim="loginForm.password" class="input" placeholder="请输入密码" type="password" show-password @keyup.enter="handleLogin(loginFormRef)">
                    <template #prefix>
                      <i-ep-lock></i-ep-lock>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item prop="captcha">
                  <el-input v-model.trim="loginForm.captcha" class="input input-captha" placeholder="验证码" maxlength="4" name="username" autocomplete="off" @keyup.enter="handleLogin(loginFormRef)">
                    <template #prefix>
                      <i-ant-design-safety-outlined></i-ant-design-safety-outlined>
                    </template>
                  </el-input>
                  <img :src="captchaSrc" alt="captcha" class="captcha" @click="refreshCaptcha" style="cursor: pointer" />
                </el-form-item>

                <el-form-item>
                  <el-button class="button" type="primary" :disabled="loginLoading" @click="handleLogin(loginFormRef)">{{ !loginLoading ? '登录' : '登录中...' }}</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCaptcha } from '@/api/login'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { ref, reactive } from 'vue'

const showLeftDh = ref(true) // 初始设置为显示
const showRightDh = ref(true) // 初始设置为显示
const loginForm = reactive({
  username: 'super_admin',
  password: '123456',
  captcha: '',
  captchaId: '',
})
const validUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('用户名不能为空'))
  } else if (!/^[a-zA-Z0-9_]{3,16}$/.test(value)) {
    callback(new Error('用户名只能是数字+大小写字母+下划线，长度3-16位'))
  } else {
    callback()
  }
}
const validPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('密码不能为空'))
  } else if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]{6,18}$/.test(value)) {
    callback(new Error('密码只能包含数字、大小写字母和符号，长度6-18位'))
  } else {
    callback()
  }
}

const validCaptcha = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('验证码不能为空'))
  } else if (!/^[a-zA-Z0-9]{4}$/.test(value)) {
    callback(new Error('验证码只能是小写字母和数字，长度4位'))
  } else {
    callback()
  }
}

// 登录表单校验规则
const loginFormRules = {
  username: [{ required: true, trigger: 'change', validator: validUsername }],
  password: [{ required: true, trigger: 'change', validator: validPassword }],
  captcha: [{ required: true, trigger: 'change', validator: validCaptcha }],
}

/**
 * 登录
 */

/**
 * 获取验证码
 */
const captchaSrc = ref('')
const captchaAnswer = ref('')
const loginLoading = ref(false)
const loginFormRef = ref(null)
const authStore = useAuthStore()

/**
 * 登录
 */
async function handleLogin(form) {
  if (!form) {
    return
  }

  loginLoading.value = true

  try {
    // 表单验证逻辑可以提前，确保在尝试登录之前表单是有效的
    const isValid = await new Promise((resolve) => {
      form.validate((valid) => {
        resolve(valid)
      })
    })

    if (!isValid) {
      throw new Error('表单验证未通过')
    }

    await authStore.loginWithCredentials({
      username: loginForm.username,
      password: loginForm.password,
      captcha: loginForm.captcha,
      captcha_id: loginForm.captchaId,
    })

    ElMessage.success('登录成功')
    const query = router.currentRoute.value.query
    // 解析 redirect 参数及额外的查询参数
    const redirectPath = query.redirect || '/'
    router.push(redirectPath)
  } catch {
    // 处理登录失败的情况，如刷新验证码
    refreshCaptcha()
  } finally {
    // 无论成功还是失败，都确保 loading 状态恢复
    loginLoading.value = false
  }
}

function refreshCaptcha() {
  getCaptcha()
    .then((res) => {
      captchaSrc.value = res.data.b64s
      loginForm.captchaId = res.data.id
      captchaAnswer.value = res.data.answer
    })
    .catch(() => {
      ElMessage.error('刷新验证码失败')
    })
}

onBeforeMount(() => {
  refreshCaptcha()
})
</script>

<style scoped lang="scss">
// @import "@/assets/styles/index.scss";
.login-container {
  background-image: url('@/assets/images/login_background.png');
  background-size: 100% 100%;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  width: 100vw;
  align-items: center;
  justify-content: center;
  position: relative;
  .top {
    top: 0;
    left: 0;
    right: 0;
    position: absolute;
    width: calc(100vw - 60px);
    height: 100px;
    background-color: #3aa3ff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30px;
    z-index: 1;
    .top-logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: inline-block;
      overflow: hidden;
      line-height: 1;
      vertical-align: middle;
      margin-right: 10px;
    }
    img {
      @include rotate-forever(5s);
    }
    .login-top-text {
      font-size: 26px !important;
      font-weight: 600 !important;
      color: #ffffff !important;
    }
  }

  .login {
    box-shadow: 0px 10px 20px 0px rgba(35, 35, 35, 0.7);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 480px;
    margin: 120px 0;
    .left {
      width: 480px;
      height: 100%;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      // background-image: url('@/assets/images/logo-frontend.png');
      // background-size: 35% 35%;
      // background-position: 50% 30%;
      .left-dh {
        width: 100%;
        height: 100%;
        img {
          width: 40%;
          height: 40%;
          position: relative;
          top: 15%;
          left: 32%;
        }
        .left-text {
          width: 100%;
          position: relative;
          top: 30%;
          text-align: center;
          font-size: 28px;
          font-weight: 600;
          color: #ffffff;
        }
      }
    }
    .right {
      border-radius: 0 10px 10px 0;
      width: 360px;
      height: 100%;
      background-color: #eaf1ff;
      .login-title {
        width: 100%;
        margin: 50px 0 50px 0;
        font-size: 25px;
        font-weight: 500;
        color: #000000;
        text-align: center;
      }
      .login-form {
        display: flex;
        flex-direction: column; /* 使得表单项和按钮在垂直方向上排列 */
        justify-content: center; /* 水平居中 */
        align-items: center; /* 水平居中，适用于单行内容 */
        width: 300px;
        margin: auto;
        font-size: 25px;
        font-weight: 500;
        color: #191919;
        .input {
          flex: 1; /* 让输入框自适应宽度 */
          height: 48px;
        }
        .button {
          width: 100%;
          height: 48px;
        }
        .captcha {
          width: 120px;
          margin-left: 10px;
          height: 48px;
          border-radius: 3px;
        }
      }
    }
  }
}
</style>
