# Reglas de proceso

## Expectativas
| Regla | Expectativa | 
| ----- | ----------- |
| La rama es por unidad de trabajo, no por petición. Antes de tocar código, mira en qué rama estás: si ya es una rama de trabajo —cualquiera que no sea `main` ni una `sN/*`—, sigue en ella en vez de crear otra. Solo desde `main` o desde una `sN/*` se crea una nueva (`git checkout -b feat/<slug>`). Nunca commitear directo en `main` ni en una `sN/*`. | No |
| El commit sí es por petición: al cerrar cada una, usar la skill `/commit`. | Sí |
| Un cambio que toque rutas, controladores, validadores o transformers de una capability se cierra en el mismo commit con el documento OpenAPI y el README de esa capability al día. El documento se construye en cada petición y no hay fichero que generar, así que lo que se commitea es el diff regenerado de `.adonisjs/`; el README es `docs/capabilities/<nombre>/README.md`. | No |
| `gh pr create` (con una descripción completa de los cambios en el cuerpo del PR) y el pase del subagente `adversarial-reviewer` sobre ese PR van **una sola vez, al terminar la unidad de trabajo**, no al cerrar cada petición. El review adversarial es lo último, antes de dar la unidad por terminada. | No |
| Cuando abras el PR, no repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo con la URL del PR. | No |

## Realidad

Alcance: los 15 últimos commits de `s5/start` (`eff1686`..`b955a72`). Todos son de los mantenedores del curso (Earvin Saúl Pérez Ramos, LIDR Academy, LIDR-AI4Devs); ninguno es del alumno.

| Regla | Qué pide | Qué se revisó | Veredicto | Evidencia | Qué hacer con la regla |
| --- | --- | --- | --- | --- | --- |
| Rama por unidad de trabajo | Trabajar en una rama de trabajo y no commitear nunca directo en `main` ni en una `sN/*`. | `git log -15 --format=...`; `git branch -a --contains <hash>` sobre los 15 commits. | No se cumple | Los 15 commits están en `s5/start`, `upstream/s5/start` y `upstream/s4/end`; `eff1686`, `21ce54d` y `afc4b74` son los tres últimos de `s5/start`, y `b955a72` también está en `s4/start`. Ninguno está en una rama de trabajo. | Dejarla |
| Commit por petición con `/commit` | Cerrar cada petición con un commit hecho con la skill `/commit`. | `git log -15` (mensajes y trailers `Co-Authored-By`); `.claude/skills/commit/SKILL.md`. | No se puede comprobar con la información disponible | La skill no deja marca en el commit (solo pide un mensaje `tipo(scope): descripción`), y los transcripts de sesión que hay en `~/.claude` son del alumno, no de los autores de estos commits. | Dejarla |
| Contrato de la capability en el mismo commit | Un cambio en rutas, controladores, validadores o transformers incluye el diff regenerado de `.adonisjs/` y el README de la capability. | `git log -15 --name-only`; `git show 4e03d1f`; `git show 160fbc7` (fecha de la regla). | No se cumple | `4e03d1f` toca `task_transformer.ts` sin README ni `.adonisjs/`; `cbe9617` toca tres controladores con README pero sin diff de `.adonisjs/`. (Ambos commits son de 2026-08-20 y 2026-08-27; `4e03d1f` es anterior a que `160fbc7` añadiera la regla.) | Convertirla en aprobación automática |
| PR y `adversarial-reviewer` una sola vez, al final | `gh pr create` con descripción completa y un único pase del revisor sobre ese PR, al terminar la unidad de trabajo. | `gh pr list --state all` (por autor y por rama `s5/start`/`s4/start`/`feat/openapi-docs`); `gh pr list --author gabrielcanton --json comments,reviews`. | No se puede comprobar con la información disponible | No hay ningún PR asociado a estos 15 commits, y el pase del subagente no deja rastro en git ni en GitHub (los reviews de los PR del alumno son de CodeRabbit y del revisor del curso). Falta el PR y la traza del subagente. | Dejarla |
| No repetir el resumen del PR en el chat | Al abrir el PR, responder solo con su URL. | Búsqueda de PR (`gh pr list`) y de rastro en el repo. | No se puede comprobar con la información disponible | La respuesta en el chat no se guarda en el repo ni en GitHub; faltan los transcripts de las sesiones que produjeron estos commits. | Borrarla |

## Las 3 líneas

- Acerté en las reglas verificables. El mayor error podría ser con los commits por tarea, pero es incomprobable.
- Creación de PRs y revisión: la reformularía para exigir que el resultado de la revisión se incluyera en la descripción del PR, esta sería la evidencia verificable.
- No repetir el resumen del PR en el chat: no aporta mucho valor.