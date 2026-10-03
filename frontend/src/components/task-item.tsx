import { Button } from '@/components/ui/button'
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from '@/lib/types'

const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'done']

type TaskItemProps = {
  task: Task
  disabled: boolean
  onChangeStatus: (task: Task, status: TaskStatus) => void
}

/** Una fila de la lista: título, responsable por nombre y los tres estados. */
export function TaskItem({ task, disabled, onChangeStatus }: TaskItemProps) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-medium">{task.title}</p>
        <p className="text-muted-foreground text-sm">
          {task.assignee.fullName ?? 'Sin nombre'}
        </p>
      </div>

      <div
        role="group"
        aria-label={`Estado de «${task.title}»`}
        className="flex shrink-0 gap-1"
      >
        {STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="xs"
            variant={task.status === status ? 'default' : 'outline'}
            aria-pressed={task.status === status}
            disabled={disabled}
            onClick={() => onChangeStatus(task, status)}
          >
            {TASK_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>
    </li>
  )
}
