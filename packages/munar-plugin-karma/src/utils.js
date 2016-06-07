import moment from 'moment'

// converts user input into moments.js input
const SPANS = {
  y: 'years',
  M: 'months',
  w: 'weeks',
  d: 'days',
  h: 'hours',
  m: 'minutes',
  s: 'seconds'
}

// time input multi-parser
export function spanToTime (span) {
  span = span.trim()
  // Don't fix what ain't broken
  if (span === 'f') {
    return moment(0)
  }

  let toRemove = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  }

  if (typeof span === 'string' && /^[\s|\d|y|M|w|d|h|m|s]*$/.test(span)) {
    // ================== Complex Parse Start ==========================
    let choppedSpan = span.split('').filter((n) => n !== ' ')

    while (choppedSpan.length !== 0) {
      // This recipe has two ingredients:
      // First, we get a number.
      let timeAmount = ''
      while (/^\d+$/.test(choppedSpan[0]) && choppedSpan.length !== 0) {
        timeAmount = timeAmount + choppedSpan.shift()
      }
      timeAmount = (timeAmount !== '') ? parseInt(timeAmount, 10) : 1

      // Then, we get a letter.
      let timeSize = (choppedSpan.length !== 0) ? choppedSpan.shift() : 'd'

      // Finally, we mash them together.
      toRemove[SPANS[timeSize]] = toRemove[SPANS[timeSize]] + timeAmount
    }
  } else {
    // Nothing happens here and if it does I'd rather not talk about it.
  }

  // Fin
  return moment().subtract(toRemove)
}

export function days (h) {
  if (h <= 24 || (h < 48 && h % 24 !== 0)) {
    return h === 1 ? 'hour' : `${h} hours`
  }
  const x = Math.floor(h / 24)
  return x === 1 ? 'day' : `${x} days`
}
