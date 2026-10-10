# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) de FlowSync: la SPA de React que usa la persona, la API AdonisJS que atiende `/api/v1` y la base de datos SQLite a la que accede mediante Lucid. Dentro de cada contenedor se muestran los bloques que existen hoy en el código. Solo se dibuja lo verificable en el repositorio.

```mermaid
C4Container
    title Diagrama de contenedores - FlowSync

    Person(user, "Usuario", "Gestiona tareas en equipo")

    System_Boundary(flowsync, "FlowSync") {
        Container(spa, "Frontend", "React 19, Vite 8, react-router", "SPA en :5173. Páginas: login, registro, perfil, lista y detalle de tarea. Token en localStorage; toda llamada HTTP pasa por lib/api.ts")
        Container(api, "Backend API", "AdonisJS 7", "API JSON en :3333 bajo /api/v1. Controladores: NewAccount, AccessTokens, Profile, Tasks, TaskStatuses, TaskDueDates. Validadores VineJS y transformers; respuestas envueltas en { data }. Auth con access tokens opacos (middleware auth)")
        ContainerDb(db, "Base de datos", "SQLite (better-sqlite3), tmp/db.sqlite3", "Tablas users, auth_access_tokens y tasks, vía modelos Lucid User y Task (Task.assignee -> User)")
    }

    Rel(user, spa, "Usa", "Navegador")
    Rel(spa, api, "Llama con Authorization: Bearer", "JSON/HTTP, fetch")
    Rel(api, db, "Lee y escribe", "Lucid ORM")
```
