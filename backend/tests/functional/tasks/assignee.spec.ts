import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: responsable identificable, ningún dato de
 * cuenta de más y responsable sin nombre.
 *
 * Se comprueba por las dos vías que devuelven una tarea con su responsable: la
 * tarea suelta (`GET /tasks/:id`) y la lista (`GET /tasks`).
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-08-12'

  async function sesion(client: any, email = 'miron@example.com') {
    await User.create({ fullName: 'Quien Mira', email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(fullName: string | null, email = 'ada@example.com') {
    const responsable = await User.create({ fullName, email, password: 'secreto123' })

    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  test('el assignee trae el nombre y las iniciales de quien lleva la tarea', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    assert.equal(suelta.body().data.assignee.fullName, 'Ada Lovelace')
    assert.equal(suelta.body().data.assignee.initials, 'AL')

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    const enLista = lista.body().data.find((t: any) => t.id === tarea.id)
    assert.equal(enLista.assignee.fullName, 'Ada Lovelace')
    assert.equal(enLista.assignee.initials, 'AL')
  })

  test('el assignee no incluye el email ni ningún otro dato de la cuenta', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada-privada@example.com')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    const enLista = lista.body().data.find((t: any) => t.id === tarea.id)

    for (const assignee of [suelta.body().data.assignee, enLista.assignee]) {
      assert.notProperty(assignee, 'email')
      assert.notProperty(assignee, 'password')
      assert.notProperty(assignee, 'createdAt')
      assert.notProperty(assignee, 'updatedAt')
      assert.sameMembers(Object.keys(assignee), ['id', 'fullName', 'initials'])
    }

    // Ni el email ni nada que lo contenga debe viajar en ningún punto de la respuesta.
    assert.notInclude(JSON.stringify(suelta.body()), 'ada-privada@example.com')
    assert.notInclude(JSON.stringify(lista.body()), 'ada-privada@example.com')
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(null, 'ada@example.com')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    assert.isNull(suelta.body().data.assignee.fullName)
    assert.equal(suelta.body().data.assignee.initials, 'AE')

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    const enLista = lista.body().data.find((t: any) => t.id === tarea.id)
    assert.isNull(enLista.assignee.fullName)
    assert.equal(enLista.assignee.initials, 'AE')
  })
})
