<template>
    <div class="not-found">
        <i-custom-not_found class="svg-icon" />
        <div class="not-found-desc">未找到页面组件...</div>
    </div>
</template>

<style lang="scss" scoped>
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: center; /* 新增：垂直居中 */
    // min-height: 80vh; /* 新增：确保容器有一定高度 */
    padding: 2rem; /* 新增：增加内边距 */
    text-align: center;

    .svg-icon {
        width: min(400px, 80%); /* 优化：使用min函数更简洁 */
        height: auto; /* 优化：保持宽高比 */
        margin: 2rem 0; /* 优化：使用rem单位 */
        opacity: 0.8; /* 新增：轻微透明效果 */
        transition: transform 0.3s ease; /* 新增：悬停动画 */

        &:hover {
            transform: scale(1.05); /* 新增：悬停放大效果 */
        }
    }

    .not-found-desc {
        font-size: clamp(1.125rem, 4vw, 1.375rem); /* 优化：响应式字体大小 */
        color: var(--el-text-color-primary); /* 主题变量，避免深浅主题下对比失衡 */
        line-height: 1.6;
        margin-top: 1rem;
        font-weight: 500; /* 新增：中等字重 */
        max-width: 80%; /* 新增：限制文本宽度 */
    }
}
</style>
