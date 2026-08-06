import { CONFIG } from './config.js'
import {
  languageFromStorage,
  label,
  localizeUnknown,
  normalizeLanguage,
  phaseLabel as localizedPhaseLabel,
  saveLanguage,
  statusMeta,
  t
} from './i18n.js'
import { getApiVersion, getStudyById, readCachedSearch, searchStudies } from './api.js'
import {
  clearAllLocalData,
  getFavorites,
  removeFavorite,
  replaceFavoriteSnapshot,
  saveFavorite
} from './storage.js'
import {
  isUpdatedWithinDays,
  matchesClientFilters,
  sortStudies
} from './normalizer.js'
import { chineseReference, inlineChineseName } from './translator.js'

const state = {
  query: '',
  statusCode: '',
  phase: '',
  country: '',
  sponsorClass: '',
  sortMode: 'updated-desc',
  studies: [],
  totalCount: 0,
  nextPageToken: '',
  dataTimestamp: '',
  fetchedAt: null,
  source: '',
  loading: false,
  loadingMore: false,
  favorites: getFavorites(),
  currentDetail: null,
  versionPromise: null,
  language: languageFromStorage()
}

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : CONFIG.sourceHome
  } catch {
    return CONFIG.sourceHome
  }
}

function formatDateTime(timestamp) {
  if (!timestamp) return '未记录'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return String(timestamp)
  return new Intl.DateTimeFormat(state.language, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date)
}

function formatRelativeAge(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return t(state.language, 'timeUnknown')
  const minutes = Math.floor(ageMs / 60000)
  if (minutes < 1) return t(state.language, 'lessThanMinute')
  if (minutes < 60) return t(state.language, 'minute', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t(state.language, 'hour', { count: hours })
  return t(state.language, 'day', { count: Math.floor(hours / 24) })
}

function tr(key, params = {}) {
  return t(state.language, key, params)
}

function displayValue(value) {
  return localizeUnknown(state.language, value)
}

function displayStatus(study) {
  return statusMeta(state.language, study.statusCode).label
}

function displayStatusPlain(study) {
  return statusMeta(state.language, study.statusCode).plain
}

function displayPhase(study) {
  return localizedPhaseLabel(state.language, study.phases)
}

function displayStudyType(study) {
  return label(state.language, 'studyType', study.studyType, study.studyType)
}

function displaySponsorClass(code) {
  return label(state.language, 'sponsorClass', code, code)
}

function displayInterventionType(code, fallback) {
  return label(state.language, 'interventionType', code, fallback)
}

function displayEnrollmentType(type, fallback) {
  return label(state.language, 'enrollmentType', type, fallback)
}

function displaySex(code, fallback) {
  return label(state.language, 'sex', code, fallback)
}

function displayDateType(type) {
  return type ? label(state.language, 'dateType', type, type) : ''
}

function numberText(value) {
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat(state.language).format(number) : tr('none')
}

function chineseReferenceHtml(value, { compact = false } = {}) {
  if (state.language !== 'zh-CN') return ''
  const translated = chineseReference(value)
  if (!translated) return ''
  return `
    <div class="zh-reference ${compact ? 'compact' : ''}">
      <strong>${escapeHtml(tr('zhReferenceLabel'))}</strong>
      ${compact ? '' : `<small>${escapeHtml(tr('zhReferenceNote'))}</small>`}
      <p>${escapeHtml(translated)}</p>
    </div>
  `
}

function translatedListItem(value) {
  return `<li><span>${escapeHtml(value)}</span>${chineseReferenceHtml(value, { compact: true })}</li>`
}

function inlineMedicalName(value) {
  if (state.language !== 'zh-CN') return displayValue(value)
  return inlineChineseName(value)
}

function inlineMedicalList(values = [], limit = Infinity) {
  const selected = values.slice(0, limit).filter(Boolean)
  if (!selected.length) return tr('unknown')
  return selected.map(inlineMedicalName).join('、')
}

function showToast(message, duration = 2200) {
  const toast = $('#toast')
  toast.textContent = message
  toast.hidden = false
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => { toast.hidden = true }, duration)
}

function setSyncState(mode, title, detail = '') {
  const indicator = $('#sync-indicator')
  indicator.dataset.state = mode
  $('#sync-status').textContent = title
  $('#sync-detail').textContent = detail || '—'
  $('#refresh-button').classList.toggle('is-spinning', mode === 'loading')
}

function setLoadingSkeleton() {
  $('#trial-list').innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card" aria-hidden="true"></div>').join('')
}

const STATUS_OPTIONS = [
  'RECRUITING',
  'NOT_YET_RECRUITING',
  'ENROLLING_BY_INVITATION',
  'ACTIVE_NOT_RECRUITING',
  'SUSPENDED',
  'COMPLETED',
  'TERMINATED',
  'WITHDRAWN'
]

