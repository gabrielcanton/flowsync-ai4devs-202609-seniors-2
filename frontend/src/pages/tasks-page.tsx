import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircleIcon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import type { Task, TaskStatus } from '@/lib/types'
import { useAuth } from '@/auth/use-auth'
import { useAuthForm } from '@/auth/use-auth-form'
import { FieldError } from '@/components/field-error'
import { FullScreenLoader } from '@/components/full-screen-loader'
import { TaskItem } from '@/components/task-item'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELDS = ['title'] as const

const messageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

export function TasksPage() {
  const { token } = useAuth()
  const { isSubmitting, formError, fieldErrors, submit } = useAuthForm(FIELDS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // Filas con un cambio de estado en vuelo: se bloquean para que dos clics
  // seguidos no se pisen entre sí.
  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<number>>(new Set())
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    api
      .listTasks(token)
      .then((loaded) => {
        if (!cancelled) setTasks(loaded)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(messageOf(error, 'No hemos podido cargar las tareas.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return

    return submit(async () => {
      const created = await api.createTask(token, { title })
      // El orden es el que dicta el servidor (sin criterio propio): la nueva
      // se añade al final, como la devolvería un listado.
      setTasks((current) => [...current, created])
      setTitle('')
    })
  }

  const patchStatus = useCallback((id: number, status: TaskStatus) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status } : task)),
    )
  }, [])

  const handleChangeStatus = async (task: Task, status: TaskStatus) => {
    if (!token || task.status === status) return

    setActionError(null)
    setUpdatingIds((current) => new Set(current).add(task.id))
    // Se refleja de inmediato; si el servidor falla, se devuelve a como estaba.
    patchStatus(task.id, status)

    try {
      await api.updateTaskStatus(token, task.id, status)
    } catch (error) {
      patchStatus(task.id, task.status)
      setActionError(
        messageOf(error, 'No se pudo guardar el cambio de estado.'),
      )
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  if (isLoading) return <FullScreenLoader />

  const shownError = actionError ?? loadError

  return (
    <div className="bg-muted/40 flex min-h-svh justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">FlowSync</h1>
          <Button asChild variant="link">
            <Link to="/profile">Mi perfil</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tareas del equipo</CardTitle>
            <CardDescription>
              Una sola lista para todos: quién lleva qué y en qué estado está.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {(formError ?? shownError) && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{formError ?? shownError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreate} className="grid gap-2" noValidate>
              <Label htmlFor="title">Nueva tarea</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  name="title"
                  placeholder="¿Qué hay que hacer?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={
                    fieldErrors.title ? 'title-error' : undefined
                  }
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Añadiendo…' : 'Añadir'}
                </Button>
              </div>
              <FieldError id="title-error" message={fieldErrors.title} />
            </form>

            {tasks.length === 0 && !loadError ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                <p className="text-foreground mb-1 font-medium">
                  Aún no hay tareas
                </p>
                <p>
                  Aquí ve todo el equipo qué hay que hacer, quién lo lleva y en
                  qué estado está. Escribe un título arriba para crear la
                  primera.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    disabled={updatingIds.has(task.id)}
                    onChangeStatus={handleChangeStatus}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
