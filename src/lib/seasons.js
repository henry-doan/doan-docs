/**
 * The season (northern hemisphere) and any holiday for a date, and what
 * drifts across the desk for it. Add `?season=winter` (or a holiday id such
 * as `halloween`) to the address to preview one.
 */

const SEASONS = {
  winter: { id: 'winter', particles: 'snow' },
  spring: { id: 'spring', particles: 'petals' },
  summer: { id: 'summer', particles: 'fireflies' },
  autumn: { id: 'autumn', particles: 'leaves' },
}

const SEASON_BY_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter']

/** Months count from 0; `days` is an inclusive range. */
const HOLIDAYS = [
  { id: 'new-year', month: 0, days: [1, 1], message: 'Happy New Year', particles: 'confetti' },
  { id: 'valentines', month: 1, days: [14, 14], message: 'Happy Valentine’s Day', particles: 'hearts' },
  { id: 'halloween', month: 9, days: [31, 31], message: 'Happy Halloween', particles: 'bats' },
  { id: 'christmas', month: 11, days: [24, 26], message: 'Merry Christmas', particles: 'snow' },
  { id: 'new-years-eve', month: 11, days: [31, 31], message: 'Happy New Year’s Eve', particles: 'confetti' },
]

const holidayOn = (date) =>
  HOLIDAYS.find(({ month, days: [from, to] }) => date.getMonth() === month && date.getDate() >= from && date.getDate() <= to) ?? null

/** `{ season, holiday, particles }` for today, or for the `?season=` preview. */
export const currentSeason = (date = new Date()) => {
  const preview = new URLSearchParams(window.location.search).get('season')
  const previewHoliday = HOLIDAYS.find((holiday) => holiday.id === preview) ?? null
  const holiday = previewHoliday ?? (SEASONS[preview] ? null : holidayOn(date))
  const season = SEASONS[preview] ?? SEASONS[SEASON_BY_MONTH[(previewHoliday ? new Date(2000, previewHoliday.month) : date).getMonth()]]
  return { season: season.id, holiday, particles: holiday?.particles ?? season.particles }
}