const PHASE_OPTIONS = ['EARLY_PHASE1', 'PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'NA']
const SPONSOR_OPTIONS = ['INDUSTRY', 'NIH', 'FED', 'OTHER']
const SORT_OPTIONS = [
  ['updated-desc', 'sortUpdated'],
  ['posted-desc', 'sortPosted'],
  ['enrollment-desc', 'sortEnrollment'],
  ['title-asc', 'sortTitle']
]

function optionHtml(value, text) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`
}

function setSelectOptions(select, entries, value) {
  select.innerHTML = entries.map(([optionValue, text]) => optionHtml(optionValue, text)).join('')
  select.value = value || ''
}

function renderFilterOptions() {
  setSelectOptions($('#status-filter'), [
    ['', tr('allStatuses')],
    ...STATUS_OPTIONS.map((code) => [code, statusMeta(state.language, code).label])
  ], state.statusCode)
  setSelectOptions($('#phase-filter'), [
    ['', tr('allPhases')],
    ...PHASE_OPTIONS.map((code) => [code, label(state.language, 'phase', code, code)])
  ], state.phase)
  setSelectOptions($('#sponsor-filter'), [
    ['', tr('allSponsors')],
    ...SPONSOR_OPTIONS.map((code) => [code, displaySponsorClass(code)])
  ], state.sponsorClass)
  setSelectOptions($('#sort-filter'), SORT_OPTIONS.map(([value, key]) => [value, tr(key)]), state.sortMode)
  updateCountryOptions()
}

function renderStaticText() {
  document.documentElement.lang = normalizeLanguage(state.language)
  document.title = tr('siteTitle')
  document.querySelector('meta[name="description"]')?.setAttribute('content', tr('siteDescription'))
  $$('[data-i18n]').forEach((node) => { node.textContent = tr(node.dataset.i18n) })
  $$('[data-i18n-placeholder]').forEach((node) => { node.setAttribute('placeholder', tr(node.dataset.i18nPlaceholder)) })
  $$('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', tr(node.dataset.i18nAriaLabel)) })
  $$('[data-i18n-title]').forEach((node) => { node.setAttribute('title', tr(node.dataset.i18nTitle)) })
  $('#language-toggle').textContent = state.language === 'en' ? '中文' : 'EN'
  if (!state.source && !state.loading) {
    $('#sync-status').textContent = tr('syncReady')
    $('#sync-detail').textContent = tr('readyDash')
  }
  $('#source-timestamp').textContent = state.dataTimestamp || tr('pending')
  $('#cache-status').textContent = state.source ? $('#cache-status').textContent : tr('cacheUnused')
  if (!state.studies.length && !state.loading) $('#results-summary').textContent = tr('resultsPreparing')
  $('#load-more-button').textContent = state.loadingMore ? tr('loadingMore') : tr('loadMore')
  renderFilterOptions()
}

function renderSyncTextForLanguage() {
  if (!state.source) return
  if (state.source === 'network') {
    setSyncState('success', tr('networkSynced'), tr('fetchedCount', { count: numberText(state.studies.length) }))
    $('#cache-status').textContent = tr('cacheUpdated')
    return
  }
  const ageMs = state.fetchedAt ? Date.now() - state.fetchedAt : Number.NaN
  setSyncState('cache', tr('cacheShown'), tr('cacheShownDetail', { age: formatRelativeAge(ageMs) }))
  $('#cache-status').textContent = `${formatRelativeAge(ageMs)}${tr('agoSuffix')}`
}

function searchParams() {
  return {
    query: state.query,
    statusCode: state.statusCode,
    pageToken: ''
  }
}

function filteredStudies() {
  return sortStudies(
    state.studies.filter((study) => matchesClientFilters(study, {
      phase: state.phase,
      country: state.country,
      sponsorClass: state.sponsorClass
    })),
    state.sortMode
  )
}

function updateCountryOptions() {
  const select = $('#country-filter')
  const countries = [...new Set(state.studies.flatMap((study) => study.countries))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const current = state.country
  select.innerHTML = optionHtml('', tr('allCountries')) + countries.map((country) => optionHtml(country, country)).join('')
  if (countries.includes(current)) select.value = current
  else if (current) {
    state.country = ''
    select.value = ''
  }
}

function renderStats() {
  const visible = filteredStudies()
  const countryCount = new Set(visible.flatMap((study) => study.countries)).size
  const recruiting = visible.filter((study) => study.statusCode === 'RECRUITING').length
  const recent = visible.filter((study) => isUpdatedWithinDays(study.dates.lastUpdatePosted, 30)).length
  $('#stat-total').textContent = Number.isFinite(state.totalCount) ? numberText(state.totalCount) : tr('none')
  $('#stat-recruiting').textContent = numberText(recruiting)
  $('#stat-countries').textContent = numberText(countryCount)
  $('#stat-recent').textContent = numberText(recent)
}

function activeFilterEntries() {
  const entries = []
  if (state.query) entries.push({ key: 'query', label: tr('chipQuery', { value: state.query }) })
  if (state.statusCode) entries.push({ key: 'statusCode', label: tr('chipStatus', { value: statusMeta(state.language, state.statusCode).label }) })
  if (state.phase) entries.push({ key: 'phase', label: tr('chipPhase', { value: label(state.language, 'phase', state.phase, state.phase) }) })
  if (state.country) entries.push({ key: 'country', label: tr('chipCountry', { value: state.country }) })
  if (state.sponsorClass) entries.push({ key: 'sponsorClass', label: tr('chipSponsor', { value: displaySponsorClass(state.sponsorClass) }) })
  return entries
}

function renderFilterChips() {
  const container = $('#active-filter-chips')
  const entries = activeFilterEntries()
  container.innerHTML = entries.map((entry) => `
    <span class="filter-chip">${escapeHtml(entry.label)}<button type="button" data-remove-filter="${escapeHtml(entry.key)}" aria-label="${escapeHtml(tr('removeFilter'))}">×</button></span>
  `).join('')
}

function localizedPlainSummary(study) {
  const conditions = inlineMedicalList(study.conditions, 3)
  const enrollmentText = study.enrollment.count
    ? tr('enrollmentPublic', { type: displayEnrollmentType(study.enrollment.type, study.enrollment.typeLabel), count: numberText(study.enrollment.count) })
    : tr('enrollmentMissing')
  const phaseText = displayPhase(study)
  const phasePrefix = phaseText === tr('unknown') || phaseText === '分期未公开' || phaseText === 'Phase not disclosed'
    ? tr('summaryNoPhase')
    : tr('summaryPhasePrefix', { phase: phaseText })
  return tr('summary', {
    phasePrefix,
    studyType: displayStudyType(study),
    conditions,
    enrollmentText,
    status: displayStatus(study)
  })
}

function renderCard(study, { favoriteContext = false } = {}) {
  const isFavorite = Boolean(state.favorites[study.nctId])
  const primaryFacility = study.facilities[0]
  const countries = study.countries.length ? study.countries.join('、') : tr('unknown')
  const intervention = study.interventions[0]
  const duration = displayValue(study.durationSummary || intervention?.description)
  const favoriteChange = favoriteContext ? state.favorites[study.nctId]?.lastChange : null
  const enrollmentText = study.enrollment.count
    ? tr('estimatedPeople', { type: displayEnrollmentType(study.enrollment.type, study.enrollment.typeLabel), count: numberText(study.enrollment.count) })
    : tr('unknown')
  return `
    <article class="trial-card ${escapeHtml(study.statusClass)}" data-study-id="${escapeHtml(study.nctId)}">
      <div class="trial-card-inner">
        <div class="card-topline">
          <div class="card-badges">
            <span class="badge status">${escapeHtml(displayStatus(study))}</span>
            <span class="badge">${escapeHtml(displayPhase(study))}</span>
            <span class="badge">${escapeHtml(displayStudyType(study))}</span>
            ${study.hasResults ? `<span class="badge source">${escapeHtml(tr('hasResults'))}</span>` : ''}
          </div>
          <button class="favorite-button ${isFavorite ? 'active' : ''}" type="button" data-favorite-id="${escapeHtml(study.nctId)}" aria-label="${escapeHtml(isFavorite ? tr('favoriteRemove') : tr('favoriteAdd'))}" title="${escapeHtml(isFavorite ? tr('favoriteRemove') : tr('favoriteAdd'))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>
          </button>
        </div>
        <h3 class="trial-title"><button type="button" data-open-detail="${escapeHtml(study.nctId)}">${escapeHtml(study.briefTitle)}</button></h3>
        ${chineseReferenceHtml(study.briefTitle, { compact: true })}
        <div class="trial-id">${escapeHtml(study.nctId)} · ${escapeHtml(tr('cardSponsor', { value: study.sponsor.name }))}</div>
        <p class="plain-summary">${escapeHtml(localizedPlainSummary(study))}</p>
        ${favoriteChange ? `<div class="results-alert" style="margin:12px 0 0" role="status">${escapeHtml(tr('change', { from: favoriteChange.from, to: favoriteChange.to }))}</div>` : ''}
        <div class="trial-facts">
          <div class="fact"><span class="fact-label">${escapeHtml(tr('condition'))}</span><span class="fact-value" title="${escapeHtml(study.conditions.join('、'))}">${escapeHtml(inlineMedicalList(study.conditions, 3))}</span></div>
          <div class="fact"><span class="fact-label">${escapeHtml(tr('facility'))}</span><span class="fact-value" title="${escapeHtml(primaryFacility?.name || tr('unknown'))}">${escapeHtml(primaryFacility?.name || tr('unknown'))}</span></div>
          <div class="fact"><span class="fact-label">${escapeHtml(tr('interventionDuration'))}</span><span class="fact-value" title="${escapeHtml(duration)}">${escapeHtml(duration)}</span>${chineseReferenceHtml(duration, { compact: true })}</div>
          <div class="fact"><span class="fact-label">${escapeHtml(tr('enrollment'))}</span><span class="fact-value">${escapeHtml(enrollmentText)}</span></div>
          <div class="fact"><span class="fact-label">${escapeHtml(tr('countries'))}</span><span class="fact-value" title="${escapeHtml(countries)}">${escapeHtml(countries)}</span></div>
          <div class="fact"><span class="fact-label">${escapeHtml(tr('contact'))}</span><span class="fact-value">${escapeHtml(study.centralContacts[0]?.name || primaryFacility?.contacts[0]?.name || tr('unknown'))}</span></div>
        </div>
        <div class="card-footer">
          <span class="card-update">${escapeHtml(tr('updated', { date: displayValue(study.dates.lastUpdatePosted) }))}</span>
          <div class="card-actions">
            <button class="card-detail-button" type="button" data-open-detail="${escapeHtml(study.nctId)}">${escapeHtml(tr('detailsButton'))}</button>
            <a class="card-link" href="${escapeHtml(safeUrl(study.sourceRecordUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(tr('officialRecord'))} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5m0-5-9 9M19 13v6H5V5h6"/></svg></a>
          </div>
        </div>
      </div>
    </article>
  `
}

function emptyState(title, message, action = '') {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${action}
    </div>
  `
}

