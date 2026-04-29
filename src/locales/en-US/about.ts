export default {
    metaAria: 'Project meta',
    linksAria: 'Project links',
    meta: {
        appType: 'Vue 3 Admin',
    },
    hero: {
        subtitle: 'Gin Layout Admin Frontend',
        description: 'X-L-Admin is a frontend project for admin management scenarios, covering permissions, system config, system dictionaries, task center, audit logs, and related backend capabilities.',
    },
    links: {
        author: {
            title: 'Author',
            text: 'wannanbigpig',
        },
        frontendRepo: {
            title: 'Frontend Repo',
            text: 'github.com/wannanbigpig/go-admin-ui',
        },
        backendRepo: {
            title: 'Backend Repo',
            text: 'github.com/wannanbigpig/gin-layout',
        },
        sponsor: {
            title: 'Sponsor',
            text: 'Backend donation guide',
        },
        frontendFeedback: {
            title: 'Frontend Feedback',
            text: 'Issues / Pull Requests',
        },
        backendFeedback: {
            title: 'Backend Feedback',
            text: 'Issues / Pull Requests',
        },
    },
    purpose: {
        title: 'Project Purpose',
        items: {
            foundation: {
                prefix: 'Can be used as a frontend/backend foundation for ',
                strong: 'business admin systems, internal management tools, and engineered admin projects',
                suffix: ', with common capabilities such as authentication, RBAC permissions, menu routing, logs, system config, and task center.',
            },
            production: {
                prefix: 'The project supports secondary development and real-environment usage, including production. Before launch, complete ',
                strong: 'security hardening, permission acceptance, secret configuration, audit strategy, data backup, and performance evaluation',
                suffix: ' according to your business scenario.',
            },
            baseline:
                'Default data, demo config, and generic rules only provide a startup baseline. For production deployment, converge and replace them according to your organization, business flow, data governance, and operations standards.',
        },
    },
    risk: {
        title: 'Usage Notes And Risk Notice',
        items: {
            check: {
                prefix: 'Before using it in production, review the ',
                strong: 'permission model, default accounts, configuration secrets, and audit strategy',
                suffix: ' according to your business needs.',
            },
            responsibility: 'Risks caused by permission misconfiguration, credential leakage, service throttling, data mistakes, or secondary-development defects are the responsibility of the user.',
        },
    },
    disclaimer: {
        title: 'Disclaimer',
        prefix: 'This project is provided ',
        strong: '"as is"',
        suffix: ', without any express or implied warranty. It may contain defects, security vulnerabilities, or implementations that do not fit a specific business scenario. Before launch, complete your own code review, security hardening, configuration review, permission acceptance, and data backup. Any issues caused by using, relying on, deploying, modifying, or operating this project are the responsibility of the user.',
    },
}
