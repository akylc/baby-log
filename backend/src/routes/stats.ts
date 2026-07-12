import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange } from '../helpers'
import { ok } from '../reply'

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/stats', async (req) => {
    const uid = (req as any).userId as number
    const q = req.query as any
    const baby = getBabyByUser(uid, q?.babyId ? Number(q.babyId) : undefined)
    if (!baby)
      return ok({ total_milk_ml: 0, feed_count: 0, avg_interval_min: 0, sleep_min: 0, diaper_count: 0 })
    const { start, end } = dateRange(q?.date as string | undefined)
    const feeds = db.prepare(
      'SELECT * FROM feedings WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at ASC',
    ).all(baby.id, start, end) as any[]
    const sleeps = db.prepare(
      'SELECT duration_min FROM sleeps WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ?',
    ).all(baby.id, start, end) as any[]
    const diaperCount = (db.prepare(
      'SELECT COUNT(*) AS c FROM diapers WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ?',
    ).get(baby.id, start, end) as any).c

    const totalMilk = feeds
      .filter((f) => (f.type === 'formula' || f.type === 'bottle') && f.amount_ml)
      .reduce((s, f) => s + f.amount_ml, 0)
    let avgInterval = 0
    if (feeds.length >= 2) {
      const times = feeds
        .map((f) => new Date(String(f.occurred_at).replace(' ', 'T')).getTime())
        .filter((t) => !isNaN(t))
      let total = 0
      for (let i = 1; i < times.length; i++) total += times[i] - times[i - 1]
      avgInterval = Math.round(total / (times.length - 1) / 60000)
    }
    const sleepMin = sleeps.reduce((s, r) => s + (Number(r.duration_min) || 0), 0)

    return ok({
      total_milk_ml: totalMilk,
      feed_count: feeds.length,
      avg_interval_min: avgInterval,
      sleep_min: sleepMin,
      diaper_count: diaperCount,
    })
  })
}

export default statsRoutes