function renderResults() {
  const visible = filteredStudies()
  const list = $('#trial-list')
  const totalText = state.totalCount ? tr('totalSuffix', { total: numberText(state.totalCount) }) : ''
  $('#results-summary').textContent = tr('loadedSummary', {
    loaded: numberText(state.studies.length),
    visible: numberText(visible.length),
    total: totalText
  })

  if (!visible.length) {
    list.innerHTML = emptyState(
      tr('emptyResultsTitle'),
      state.studies.length ? tr('emptyResultsWithData') : tr('emptyResultsNoData'),
      `<button class="secondary-button" type="button" data-reset-all>${escapeHtml(tr('resetSearch'))}</button>`
    )
  } else {
    list.innerHTML = visible.map((study) => renderCard(study)).join('')
  }

  $('#load-more-button').hidden = !state.nextPageToken || state.loadingMore
  $('#load-more-button').textContent = state.loadingMore ? tr('loadingMore') : tr('loadMore')
  renderFilterChips()
  renderStats()
  updateFavoriteBadge()
}

function applyPayload(payload, { append = false, preview = false } = {}) {
  state.studies = append
    ? [...state.studies, ...payload.studies.filter((incoming) => !state.studies.some((existing) => existing.nctId === incoming.nctId))]
    : payload.studies
  state.totalCount = payload.totalCount
  state.nextPageToken = payload.nextPageToken || ''
  state.fetchedAt = payload.fetchedAt || Date.now()
  state.source = payload.source
  if (payload.dataTimestamp) state.dataTimestamp = payload.dataTimestamp
  updateCountryOptions()
  renderResults()

  if (payload.source === 'network') {
    setSyncState('success', preview ? tr('latestPublic') : tr('networkSynced'), tr('fetchedCount', { count: numberText(payload.studies.length) }))
    $('#cache-status').textContent = tr('cacheUpdated')
  } else {
    setSyncState('cache', tr('cacheShown'), tr('cacheShownDetail', { age: formatRelativeAge(payload.cacheAgeMs) }))
    $('#cache-status').textContent = `${formatRelativeAge(payload.cacheAgeMs)}${tr('agoSuffix')}`
  }
  $('#source-timestamp').textContent = state.dataTimestamp || CONFIG.sourceName
}

