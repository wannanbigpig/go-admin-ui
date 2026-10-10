import { fileURLToPath } from 'node:url'
import { validateRelease } from './release-policy.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
if (args.length && (args[0] !== '--tag' || args.length !== 2 || !args[1])) throw new Error('Usage: node scripts/check-release.mjs [--tag vX.Y.Z]')
const result = validateRelease(root, args[1] || '')
console.log(`Release ${result.version}: policy, tag baseline and upgrade guide checked`)
