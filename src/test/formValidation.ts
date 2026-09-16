/// <reference types="node" />
import { createRequire } from 'node:module'
import type { FormInstance } from 'element-plus'

// Load Element Plus's installed validator using its CJS entry, avoiding SSR default-export
// interop in jsdom. The rules and model still come from the real page/composable.
const require = createRequire(import.meta.url)
const elementPlusRequire = createRequire(require.resolve('element-plus'))
const Schema = elementPlusRequire('async-validator').default as new (rules: object) => { validate: (model: object) => Promise<unknown> }

export function formValidator(rules: object, model: object): FormInstance {
    return {
        validate: async () => {
            await new Schema(rules).validate(model)
            return true
        },
    } as FormInstance
}