async function runSearch({ useCachePreview = true, scroll = false } = {}) {
  if (state.loading) return
  state.loading = true
  const params = searchParams()
  const cached = useCachePreview ? readCachedSearch(params) : null
  $('#results-alert').hidden = true

  if (cached) {
    applyPayload(cached, { preview: true })
    setSyncState('loading', tr('cachePreview'), tr('cacheShownDetail', { age: formatRelativeAge(cached.cacheAgeMs) }))
  } else {
    setLoadingSkeleton()
    setSyncState('loading', tr('connecting'), tr('connectingDetail'))
  }

  try {
    const [payload, version] = await Promise.all([
      searchStudies(params),
      state.versionPromise || getApiVersion()
    ])
    state.versionPromise = Promise.resolve(version)
    if (version.dataTimestamp) payload.dataTimestamp = version.dataTimestamp
    applyPayload(payload)
    if (payload.effectiveQuery && payload.effectiveQuery !== payload.requestedQuery) {
      const alert = $('#results-alert')
      alert.textContent = tr('queryTranslated', { requested: payload.requestedQuery, effective: payload.effectiveQuery })
      alert.hidden = false
    }
    if (payload.warning) {
      const alert = $('#results-alert')
      alert.textContent = tr('cacheWarning', { reason: payload.warning })
      alert.hidden = false
    }
  } catch (error) {
    state.studies = []
    state.totalCount = 0
    state.nextPageToken = ''
    renderResults()
    setSyncState('error', tr('sourceError'), error.message || 'Network request failed')
    $('#cache-status').textContent = tr('cacheNoAvailable')
    const alert = $('#results-alert')
    alert.innerHTML = tr('sourceErrorHtml', { url: CONFIG.sourceHome })
    alert.hidden = false
  } finally {
    state.loading = false
    if (scroll) $('#results-title').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function loadMore() {
  if (!state.nextPageToken || state.loadingMore) return
  state.loadingMore = true
  $('#load-more-button').hidden = false
  $('#load-more-button').textContent = tr('loadingMore')
  try {
    const payload = await searchStudies({
      query: state.query,
      statusCode: state.statusCode,
      pageToken: state.nextPageToken
    })
    applyPayload(payload, { append: true })
  } catch (error) {
    showToast(error.message || '加载更多失败')
  } finally {
    state.loadingMore = false
    renderResults()
  }
}

function toggleFavorite(nctId) {
  const study = state.studies.find((item) => item.nctId === nctId)
    || state.currentDetail?.nctId === nctId && state.currentDetail
    || state.favorites[nctId]?.snapshot
  if (!study) return
  if (state.favorites[nctId]) {
    state.favorites = removeFavorite(nctId)
    showToast(tr('favoriteRemoved'))
  } else {
    state.favorites = saveFavorite(study)
    showToast(tr('favoriteAdded'))
  }
  renderResults()
  if (!$('#following-view').hidden) renderFavorites()
  if (state.currentDetail) renderDetail(state.currentDetail)
  updateFavoriteBadge()
}

function updateFavoriteBadge() {
  const count = Object.keys(state.favorites).length
  const badge = $('#favorite-count-badge')
  badge.textContent = String(count)
  badge.hidden = count === 0
}

function contactHtml(contact) {
  if (!contact) return `<p>${escapeHtml(tr('noContact'))}</p>`
  return `
    <div class="detail-grid">
      <dl class="detail-item"><dt>${escapeHtml(tr('contact'))}</dt><dd>${escapeHtml(displayValue(contact.name))}</dd></dl>
      <dl class="detail-item"><dt>${escapeHtml(tr('role'))}</dt><dd>${escapeHtml(displayValue(contact.role))}</dd></dl>
      <dl class="detail-item"><dt>${escapeHtml(tr('phone'))}</dt><dd>${escapeHtml(displayValue(contact.phone))}${contact.phoneExt ? escapeHtml(tr('phoneExt', { ext: contact.phoneExt })) : ''}</dd></dl>
      <dl class="detail-item"><dt>${escapeHtml(tr('email'))}</dt><dd>${escapeHtml(displayValue(contact.email))}</dd></dl>
    </div>
  `
}

function localizedTimelineTitle(title) {
  const map = {
    首次公示: tr('firstPosted'),
    研究开始: tr('start'),
    主要终点预计完成: tr('primaryCompletion'),
    研究预计完成: tr('completion'),
    最近更新: tr('lastPosted')
  }
  return map[title] || title
}

function localizedTimelineDetail(title, detail) {
  const map = {
    首次公示: tr('firstPostedDetail'),
    研究开始: tr('studyStartDetail'),
    主要终点预计完成: tr('primaryCompletionDetail'),
    研究预计完成: tr('completionDetail'),
    最近更新: tr('lastUpdateDetail')
  }
  return map[title] || detail
}

function renderDetail(study) {
  state.currentDetail = study
  $('#detail-nct').textContent = study.nctId
  $('#detail-title').textContent = study.briefTitle
  const isFavorite = Boolean(state.favorites[study.nctId])
  const collaborators = study.collaborators.length
    ? study.collaborators.map((item) => `${escapeHtml(item.name)} (${escapeHtml(displaySponsorClass(item.className))})`).join('；')
    : tr('unknown')
  const interventions = study.interventions.length
    ? study.interventions.map((item) => `
      <li class="intervention-item">
        <strong>${escapeHtml(displayValue(item.name))} · ${escapeHtml(displayInterventionType(item.type, item.typeLabel))}</strong>
        <p>${escapeHtml(displayValue(item.description))}</p>
        ${chineseReferenceHtml(item.description, { compact: true })}
        ${item.otherNames.length ? `<p>${escapeHtml(tr('otherNames', { value: item.otherNames.join('、') }))}</p>` : ''}
      </li>
    `).join('')
    : `<li class="intervention-item"><p>${escapeHtml(tr('noIntervention'))}</p></li>`
  const facilities = study.facilities.length
    ? study.facilities.slice(0, 30).map((facility) => {
        const contact = facility.contacts[0]
        return `
          <li class="facility-item">
            <strong>${escapeHtml(facility.name)}</strong>
            <p>${escapeHtml(displayValue(facility.address))}</p>
            <div class="facility-meta">
              <span>${escapeHtml(tr('centerStatus', { value: statusMeta(state.language, facility.statusCode).label }))}</span>
              ${contact ? `<span>${escapeHtml(tr('centerContact', { value: displayValue(contact.name) }))}</span><span>${escapeHtml(tr('centerPhone', { value: displayValue(contact.phone) }))}</span><span>${escapeHtml(tr('centerEmail', { value: displayValue(contact.email) }))}</span>` : `<span>${escapeHtml(tr('noCenterContact'))}</span>`}
            </div>
          </li>
        `
      }).join('')
    : `<li class="facility-item"><p>${escapeHtml(tr('noFacilities'))}</p></li>`
  const primaryOutcomes = study.primaryOutcomes.length
    ? study.primaryOutcomes.map((item) => `<li class="outcome-item"><strong>${escapeHtml(displayValue(item.measure))}</strong>${chineseReferenceHtml(item.measure, { compact: true })}<p>${escapeHtml(state.language === 'en' ? 'Time frame' : '时间范围')}：${escapeHtml(displayValue(item.timeFrame))}</p>${chineseReferenceHtml(item.timeFrame, { compact: true })}${item.description ? `<p>${escapeHtml(item.description)}</p>${chineseReferenceHtml(item.description, { compact: true })}` : ''}</li>`).join('')
    : `<li class="outcome-item"><p>${escapeHtml(state.language === 'en' ? 'Primary outcome measures are not disclosed.' : '未公开主要结局指标。')}</p></li>`
  const secondaryOutcomes = study.secondaryOutcomes.length
    ? study.secondaryOutcomes.slice(0, 10).map((item) => `<li class="outcome-item"><strong>${escapeHtml(displayValue(item.measure))}</strong>${chineseReferenceHtml(item.measure, { compact: true })}<p>${escapeHtml(state.language === 'en' ? 'Time frame' : '时间范围')}：${escapeHtml(displayValue(item.timeFrame))}</p>${chineseReferenceHtml(item.timeFrame, { compact: true })}</li>`).join('')
    : `<li class="outcome-item"><p>${escapeHtml(state.language === 'en' ? 'Secondary outcome measures are not disclosed.' : '未公开次要结局指标。')}</p></li>`
  const timeline = study.timeline.length
    ? study.timeline.map((item) => `<li class="outcome-item"><strong>${escapeHtml(displayValue(item.date))} · ${escapeHtml(localizedTimelineTitle(item.title))}</strong><p>${escapeHtml(localizedTimelineDetail(item.title, item.detail))}</p></li>`).join('')
    : `<li class="outcome-item"><p>${escapeHtml(state.language === 'en' ? 'No timeline points were extracted.' : '未提取到时间节点。')}</p></li>`
  const inclusion = study.eligibility.inclusion.length
    ? study.eligibility.inclusion.map(translatedListItem).join('')
    : `<li>${escapeHtml(tr('inclusionFallback'))}</li>`
  const exclusion = study.eligibility.exclusion.length
    ? study.eligibility.exclusion.map(translatedListItem).join('')
    : `<li>${escapeHtml(tr('exclusionFallback'))}</li>`

  $('#detail-content').innerHTML = `
    <section class="detail-hero ${escapeHtml(study.statusClass)}">
      <div class="detail-badges">
        <span class="badge status">${escapeHtml(displayStatus(study))}</span>
        <span class="badge">${escapeHtml(displayPhase(study))}</span>
        <span class="badge">${escapeHtml(displayStudyType(study))}</span>
        <span class="badge">${escapeHtml(study.hasResults ? tr('hasResults') : tr('noResults'))}</span>
      </div>
      <h3>${escapeHtml(study.officialTitle)}</h3>
      ${chineseReferenceHtml(study.officialTitle)}
      <p>${escapeHtml(localizedPlainSummary(study))}</p>
      <div class="detail-source-row">
        <span>${escapeHtml(tr('updated', { date: displayValue(study.dates.lastUpdatePosted) }))}</span>
        <span>${escapeHtml(state.language === 'en' ? 'Status verified: ' : '状态核验月份：')}${escapeHtml(displayValue(study.statusVerifiedDate))}</span>
      </div>
    </section>

    <section class="detail-section">
      <h3><span>01</span>${escapeHtml(tr('section01'))}</h3>
      <div class="detail-grid">
        <dl class="detail-item"><dt>${escapeHtml(tr('condition'))}</dt><dd>${escapeHtml(inlineMedicalList(study.conditions))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('officialStatus'))}</dt><dd>${escapeHtml(displayStatus(study))}：${escapeHtml(displayStatusPlain(study))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('studyPhase'))}</dt><dd>${escapeHtml(displayPhase(study))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('studyType'))}</dt><dd>${escapeHtml(displayStudyType(study))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('enrollment'))}</dt><dd>${study.enrollment.count ? escapeHtml(tr('estimatedPeople', { type: displayEnrollmentType(study.enrollment.type, study.enrollment.typeLabel), count: numberText(study.enrollment.count) })) : escapeHtml(tr('unknown'))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('treatmentSummary'))}</dt><dd>${escapeHtml(displayValue(study.durationSummary))}${chineseReferenceHtml(study.durationSummary, { compact: true })}</dd></dl>
      </div>
      <details class="disclosure">
        <summary>${escapeHtml(tr('expandSummary'))}</summary>
        <div class="original-text">${escapeHtml(displayValue(study.registeredSummary))}</div>
        ${chineseReferenceHtml(study.registeredSummary)}
      </details>
    </section>

    <section class="detail-section">
      <h3><span>02</span>${escapeHtml(tr('section02'))}</h3>
      <div class="detail-grid">
        <dl class="detail-item"><dt>${escapeHtml(tr('leadSponsor'))}</dt><dd>${escapeHtml(displayValue(study.sponsor.name))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('sponsorType'))}</dt><dd>${escapeHtml(displaySponsorClass(study.sponsor.className))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('collaborators'))}</dt><dd>${collaborators}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('officials'))}</dt><dd>${escapeHtml(study.officials.map((item) => `${item.name} (${item.affiliation})`).join('；') || tr('unknown'))}</dd></dl>
      </div>
    </section>

    <section class="detail-section">
      <h3><span>03</span>${escapeHtml(tr('section03'))}</h3>
      <ul class="intervention-list">${interventions}</ul>
      <p class="plain-summary">${escapeHtml(tr('durationCaution'))}</p>
    </section>

    <section class="detail-section">
      <h3><span>04</span>${escapeHtml(tr('section04'))}</h3>
      <div class="detail-grid">
        <dl class="detail-item"><dt>${escapeHtml(tr('start'))}</dt><dd>${escapeHtml(displayValue(study.dates.start))}${study.dates.startType ? ` (${escapeHtml(displayDateType(study.dates.startType))})` : ''}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('primaryCompletion'))}</dt><dd>${escapeHtml(displayValue(study.dates.primaryCompletion))}${study.dates.primaryCompletionType ? ` (${escapeHtml(displayDateType(study.dates.primaryCompletionType))})` : ''}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('completion'))}</dt><dd>${escapeHtml(displayValue(study.dates.completion))}${study.dates.completionType ? ` (${escapeHtml(displayDateType(study.dates.completionType))})` : ''}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('firstPosted'))}</dt><dd>${escapeHtml(displayValue(study.dates.firstPosted))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('lastSubmitted'))}</dt><dd>${escapeHtml(displayValue(study.dates.lastUpdateSubmitted))}</dd></dl>
        <dl class="detail-item"><dt>${escapeHtml(tr('lastPosted'))}</dt><dd>${escapeHtml(displayValue(study.dates.lastUpdatePosted))}</dd></dl>
      </div>
      ${study.whyStopped ? `<p class="results-alert" style="margin:14px 0 0">${escapeHtml(tr('stopReason', { reason: study.whyStopped }))}</p>` : ''}
      <ul class="outcome-list" style="margin-top:14px">${timeline}</ul>
    </section>

    <section class="detail-section">
      <h3><span>05</span>${escapeHtml(tr('section05'))}</h3>
      ${contactHtml(study.centralContacts[0])}
      <ul class="facility-list" style="margin-top:14px">${facilities}</ul>
      ${study.facilities.length > 30 ? `<p class="plain-summary">${escapeHtml(tr('firstThirty'))}</p>` : ''}
    </section>

    <section class="detail-section">
      <h3><span>06</span>${escapeHtml(tr('section06'))}</h3>
      <div class="eligibility-intro">
        <div><span>${escapeHtml(tr('age'))}</span><strong>${escapeHtml(displayValue(study.eligibility.minimumAge))} - ${escapeHtml(displayValue(study.eligibility.maximumAge))}</strong></div>
        <div><span>${escapeHtml(tr('sex'))}</span><strong>${escapeHtml(displaySex(study.eligibility.sex, study.eligibility.sexLabel))}</strong></div>
        <div><span>${escapeHtml(tr('healthyVolunteers'))}</span><strong>${escapeHtml(study.eligibility.healthyVolunteers === '接受健康志愿者' ? tr('healthyYes') : tr('healthyNo'))}</strong></div>
      </div>
      <div class="eligibility-block"><h4>${escapeHtml(tr('inclusion'))}</h4><ul class="eligibility-list">${inclusion}</ul></div>
      <div class="eligibility-block"><h4>${escapeHtml(tr('exclusion'))}</h4><ul class="eligibility-list">${exclusion}</ul></div>
      <details class="disclosure">
        <summary>${escapeHtml(tr('expandCriteria'))}</summary>
        <div class="original-text">${escapeHtml(study.eligibility.original || tr('unknown'))}</div>
        ${chineseReferenceHtml(study.eligibility.original)}
      </details>
    </section>

    <section class="detail-section">
      <h3><span>07</span>${escapeHtml(tr('section07'))}</h3>
      <h4>${escapeHtml(tr('primaryOutcomes'))}</h4>
      <ul class="outcome-list">${primaryOutcomes}</ul>
      <h4 style="margin-top:16px">${escapeHtml(tr('secondaryOutcomes'))}</h4>
      <ul class="outcome-list">${secondaryOutcomes}</ul>
      <p class="plain-summary">${escapeHtml(tr('resultStatus', { value: study.hasResults ? tr('resultStatusYes') : tr('resultStatusNo') }))}</p>
    </section>

    <div class="detail-actions">
      <button class="${isFavorite ? 'secondary-button' : 'primary-button'}" type="button" data-favorite-id="${escapeHtml(study.nctId)}">${escapeHtml(isFavorite ? tr('favoriteRemove') : tr('followTrial'))}</button>
      <a class="secondary-button" href="${escapeHtml(safeUrl(study.sourceRecordUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(tr('openOfficial'))}</a>
    </div>
  `
}

async function openDetail(nctId, { updateHash = true } = {}) {
  const modal = $('#detail-modal')
  const snapshot = state.studies.find((study) => study.nctId === nctId) || state.favorites[nctId]?.snapshot
  modal.classList.add('open')
  modal.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')
  if (updateHash && location.hash !== `#/study/${nctId}`) history.pushState(null, '', `#/study/${nctId}`)

  if (snapshot) renderDetail(snapshot)
  else {
    $('#detail-nct').textContent = nctId
    $('#detail-title').textContent = tr('loadingDetailTitle')
    $('#detail-content').innerHTML = `<div class="detail-loading">${escapeHtml(tr('loadingDetailBody'))}</div>`
  }

  try {
    const detail = await getStudyById(nctId)
    renderDetail(detail)
    if (state.favorites[nctId]) state.favorites = replaceFavoriteSnapshot(detail)
  } catch (error) {
    if (!snapshot) $('#detail-content').innerHTML = emptyState(tr('detailFailed'), error.message || 'Could not read the official record.')
    else showToast(tr('detailSnapshot'))
  }
}

function closeDetail({ updateHash = true } = {}) {
  const modal = $('#detail-modal')
  modal.classList.remove('open')
  modal.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
  state.currentDetail = null
  if (updateHash && location.hash.startsWith('#/study/')) history.pushState(null, '', '#/trials')
}

function renderFavorites() {
  state.favorites = getFavorites()
  const entries = Object.values(state.favorites)
  const studies = entries.map((entry) => entry.snapshot).filter(Boolean)
  const changed = entries.filter((entry) => entry.lastChange).length
  const recruiting = studies.filter((study) => study.statusCode === 'RECRUITING').length
  $('#favorites-summary').innerHTML = `
    <article><strong>${numberText(studies.length)}</strong><span>${escapeHtml(tr('favoritesCount'))}</span></article>
    <article><strong>${numberText(recruiting)}</strong><span>${escapeHtml(tr('favoritesRecruiting'))}</span></article>
    <article><strong>${numberText(changed)}</strong><span>${escapeHtml(tr('favoritesChanged'))}</span></article>
  `
  $('#favorites-list').innerHTML = studies.length
    ? sortStudies(studies, 'updated-desc').map((study) => renderCard(study, { favoriteContext: true })).join('')
    : emptyState(tr('noFavoritesTitle'), tr('noFavoritesBody'), `<a class="secondary-button" href="#/trials" style="margin-top:16px;text-decoration:none">${escapeHtml(tr('backToTrials'))}</a>`)
  updateFavoriteBadge()
}

async function refreshFavorites() {
  const ids = Object.keys(getFavorites())
  if (!ids.length) return showToast(tr('noFavoritesRefresh'))
  $('#refresh-favorites-button').disabled = true
  $('#refresh-favorites-button').textContent = tr('refreshing')
  const results = await Promise.allSettled(ids.map((id) => getStudyById(id)))
  let success = 0
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      state.favorites = replaceFavoriteSnapshot(result.value)
      success += 1
    }
  })
  renderFavorites()
  $('#refresh-favorites-button').disabled = false
  $('#refresh-favorites-button').textContent = tr('refreshFavorites')
  showToast(tr('refreshedFavorites', { success, total: ids.length }))
}

