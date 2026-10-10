import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\dA-Za-z.-]+))?$/

/** @param {string} value */
export function parseVersion(value) {
    const match = typeof value === 'string' && value.match(versionPattern)
    if (!match) throw new Error(`Invalid release version: ${value}`)
    const pre = match[4] ? match[4].split('.') : []
    if (pre.some((part) => !part || /^0\d+$/.test(part))) throw new Error('Invalid prerelease identifier')
    return { core: match.slice(1, 4).map(BigInt), pre }
}

/** @param {string} a @param {string} b */
export function compareVersions(a, b) {
    const av = parseVersion(a),
        bv = parseVersion(b)
    for (let i = 0; i < 3; i++) {
        if (av.core[i] !== bv.core[i]) return av.core[i] < bv.core[i] ? -1 : 1
    }
    if (!av.pre.length || !bv.pre.length) return av.pre.length === bv.pre.length ? 0 : av.pre.length ? -1 : 1
    for (let i = 0; i < Math.min(av.pre.length, bv.pre.length); i++) {
        const left = av.pre[i],
            right = bv.pre[i]
        if (left === right) continue
        const ln = /^\d+$/.test(left),
            rn = /^\d+$/.test(right)
        if (ln && rn) return BigInt(left) < BigInt(right) ? -1 : 1
        if (ln !== rn) return ln ? -1 : 1
        return left < right ? -1 : 1
    }
    return av.pre.length === bv.pre.length ? 0 : av.pre.length < bv.pre.length ? -1 : 1
}

/** @param {string} root @param {...string} args */
export function git(root, ...args) {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

/** @param {string} root @param {string} [tag] */
export function validateRelease(root, tag = '') {
    if (git(root, 'rev-parse', '--is-shallow-repository') === 'true') throw new Error('Full Git history and tags are required')
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    const policy = JSON.parse(fs.readFileSync(path.join(root, 'docs/release.json'), 'utf8'))
    const lockPath = path.join(root, 'package-lock.json')
    if (fs.existsSync(lockPath)) {
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
        if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) throw new Error('Lockfile root version differs from package version')
    }
    const current = parseVersion(pkg.version)
    const allowed = ['previousTag', 'changeType', 'upgradeGuide', 'compatibleBackend']
    if (Object.keys(policy).some((key) => !allowed.includes(key))) throw new Error('Unknown release policy field')
    if (!Object.hasOwn(policy, 'previousTag')) throw new Error('previousTag is required (null only for first release)')
    if (!['initial', 'patch', 'feature', 'breaking'].includes(policy.changeType)) throw new Error('Invalid changeType')
    if (pkg.name === 'x-l-admin-vue3' && !policy.compatibleBackend) throw new Error('compatibleBackend is required')
    if (policy.compatibleBackend && compareVersions(policy.compatibleBackend.min, policy.compatibleBackend.maxExclusive) >= 0) throw new Error('Empty compatibleBackend range')
    if (policy.upgradeGuide !== `docs/upgrades/${pkg.version}.md`) throw new Error('upgradeGuide must match the release version')
    const guide = fs.readFileSync(path.join(root, policy.upgradeGuide), 'utf8')
    for (const heading of ['API 变更', '升级顺序', '回滚限制', '验证']) {
        const marker = `## ${heading}\n`
        const body = guide.split(marker)[1]?.split('\n## ')[0]?.trim()
        if (!body) throw new Error(`Upgrade guide requires section: ${heading}`)
    }
    const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8')
    if (!changelog.includes(`## [${pkg.version}]`)) throw new Error('CHANGELOG version is missing')
    const tags = git(root, 'tag', '--list').split('\n').filter(Boolean)
    if (policy.previousTag === null) {
        if (policy.changeType !== 'initial') throw new Error('First release must use initial')
        for (const existing of tags) {
            if (existing === `v${pkg.version}` || !existing.startsWith('v')) continue
            try {
                parseVersion(existing.slice(1))
            } catch {
                continue
            }
            throw new Error('previousTag cannot be null after release tags exist')
        }
    } else {
        if (typeof policy.previousTag !== 'string' || !policy.previousTag.startsWith('v')) throw new Error('previousTag must be a v-prefixed tag')
        const previous = policy.previousTag.slice(1),
            old = parseVersion(previous)
        if (policy.changeType === 'initial' || compareVersions(pkg.version, previous) <= 0) throw new Error('Version must advance beyond previousTag')
        git(root, 'merge-base', '--is-ancestor', policy.previousTag, 'HEAD')
        for (const existing of tags) {
            if (existing === `v${pkg.version}` || !existing.startsWith('v')) continue
            try {
                parseVersion(existing.slice(1))
            } catch {
                continue
            }
            if (compareVersions(existing.slice(1), previous) <= 0) continue
            let ancestor = false
            try {
                git(root, 'merge-base', '--is-ancestor', existing, 'HEAD')
                ancestor = true
            } catch {
                /* Tag on another branch. */
            }
            if (ancestor) throw new Error(`previousTag must be the latest version tag on this history: ${existing}`)
        }
        const oldPackage = JSON.parse(git(root, 'show', `${policy.previousTag}:package.json`))
        if (oldPackage.version !== previous) throw new Error('Previous tag does not match its package version')
        if (policy.changeType === 'breaking' && current.core[0] === old.core[0] && (old.core[0] !== 0n || current.core[1] === old.core[1])) throw new Error('Breaking change requires major advance, or minor while 0.x')
        if (policy.changeType === 'feature' && current.core[0] === old.core[0] && current.core[1] === old.core[1]) throw new Error('Feature requires minor advance')
        if (policy.changeType === 'patch' && (current.core[0] !== old.core[0] || current.core[1] !== old.core[1])) throw new Error('Patch must stay in the same major/minor')
    }
    if (tag) {
        if (tag !== `v${pkg.version}`) throw new Error('Tag differs from package version')
        if (git(root, 'status', '--porcelain')) throw new Error('Release requires a clean checkout')
        if (!git(root, 'tag', '--points-at', 'HEAD').split('\n').includes(tag)) throw new Error('Checkout must be at the release tag')
    }
    return { version: pkg.version, policy }
}

/** @param {string} root @param {string} version */
export function createBuildInfo(root, version) {
    const commit = git(root, 'rev-parse', 'HEAD')
    const dirty = Boolean(git(root, 'status', '--porcelain'))
    const tagged = git(root, 'tag', '--points-at', 'HEAD').split('\n').includes(`v${version}`)
    return { version, commit, dirty, builtAt: new Date().toISOString(), channel: tagged && !dirty ? 'tagged' : 'development' }
}
