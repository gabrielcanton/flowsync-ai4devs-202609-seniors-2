# Verificación — capability `tasks`

Requisito: **Lo que cada tarea muestra de su responsable** (`openspec/specs/tasks/spec.md`).

| Scenario | Test que lo cubre | Estado | Qué me faltó |
|---|---|---|---|
| Responsable identificable: el `assignee` trae el nombre ("Ada Lovelace") y sus iniciales. | — | No cubierto | |
| La tarea no filtra datos de cuenta: el `assignee` de cualquier tarea (suelta o en la lista) no incluye el email ni otros datos de acceso. | — | No cubierto | |
| Responsable sin nombre: con una cuenta sin nombre, el nombre llega nulo y las iniciales siguen llegando. | — | No cubierto | |

Nota: no existe ningún test de `tasks` (solo `backend/tests/functional/auth/`). `initials.spec.ts` comprueba las iniciales en `POST /auth/login`, no en el `assignee` de una tarea, así que no cuenta.

Hallazgo al buscar: `TaskTransformer` (lista, creación y cambio de estado) serializa el `assignee` con `UserTransformer`, que incluye `email`. Solo `TaskDetailTransformer` usa `TaskAssigneeTransformer`. El segundo scenario hoy se incumple, no solo está sin test.
