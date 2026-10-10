# 1. OpenSpec como fuente de verdad viva

## Estado

Reemplazada por el [ADR 0002](0002-tests-como-fuente-de-verdad-ejecutable.md). Lo que sigue es el estado original y lo que se creía entonces.

Aceptada (2026-10-10). Registra una práctica que el repositorio ya sigue desde el 2026-08-13.

## Contexto

FlowSync se construye con ayuda de agentes, y la intención de producto (historias, criterios de aceptación, decisiones con producto) vive fuera del código: en el PRD y en el backlog. Hacía falta un sitio dentro del repositorio donde esa intención quedara escrita de forma comprobable y que no se pudiera confundir con el estado del código.

Lo que hay hoy en `openspec/` (esquema `spec-driven`, `openspec/config.yaml`):

- **`openspec/specs/`**: la especificación viva, una carpeta por capability. Hay dos: `auth` (307 líneas) y `tasks` (753). Cada una se compone de *requirements* con *scenarios* en forma WHEN/THEN.
- **`openspec/changes/archive/`**: los tres changes ya cerrados, todos archivados el 2026-08-13: `add-task-list`, `add-task-due-date` y `add-task-status-filter`. Cada uno trae `proposal.md` (el porqué y el alcance), `design.md` (decisiones y riesgos), `tasks.md` (lista de trabajo) y una carpeta `specs/` con las **delta-specs**: solo lo que ese change añade (`## ADDED Requirements`) o reescribe (`## MODIFIED Requirements`) respecto a la spec viva.
- **La relación**: un change propone sus deltas, se implementa y, al archivarse, sus deltas se funden en `openspec/specs/`. Así `add-task-list` creó la capability `tasks` y modificó `auth`; `add-task-due-date` añadió requisitos y reescribió *Una sola vista de tareas…*; `add-task-status-filter` añadió el filtro y reescribió tres requisitos que el propio filtro volvía falsos.

También hay evidencia de que la relación no se ha mantenido sola:

- `add-task-status-filter` nació **después** de implementar el filtro: su propuesta dice que documenta comportamiento ya existente y que corrige requisitos de la spec viva que ese comportamiento había vuelto falsos. La spec fue incorrecta durante un tiempo.
- La propuesta de `add-task-due-date` ya reconocía esa deriva como «ajena a este change» y no la corregía.
- Los tres changes declaran explícitamente que no tienen tests. Las únicas pruebas automáticas del repositorio son las de `auth` (`backend/tests/functional/auth/`) y las de `tasks/assignee.spec.ts`. La verificación de los scenarios de `tasks` ha sido manual, y quedan sin marcar 4 tareas de `add-task-list` y 5 de `add-task-due-date`, todas de comprobación manual.
- La spec viva y el código ya difieren en puntos comprobables: la spec exige `422` para `GET /api/v1/tasks?status=archivado`, pero `listTasksValidator` (`backend/app/validators/task.ts`) declara `status` como `vine.string().optional()` y no lo acota al enum, de modo que hoy responde `200` con lista vacía, aunque la propuesta del filtro afirma que está «acotado al enum». La spec también habla del «nombre» del responsable y la API lo expone como `fullName`.

## Decisión

Las specs de `openspec/specs/` son la fuente de verdad sobre **qué debe hacer el sistema**, y la única forma aceptada de cambiarlas es un change de OpenSpec con delta-specs, que se archiva al terminar.

En concreto:

1. Todo cambio de comportamiento visible (API o interfaz) empieza como un change en `openspec/changes/<nombre>/`, con su propuesta, diseño, tareas y deltas `ADDED`/`MODIFIED`. No se edita `openspec/specs/` a mano.
2. Al archivar, los deltas pasan a la spec viva. El historial (el porqué y las alternativas descartadas) se conserva en `openspec/changes/archive/`.
3. Cuando el código y la spec discrepan, la discrepancia es un defecto que se resuelve por escrito: o se corrige el código, o se abre un change que cambie la spec. Ninguna de las dos se deja por defecto como la correcta.
4. Los límites de cada change se declaran en su propuesta (qué queda fuera y qué no se verifica), en lugar de quedar implícitos.

## Consecuencias

**Lo que ganamos**

- Los requisitos son comprobables uno a uno: cada scenario tiene un WHEN/THEN que se puede citar, contrastar con el código o convertir en test. Ya se usó así para contrastar el documento OpenAPI con la spec de `tasks`.
- El porqué de cada decisión queda junto al cambio que la tomó (`design.md`), no solo en el chat o en la memoria de quien la tomó. Un agente sin contexto previo puede reconstruir el producto leyendo `openspec/`.
- Los deltas hacen revisable un cambio de producto aislado, sin leer las 753 líneas de la spec completa.

**Lo que nos cuesta**

- **Doble escritura y deriva.** La spec viva solo es tan cierta como la última vez que alguien archivó un change. Ya ha pasado: el filtro por estado se implementó antes de especificarse y la spec estuvo equivocada hasta que `add-task-status-filter` la corrigió; y hoy sigue habiendo diferencias entre spec y código (`422` del filtro, `name` frente a `fullName`). Nada lo detecta automáticamente: no hay tests de los scenarios de `tasks`, y la spec, el código y los tipos del frontend se mantienen a mano.
- **Verbosidad.** Un change pequeño arrastra propuesta, diseño, tareas y deltas, y el contenido de los deltas se repite en la spec viva y en el archivo. La spec de `tasks` ya tiene 753 líneas y cada delta obliga a releer los requisitos que modifica, porque un `MODIFIED` reescribe el requisito entero.
- **Coste de proceso.** Un cambio de una línea de comportamiento exige un change. Eso frena los arreglos pequeños y empuja a saltarse el flujo, que es precisamente cómo aparece la deriva.
- **Los scenarios no se ejecutan.** Que algo esté en la spec no significa que esté verificado: hoy las pruebas manuales son lo único que lo respalda y varias están sin marcar. La spec da una falsa sensación de cobertura si no se acompaña de tests.
- **Los agentes dependen de leerla.** La spec solo guía el trabajo si se carga en el contexto; no se aplica por sí sola, y una spec desactualizada engaña con la misma autoridad que una correcta.
- **Duplicación a sabiendas.** Algunas decisiones de la spec obligan a duplicar lógica entre capas (por ejemplo `DEFAULT_LIST_STATUSES` en backend y frontend), y la spec no impide que se separen.

**Qué haremos con ello**

- Tratar cada discrepancia entre spec y código como un defecto y abrir un change que lo cierre en un sentido o en otro.
- Decidir aparte (y registrarlo en un ADR nuevo) si los scenarios de `tasks` pasan a tener tests; mientras tanto, esta decisión no garantiza que la spec describa el sistema real.