function resetFilters({ includeQuery = true, rerun = true } = {}) {
  if (includeQuery) {
    state.query = ''
    $('#search-input').value = ''
  }
  state.statusCode = ''
  state.phase = ''
  state.country = ''
  state.sponsorClass = ''
  state.sortMode = 'updated-desc'
  $('#status-filter').value = ''
  $('#phase-filter').value = ''
  $('#country-filter').value = ''
  $('#sponsor-filter').value = ''
  $('#sort-filter').value = 'updated-desc'
  if (rerun) runSearch({ useCachePreview: true, scroll: true })
}

function removeFilter(key) {
  if (key === 'query') {
    state.query = ''
    $('#search-input').value = ''
    return runSearch({ scroll: true })
  }
  if (key === 'statusCode') {
    state.statusCode = ''
    $('#status-filter').value = ''
    return runSearch({ scroll: true })
  }
  if (key === 'phase') {
    state.phase = ''
    $('#phase-filter').value = ''
  }
  if (key === 'country') {
    state.country = ''
    $('#country-filter').value = ''
  }
  if (key === 'sponsorClass') {
    state.sponsorClass = ''
    $('#sponsor-filter').value = ''
  }
  renderResults()
}

function buildMobileFilters() {
  $('#mobile-filter-content').innerHTML = `
    <div class="filter-group"><label for="m-status-filter">${escapeHtml(tr('statusFilter'))}</label>${$('#status-filter').outerHTML.replace('id="status-filter"', 'id="m-status-filter"')}</div>
    <div class="filter-group"><label for="m-phase-filter">${escapeHtml(tr('phaseFilter'))}</label>${$('#phase-filter').outerHTML.replace('id="phase-filter"', 'id="m-phase-filter"')}</div>
    <div class="filter-group"><label for="m-country-filter">${escapeHtml(tr('countryFilter'))}</label>${$('#country-filter').outerHTML.replace('id="country-filter"', 'id="m-country-filter"')}</div>
    <div class="filter-group"><label for="m-sponsor-filter">${escapeHtml(tr('sponsorFilter'))}</label>${$('#sponsor-filter').outerHTML.replace('id="sponsor-filter"', 'id="m-sponsor-filter"')}</div>
    <div class="filter-group"><label for="m-sort-filter">${escapeHtml(tr('sortFilter'))}</label>${$('#sort-filter').outerHTML.replace('id="sort-filter"', 'id="m-sort-filter"')}</div>
  `
  $('#m-status-filter').value = state.statusCode
  $('#m-phase-filter').value = state.phase
  $('#m-country-filter').value = state.country
  $('#m-sponsor-filter').value = state.sponsorClass
  $('#m-sort-filter').value = state.sortMode
}

