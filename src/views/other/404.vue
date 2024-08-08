<template>
  <div class="not-found">
    <i-custom-404 class="svg-404-icon" />
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100%; /* 使容器占满整个视口高度 */
  .svg-404-icon {
    max-width: 460px;
    max-height: 460px;
    width: 50%;
    height: 80%;
  }
}
</style>
