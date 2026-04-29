function timestampOf(record, key) {
  const value = record && typeof record[key] === 'string' ? Date.parse(record[key]) : NaN
  return Number.isFinite(value) ? value : 0
}

export function pruneRecordsByTimestamp(records, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date()
  const maxAgeDays = Number.isFinite(options.maxAgeDays) ? options.maxAgeDays : 30
  const maxRecords = Number.isFinite(options.maxRecords) ? options.maxRecords : 2000
  const timestampKey = options.timestampKey || 'createdAt'
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000

  return [...(Array.isArray(records) ? records : [])]
    .filter((record) => timestampOf(record, timestampKey) >= cutoff)
    .sort((a, b) => timestampOf(b, timestampKey) - timestampOf(a, timestampKey))
    .slice(0, maxRecords)
}

export function pruneRecordMapByTimestamp(records, options = {}) {
  const entries = Object.entries(records && typeof records === 'object' ? records : {})
  const now = options.now instanceof Date ? options.now : new Date()
  const maxAgeDays = Number.isFinite(options.maxAgeDays) ? options.maxAgeDays : 30
  const maxRecords = Number.isFinite(options.maxRecords) ? options.maxRecords : 500
  const timestampKey = options.timestampKey || 'timestamp'
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000

  return Object.fromEntries(
    entries
      .filter(([, record]) => timestampOf(record, timestampKey) >= cutoff)
      .sort(([, a], [, b]) => timestampOf(b, timestampKey) - timestampOf(a, timestampKey))
      .slice(0, maxRecords),
  )
}
