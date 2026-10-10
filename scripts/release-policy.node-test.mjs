import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRelease, parseVersion, compareVersions, createBuildInfo, git } from './release-policy.mjs'

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-policy-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    for (const args of [
        ['init', '-q'],
        ['config', 'user.email', 'release-test@example.invalid'],
        ['config', 'user.name', 'Release Test'],
    ])
        git(root, ...args)
    function write(version, previousTag = null, changeType = 'initial') {
        fs.mkdirSync(path.join(root, 'docs/upgrades'), { recursive: true })
        fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x-l-admin-vue3', version }))
        fs.writeFileSync(path.join(root, 'docs/release.json'), JSON.stringify({ previousTag, changeType, upgradeGuide: `docs/upgrades/${version}.md`, compatibleBackend: { min: '0.10.0', maxExclusive: '0.11.0' } }))
        fs.writeFileSync(path.join(root, 'CHANGELOG.md'), `## [${version}]\n`)
        fs.writeFileSync(path.join(root, `docs/upgrades/${version}.md`), ['API 变更', '升级顺序', '回滚限制', '验证'].map((heading) => `## ${heading}\n\nReviewed.\n`).join('\n'))
    }
    write('0.10.0')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'initial')
    git(root, 'tag', 'v0.10.0')
    return { root, write }
}

test('release requires matching clean tag; development identity reports modifications', (t) => {
    const { root } = fixture(t)
    assert.equal(validateRelease(root, 'v0.10.0').version, '0.10.0')
    assert.equal(createBuildInfo(root, '0.10.0').channel, 'tagged')
    assert.throws(() => validateRelease(root, 'v0.10.1'), /Tag/)
    fs.writeFileSync(path.join(root, 'untracked.txt'), 'dirty')
    assert.throws(() => validateRelease(root, 'v0.10.0'), /clean/)
    assert.equal(createBuildInfo(root, '0.10.0').dirty, true)
})

test('breaking versions, previous baseline, patch and feature rules', (t) => {
    const { root, write } = fixture(t)
    write('0.10.1', 'v0.10.0', 'patch')
    assert.doesNotThrow(() => validateRelease(root))
    write('0.10.1', 'v0.10.0', 'breaking')
    assert.throws(() => validateRelease(root), /Breaking/)
    write('0.10.1', 'v0.10.0', 'feature')
    assert.throws(() => validateRelease(root), /Feature/)
    write('0.11.0', 'v0.10.0', 'breaking')
    assert.doesNotThrow(() => validateRelease(root))
    write('0.11.0', null, 'initial')
    assert.throws(() => validateRelease(root), /previousTag/)
    write('1.0.0', 'v0.10.0', 'breaking')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'stable')
    git(root, 'tag', 'v1.0.0')
    write('1.1.0', 'v1.0.0', 'breaking')
    assert.throws(() => validateRelease(root), /Breaking/)
    write('2.0.0', 'v1.0.0', 'breaking')
    assert.doesNotThrow(() => validateRelease(root))
})

test('missing instructions and empty compatibility ranges are rejected', (t) => {
    const { root } = fixture(t)
    const policyPath = path.join(root, 'docs/release.json'),
        policy = JSON.parse(fs.readFileSync(policyPath))
    policy.compatibleBackend.maxExclusive = '0.10.0'
    fs.writeFileSync(policyPath, JSON.stringify(policy))
    assert.throws(() => validateRelease(root), /Empty/)
    policy.compatibleBackend.maxExclusive = '0.11.0'
    fs.writeFileSync(policyPath, JSON.stringify(policy))
    fs.writeFileSync(path.join(root, policy.upgradeGuide), '## API 变更\n')
    assert.throws(() => validateRelease(root), /section/)
})

test('SemVer prerelease ordering and invalid identifiers', () => {
    const versions = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0']
    versions.slice(1).forEach((value, index) => assert.equal(compareVersions(versions[index], value), -1))
    for (const invalid of ['01.0.0', '1.0.0-01', '1.0.0-rc..1', 'v1.0.0', '1.0.0+build']) assert.throws(() => parseVersion(invalid))
})

test('a release cannot skip a newer tag on the same history', (t) => {
    const { root, write } = fixture(t)
    write('0.10.1', 'v0.10.0', 'patch')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'patch')
    git(root, 'tag', 'v0.10.1')
    write('0.10.2', 'v0.10.0', 'patch')
    assert.throws(() => validateRelease(root), /latest version tag/)
    write('0.10.2', 'v0.10.1', 'patch')
    assert.doesNotThrow(() => validateRelease(root))
})
