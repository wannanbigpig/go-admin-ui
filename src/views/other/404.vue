<template>
  <div class="not-found">
    <i-custom-404 class="svg-404-icon" />
    <div class="not-found-desc">抱歉，您访问的页面不存在...</div>
    <router-link to="/" class="home-link">返回首页</router-link>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
  background-color: #f8f9fa;
  color: #333;

  .svg-404-icon {
    width: min(80%, 400px);
    height: auto;
    margin-bottom: 30px;
    opacity: 0.9;
  }

  .not-found-desc {
    font-size: clamp(18px, 4vw, 24px);
    color: #495057;
    line-height: 1.6;
    margin-bottom: 30px;
    font-weight: 500;
  }

  .home-link {
    padding: 12px 24px;
    background-color: #4a6bdf;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-size: 16px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #3a5bd9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
