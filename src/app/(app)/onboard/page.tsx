import { requireCtx } from '@/lib/auth'
import { listOnboardableRepos } from '@/lib/core/repos'
import { OnboardList } from '@/components/onboard-list'

// Hits the GitHub API, so never prerendered.
export const dynamic = 'force-dynamic'

export default async function OnboardPage() {
  const repos = await listOnboardableRepos(await requireCtx())
  return <OnboardList repos={repos} />
}