function openFilterDrawer() {
  buildMobileFilters()
  const drawer = $('#mobile-filter-drawer')
  drawer.classList.add('open')
  drawer.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')
}

function closeFilterDrawer() {
  const drawer = $('#mobile-filter-drawer')
  drawer.classList.remove('open')
  drawer.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
}

function applyMobileFilters() {
  const previousStatus = state.statusCode
  state.statusCode = $('#m-status-filter').value
  state.phase = $('#m-phase-filter').value
  state.country = $('#m-country-filter').value
  state.sponsorClass = $('#m-sponsor-filter').value
  state.sortMode = $('#m-sort-filter').value
  $('#status-filter').value = state.statusCode
  $('#phase-filter').value = state.phase
  $('#country-filter').value = state.country
  $('#sponsor-filter').value = state.sponsorClass
  $('#sort-filter').value = state.sortMode
  closeFilterDrawer()
  if (previousStatus !== state.statusCode) runSearch({ scroll: true })
  else renderResults()
}

function showView(route) {
  const routeName = route.startsWith('following') ? 'following' : route.startsWith('guide') ? 'guide' : 'trials'
  $$('.view').forEach((view) => { view.hidden = view.dataset.view !== routeName })
  $$('.desktop-nav a').forEach((link) => link.classList.toggle('active', link.dataset.nav === routeName))
  $('#mobile-menu').hidden = true
  $('#mobile-menu-button').setAttribute('aria-expanded', 'false')
  if (routeName === 'following') renderFavorites()
  if (routeName === 'trials' && !state.studies.length && !state.loading) runSearch()
}

