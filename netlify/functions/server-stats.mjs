import { fetchServerStats } from './_core.mjs'

/**
 * GET /api/server-stats → { fivem, discord, fetchedAt }
 * Codes come from FIVEM_SERVER_CODE and DISCORD_INVITE_CODE, read per request,
 * so they can be changed in the Netlify UI without a rebuild.
 */
export default async () => {
  const stats = await fetchServerStats({
    cfxCode: process.env.FIVEM_SERVER_CODE || '',
    inviteCode: process.env.DISCORD_INVITE_CODE || '',
  })

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Edge-cache for a minute: the page polls on the same interval.
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=30',
    },
  })
}
