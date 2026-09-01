import { moneyCreateSchema, moneyUpdateSchema } from '@/lib/schemas'
import type { MoneyCreate, MoneyUpdate } from '@/lib/schemas'
import type { MoneyEntry } from '@/lib/types'
import { CoreError, unwrap, type Ctx } from './context'
import { touchProject } from './touch'

export async function listMoney(ctx: Ctx, projectId?: string): Promise<MoneyEntry[]> {
  let q = ctx.db.from('money_entries').select('*').eq('user_id', ctx.userId)
  if (projectId) q = q.eq('project_id', projectId)
  return unwrap(await q.order('occurred_on', { ascending: false })) as MoneyEntry[]
}

export async function recordMoney(ctx: Ctx, input: MoneyCreate): Promise<MoneyEntry> {
  const v = moneyCreateSchema.parse(input)
  const entry = unwrap(
    await ctx.db.from('money_entries').insert({ ...v, user_id: ctx.userId }).select().single(),
  ) as MoneyEntry
  const amount = (entry.amount_cents / 100).toFixed(2)
  await touchProject(ctx, entry.project_id, `${entry.kind === 'earning' ? 'Earning' : 'Cost'} recorded: ${entry.label} ${entry.currency} ${amount}`)
  return entry
}

export async function updateMoney(ctx: Ctx, id: string, input: MoneyUpdate): Promise<MoneyEntry> {
  const v = moneyUpdateSchema.parse(input)
  const entry = unwrap(
    await ctx.db.from('money_entries').update(v).eq('id', id).eq('user_id', ctx.userId).select().single(),
  ) as MoneyEntry
  await touchProject(ctx, entry.project_id)
  return entry
}

export async function deleteMoney(ctx: Ctx, id: string): Promise<void> {
  const { error } = await ctx.db.from('money_entries').delete().eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}