function rerenderCurrentLanguage() {
  renderStaticText()
  renderResults()
  renderSyncTextForLanguage()
  if (!$('#following-view').hidden) renderFavorites()
  if (state.currentDetail) renderDetail(state.currentDetail)
  if ($('#mobile-filter-drawer').classList.contains('open')) buildMobileFilters()
}

function switchLanguage() {
  state.language = state.language === 'en' ? 'zh-CN' : 'en'
  saveLanguage(state.language)
  rerenderCurrentLanguage()
  showToast(state.language === 'en' ? 'English interface enabled' : '已切换为中文界面')
}

function handleRoute() {
  const route = location.hash.replace(/^#\/?/, '') || 'trials'
  showView(route)
  const studyMatch = route.match(/^study\/(NCT\d{8})$/i)
  if (studyMatch) openDetail(studyMatch[1].toUpperCase(), { updateHash: false })
  else if ($('#detail-modal').classList.contains('open')) closeDetail({ updateHash: false })
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function bindEvents() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault()
    state.query = $('#search-input').value.trim()
    runSearch({ scroll: true })
  })
  $('#refresh-button').addEventListener('click', () => runSearch({ useCachePreview: false }))
  $('#load-more-button').addEventListener('click', loadMore)
  $('#language-toggle').addEventListener('click', switchLanguage)
  $('#reset-filters').addEventListener('click', () => resetFilters())
  $('#status-filter').addEventListener('change', (event) => {
    state.statusCode = event.target.value
    runSearch({ scroll: true })
  })
  $('#phase-filter').addEventListener('change', (event) => { state.phase = event.target.value; renderResults() })
  $('#country-filter').addEventListener('change', (event) => { state.country = event.target.value; renderResults() })
  $('#sponsor-filter').addEventListener('change', (event) => { state.sponsorClass = event.target.value; renderResults() })
  $('#sort-filter').addEventListener('change', (event) => { state.sortMode = event.target.value; renderResults() })

  document.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-open-detail]')
    if (detailButton) openDetail(detailButton.dataset.openDetail)
    const favoriteButton = event.target.closest('[data-favorite-id]')
    if (favoriteButton) toggleFavorite(favoriteButton.dataset.favoriteId)
    const removeButton = event.target.closest('[data-remove-filter]')
    if (removeButton) removeFilter(removeButton.dataset.removeFilter)
    if (event.target.closest('[data-reset-all]')) resetFilters()
  })

  $$('.modal-close, .modal-backdrop').forEach((button) => button.addEventListener('click', () => closeDetail()))
  $('#mobile-filter-button').addEventListener('click', openFilterDrawer)
  $$('.drawer-close, .drawer-backdrop').forEach((button) => button.addEventListener('click', closeFilterDrawer))
  $('#mobile-apply-filters').addEventListener('click', applyMobileFilters)
  $('#mobile-reset-filters').addEventListener('click', () => {
    state.statusCode = ''
    state.phase = ''
    state.country = ''
    state.sponsorClass = ''
    state.sortMode = 'updated-desc'
    buildMobileFilters()
  })
  $('#refresh-favorites-button').addEventListener('click', refreshFavorites)
  $('#mobile-menu-button').addEventListener('click', () => {
    const menu = $('#mobile-menu')
    const open = menu.hidden
    menu.hidden = !open
    $('#mobile-menu-button').setAttribute('aria-expanded', String(open))
  })
  $('#clear-local-data').addEventListener('click', () => {
    if (!confirm(tr('confirmClear'))) return
    clearAllLocalData()
    state.favorites = {}
    state.studies = []
    updateFavoriteBadge()
    showToast(tr('localCleared'))
    if (!$('#following-view').hidden) renderFavorites()
    else runSearch({ useCachePreview: false })
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if ($('#detail-modal').classList.contains('open')) closeDetail()
      if ($('#mobile-filter-drawer').classList.contains('open')) closeFilterDrawer()
    }
  })
  window.addEventListener('hashchange', handleRoute)
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return
  try { await navigator.serviceWorker.register('./sw.js') } catch (error) { console.warn('Service worker registration failed:', error) }
}

function init() {
  renderStaticText()
  bindEvents()
  updateFavoriteBadge()
  state.versionPromise = getApiVersion()
  handleRoute()
  registerServiceWorker()
}

init()
