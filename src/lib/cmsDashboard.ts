import { countRows } from './cms'

export type DashboardSummary = {
  contacts: number | null
  importantNotices: number | null
  joinApplications: number | null
  pendingSponsors: number | null
  supportPledges: number | null
  upcomingConcerts: number | null
}

export async function loadDashboardSummary() {
  const requests = [
    countRows({ table: 'contacts', inFilters: [{ column: 'status', values: ['new', 'reviewing', 'in_progress'] }] }),
    countRows({ table: 'join_applications', filters: [{ column: 'is_archived', value: false }], inFilters: [{ column: 'status', values: ['new', 'contacted', 'audition_guided', 'on_hold'] }] }),
    countRows({ table: 'support_pledges', inFilters: [{ column: 'status', values: ['new', 'in_progress'] }] }),
    countRows({ table: 'sponsors', filters: [{ column: 'consent_public', value: false }] }),
    countRows({ table: 'concerts', inFilters: [{ column: 'status', values: ['upcoming', 'open', 'ticketing'] }] }),
    countRows({ table: 'notices', filters: [{ column: 'is_important', value: true }, { column: 'is_visible', value: true }] }),
  ]
  const results = await Promise.all(requests.map(request => request.catch(() => ({ data: null, error: '현황을 확인하지 못했습니다.' }))))
  return {
    summary: { contacts: results[0].data, joinApplications: results[1].data, supportPledges: results[2].data,
      pendingSponsors: results[3].data, upcomingConcerts: results[4].data, importantNotices: results[5].data },
    failedCount: results.filter(result => Boolean(result.error)).length,
  }
}
