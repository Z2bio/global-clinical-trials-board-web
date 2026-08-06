export const CONFIG = Object.freeze({
  apiBase: 'https://clinicaltrials.gov/api/v2',
  pageSize: 30,
  cacheTtlMs: 30 * 60 * 1000,
  requestTimeoutMs: 22000,
  cachePrefix: 'ct-board-cache-v1:',
  favoritesKey: 'ct-board-favorites-v1',
  maxCachedQueries: 16,
  sourceName: 'ClinicalTrials.gov',
  sourceHome: 'https://clinicaltrials.gov/',
  defaultSort: 'LastUpdatePostDate:desc'
})
