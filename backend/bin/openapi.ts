/*
|--------------------------------------------------------------------------
| Generación y comprobación del documento OpenAPI
|--------------------------------------------------------------------------
|
| Se invoca desde los scripts `openapi:generate` y `openapi:check` de
| `package.json`. No es un comando de ace: con Node 24 ace no puede cargar
| comandos propios (valida su metadata con `jsonschema@1.5.0`, que llama a
| `new URL(x, 'thismessage::/')` y Node lo rechaza con «Invalid URL»).
|
| Arranca la app en entorno `console`, como `bin/console.ts`, para que se
| carguen las rutas y los decoradores igual que cuando sirve `/api.json`.
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const mode = process.argv[2]

const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER }).tap((app) => {
  app.booting(async () => {
    await import('#start/env')
  })
})

const app = ignitor.createApp('console')

try {
  await app.init()
  await app.boot()
  await app.start(async () => {
    const { generate, check } = await import('#openapi/document_file')
    if (mode === 'generate') {
      process.exitCode = await generate()
    } else if (mode === 'check') {
      process.exitCode = await check()
    } else {
      console.error('Uso: bin/openapi.ts <generate|check>')
      process.exitCode = 2
    }
  })
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
} finally {
  await app.terminate()
}
