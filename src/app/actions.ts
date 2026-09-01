'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireCtx } from '@/lib/auth'
import { createProject, updateProject, deleteProject } from '@/lib/core/projects'
import { addTask, updateTask, deleteTask } from '@/lib/core/tasks'
import { captureIdea, updateIdea, convertIdeaToTask, deleteIdea } from '@/lib/core/ideas'
import { captureResource, updateResource, deleteResource } from '@/lib/core/resources'
import { recordMoney, deleteMoney } from '@/lib/core/money'
import { logUpdate } from '@/lib/core/log'
import { createToken, revokeToken } from '@/lib/core/tokens'
import type { IdeaCreate, MoneyCreate, ProjectCreate, ProjectUpdate, ResourceCreate, TaskCreate, TaskUpdate } from '@/lib/schemas'

/**
 * Thin wrappers: parse-free, logic-free, they exist only to attach a session
 * and refresh the affected routes. All behaviour lives in `@/lib/core`.
 */

function refresh(slug?: string) {
  revalidatePath('/')
  revalidatePath('/inbox')
  if (slug) revalidatePath(`/p/${slug}`)
}

export async function createProjectAction(input: ProjectCreate) {
  const project = await createProject(await requireCtx(), input)
  refresh(project.slug)
  redirect(`/p/${project.slug}`)
}

export async function updateProjectAction(slug: string, patch: ProjectUpdate) {
  const project = await updateProject(await requireCtx(), slug, patch)
  refresh(slug)
  if (project.slug !== slug) redirect(`/p/${project.slug}`)
  return project
}

export async function deleteProjectAction(slug: string) {
  await deleteProject(await requireCtx(), slug)
  refresh()
  redirect('/')
}

export async function addTaskAction(slug: string, input: TaskCreate) {
  await addTask(await requireCtx(), input)
  refresh(slug)
}

export async function updateTaskAction(slug: string, id: string, patch: TaskUpdate) {
  await updateTask(await requireCtx(), id, patch)
  refresh(slug)
}

export async function deleteTaskAction(slug: string, id: string) {
  await deleteTask(await requireCtx(), id)
  refresh(slug)
}

export async function captureIdeaAction(input: IdeaCreate) {
  const idea = await captureIdea(await requireCtx(), input)
  refresh()
  return idea
}

export async function updateIdeaAction(id: string, patch: Partial<IdeaCreate>) {
  await updateIdea(await requireCtx(), id, patch)
  refresh()
}

export async function convertIdeaAction(id: string, projectId: string) {
  await convertIdeaToTask(await requireCtx(), id, projectId)
  refresh()
}

export async function deleteIdeaAction(id: string) {
  await deleteIdea(await requireCtx(), id)
  refresh()
}

export async function captureResourceAction(input: ResourceCreate) {
  const resource = await captureResource(await requireCtx(), input)
  refresh()
  return resource
}

export async function updateResourceAction(id: string, patch: Partial<ResourceCreate>) {
  await updateResource(await requireCtx(), id, patch)
  refresh()
}

export async function deleteResourceAction(id: string) {
  await deleteResource(await requireCtx(), id)
  refresh()
}

export async function recordMoneyAction(slug: string, input: MoneyCreate) {
  await recordMoney(await requireCtx(), input)
  refresh(slug)
}

export async function deleteMoneyAction(slug: string, id: string) {
  await deleteMoney(await requireCtx(), id)
  refresh(slug)
}

export async function logUpdateAction(slug: string, projectId: string, body: string) {
  await logUpdate(await requireCtx(), { project_id: projectId, body })
  refresh(slug)
}

export async function createTokenAction(name: string) {
  const result = await createToken(await requireCtx(), name)
  revalidatePath('/settings')
  return result
}

export async function revokeTokenAction(id: string) {
  await revokeToken(await requireCtx(), id)
  revalidatePath('/settings')
}
