# Revisor de código en CI

`.github/workflows/claude-review.yml` lanza Claude Code como revisor en cada pull request (al abrirlo, al subir commits, al sacarlo de borrador o reabrirlo) y publica los hallazgos como comentarios en el propio PR. Usa la acción oficial [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action).

## Pasos manuales pendientes

El workflow solo no basta. Falta:

1. **Instalar la app de GitHub de Claude** en el repositorio: <https://github.com/apps/claude>. La acción canjea el token OIDC del job por el de esa app (de ahí el permiso `id-token: write`) y los comentarios salen como `claude[bot]`.
2. **Crear el secreto del repositorio** (Settings → Secrets and variables → Actions) con la credencial. Ver la sección siguiente.
3. **Fusionar el workflow en la rama por defecto (`main`) antes de esperar reviews.** La acción valida que el workflow exista en la rama por defecto; en un PR que lo añade por primera vez falla con `workflow_not_found_on_default_branch`. Es esperable: el primer review real llega en el PR siguiente.
4. **Comprobar un primer PR** de prueba y revisar que los comentarios aparecen en el PR y no solo en el registro de ejecución.

## Credencial: dos caminos, no intercambiables

Cada camino usa **una entrada distinta de la acción** y un **nombre de secreto distinto**. Hay que usar la pareja completa.

|                                             | Entrada de la acción      | Nombre del secreto        |
| ------------------------------------------- | ------------------------- | ------------------------- |
| **1. Suscripción (el que usa el workflow)** | `claude_code_oauth_token` | `CLAUDE_CODE_OAUTH_TOKEN` |
| **2. Clave de API de la consola**           | `anthropic_api_key`       | `ANTHROPIC_API_KEY`       |

**Camino 1, suscripción.** Requiere una suscripción Pro o Max. Se genera en local, con la sesión iniciada, ejecutando `claude setup-token`; el comando imprime un token que se pega como valor del secreto `CLAUDE_CODE_OAUTH_TOKEN`. El consumo cuenta contra los límites de uso de esa suscripción.

**Camino 2, clave de API.** Se crea en la consola de Anthropic y se guarda como `ANTHROPIC_API_KEY`. Hay que cambiar en el workflow `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` por `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`. El consumo se factura por token a esa cuenta.

> **Cruzarlos falla en la primera llamada y sin explicar por qué.** Un token de `setup-token` pasado como `anthropic_api_key` (o una clave de API pasada como `claude_code_oauth_token`) no se rechaza al arrancar: el job empieza y falla en la primera petición con un error de autenticación genérico. Si el job cae ahí, lo primero que hay que mirar es que entrada, secreto y tipo de credencial casen.

## En qué se va el dinero

El gasto es el de las llamadas del revisor al modelo: cada turno lee contexto (el diff, los archivos que abre) y escribe. Lo que lo acota, por orden de importancia:

- **Modelo: `--model sonnet`.** Es un modelo de gama media: razona lo bastante bien para encontrar fallos reales en un diff y cuesta bastante menos que los de gama alta, que aquí no compensan porque el trabajo es leer y comentar, no diseñar. `sonnet` es un alias que apunta a la última versión de Sonnet, así que el coste puede variar cuando salga una nueva.
- **Esfuerzo: `--effort medium`.** Limita cuánto razona antes de cada respuesta.
- **Turnos: `--max-turns 40`.** Tope duro de iteraciones por ejecución.
- **Reloj: `timeout-minutes: 10`.** Tope duro de tiempo; el job se corta aunque aún queden turnos.
- **Herramientas:** `Read`, `Grep` y `Glob` para leer el repo (sin ellas no puede abrir ni un archivo del cambio, y cada intento denegado cuesta un turno), más lo mínimo para comentar y ver el diff. No tiene `Edit`, `Write` ni `Bash` libre.
- **Concurrencia:** un push nuevo cancela el review en curso del mismo PR, así que no se paga por revisar versiones ya obsoletas.

**Cómo cambiarlo.** Todo está en `claude_args` del workflow:

- Otro modelo: sustituir `--model sonnet` por otro alias (`opus`, `haiku`) o por un ID de modelo completo.
- Más o menos razonamiento: cambiar el valor de `--effort`.
- Más margen o menos: ajustar `--max-turns` y `timeout-minutes`.

**Precios.** No se citan cifras aquí porque cambian. Fuentes oficiales: [planes y suscripciones](https://claude.com/pricing) para el camino 1, y [precios de la API](https://platform.claude.com/docs/en/about-claude/pricing) para el camino 2.

## Pull requests desde forks en un repositorio público

El workflow **no revisa PR desde forks**: el job lleva `if: github.event.pull_request.head.repo.full_name == github.repository` y se omite.

El motivo es que, en un evento `pull_request` desde un fork, GitHub no entrega los secretos del repositorio y el `GITHUB_TOKEN` es de solo lectura. El job no podría autenticarse ni comentar. Además, la acción comprueba que quien lo dispara tenga permisos de escritura en el repo.

**No se resuelve cambiando a `pull_request_target`.** Ese evento sí ejecuta con los secretos del repositorio base, y el contenido del PR (código, descripción, comentarios) lo escribe un tercero: es un vector directo de inyección de prompts contra un agente que tiene acceso a la credencial. Si algún día hiciera falta revisar forks, la vía segura es que un mantenedor con permisos de escritura lance el review a mano tras leer el cambio, no abrirlo a cualquiera.
