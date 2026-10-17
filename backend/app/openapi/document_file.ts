import app from '@adonisjs/core/services/app'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'

/**
 * Ruta del documento versionado, en `docs/` en la raíz del repo (un nivel por
 * encima de `backend/`). Generar y comprobar leen la ruta de aquí.
 */
const VERSIONED_DOCUMENT = app.makePath('..', 'docs', 'api', 'openapi.json')
const VERSIONED_LABEL = relative(join(app.appRoot.pathname, '..'), VERSIONED_DOCUMENT)

/**
 * Construye el mismo documento que sirve `GET /api.json` y lo serializa con
 * sangría y salto de línea final, para que el diff en git sea legible.
 */
async function renderDocument(): Promise<string> {
  const openapi = await app.container.make('openapi')
  const document = await openapi.buildDocument()
  return JSON.stringify(document, null, 2) + '\n'
}

async function writeDocument(file: string, content: string) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}

/**
 * Escribe el documento en `docs/api/openapi.json`. Devuelve el código de salida.
 */
export async function generate(): Promise<number> {
  await writeDocument(VERSIONED_DOCUMENT, await renderDocument())
  console.log(`Documento escrito en ${VERSIONED_LABEL}`)
  return 0
}

/**
 * Regenera el documento en un directorio temporal y lo compara con el
 * versionado. Solo lee el versionado: nunca lo escribe. Devuelve el código de
 * salida (0 si coinciden, 1 si no).
 */
export async function check(): Promise<number> {
  let committed: string
  try {
    committed = await readFile(VERSIONED_DOCUMENT, 'utf8')
  } catch {
    console.error(`No existe ${VERSIONED_LABEL}. Ejecuta \`npm run openapi:generate\`.`)
    return 1
  }

  const dir = await mkdtemp(join(tmpdir(), 'openapi-check-'))
  try {
    const fresh = join(dir, 'openapi.json')
    await writeDocument(fresh, await renderDocument())

    if ((await readFile(fresh, 'utf8')) === committed) {
      console.log(`${VERSIONED_LABEL} está al día`)
      return 0
    }

    console.error(
      `${VERSIONED_LABEL} no coincide con el documento que generan hoy las rutas y los decoradores:\n`
    )
    const diff = spawnSync(
      'diff',
      ['-u', '--label', VERSIONED_LABEL, '--label', 'regenerado', VERSIONED_DOCUMENT, fresh],
      { encoding: 'utf8' }
    )
    if (diff.stdout) console.error(diff.stdout)
    console.error(
      'Si el cambio es intencionado, ejecuta `npm run openapi:generate` y commitea el resultado.'
    )
    return 1
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
