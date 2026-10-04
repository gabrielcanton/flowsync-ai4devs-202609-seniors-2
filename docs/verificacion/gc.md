# Verificación — capability `tasks`

Requisito: **Lo que cada tarea muestra de su responsable** (`openspec/specs/tasks/spec.md`).

Escenarios en el requisito: 3 - Cubiertos: 0

| Scenario | Test que lo cubre | Estado | Qué me faltó |
|---|---|---|---|
| Responsable identificable: el `assignee` trae el nombre ("Ada Lovelace") y sus iniciales. | — | No cubierto | |
| La tarea no filtra datos de cuenta: el `assignee` de cualquier tarea (suelta o en la lista) no incluye el email ni otros datos de acceso. | — | No cubierto | |
| Responsable sin nombre: con una cuenta sin nombre, el nombre llega nulo y las iniciales siguen llegando. | — | No cubierto | |

- Escenarios que imaginé cubiertos: 3 - escenarios realmente cubiertos: 0
- Test vs. regla faltantes: el requerimiento es lo que dice, no hay de dónde inferir que pueda faltar una regla. En cambio claramente no están los tests.
- Hice que Claude escribiera los tests, pero no veo ambigüedad. Lo más parecido que se me ocurre es que en el segundo escenario el WHEN no menciona explícitametne que la tarea tiene que tener un responsable asignado, pero está claro por el contexto del requerimiento.