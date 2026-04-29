export default {
    metaAria: '项目信息',
    linksAria: '项目链接',
    meta: {
        appType: 'Vue 3 管理端',
    },
    hero: {
        subtitle: 'Gin Layout 后台管理前端',
        description: 'X-L-Admin 是一个面向后台管理场景的前端项目，用于承载权限管理、系统参数、系统字典、任务中心和审计日志等后台能力。',
    },
    links: {
        author: {
            title: '主作者',
            text: 'wannanbigpig',
        },
        frontendRepo: {
            title: '前端仓库',
            text: 'github.com/wannanbigpig/go-admin-ui',
        },
        backendRepo: {
            title: '后端仓库',
            text: 'github.com/wannanbigpig/gin-layout',
        },
        sponsor: {
            title: '赞助支持',
            text: '后端赞赏文档',
        },
        frontendFeedback: {
            title: '前端反馈',
            text: 'Issues / Pull Requests',
        },
        backendFeedback: {
            title: '后端反馈',
            text: 'Issues / Pull Requests',
        },
    },
    purpose: {
        title: '项目用途说明',
        items: {
            foundation: {
                prefix: '可作为 ',
                strong: '业务后台、内部管理系统和工程化后台项目',
                suffix: ' 的前后端基础骨架，提供认证、RBAC 权限、菜单路由、日志、系统配置和任务中心等通用能力。',
            },
            production: {
                prefix: '项目支持在生产等真实环境中二次开发和落地使用；上线前应结合业务场景补齐 ',
                strong: '安全加固、权限验收、配置密钥、审计策略、数据备份和性能评估',
                suffix: '。',
            },
            baseline: '默认数据、演示配置和通用规则只提供项目启动基线，生产部署时应按实际组织、业务流程、数据治理和运维规范进行收敛与替换。',
        },
    },
    risk: {
        title: '使用须知与风险提示',
        items: {
            check: {
                prefix: '生产环境使用前，请按业务实际情况检查 ',
                strong: '权限模型、默认账号、配置密钥和审计策略',
                suffix: '。',
            },
            responsibility: '如因权限配置错误、凭证泄露、服务限流、数据误操作或二次开发缺陷导致问题，风险由使用者自行承担。',
        },
    },
    disclaimer: {
        title: '免责声明',
        prefix: '本项目按 ',
        strong: '“现状”提供',
        suffix: '，不附带任何明示或默示担保。项目可能存在缺陷、安全漏洞或与特定业务场景不匹配的实现；上线前请自行完成代码审查、安全加固、配置审查、权限验收和数据备份。因使用、依赖、部署、改造或运维本项目导致的问题，由使用者自行承担。',
    },
}
