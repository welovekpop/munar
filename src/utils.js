const moment = require('moment')

const SPANS = {
  d: 24,
  w: 24 * 7,
  m: 24 * 30
}

export function spanToTime(span) {
  if (span === 'f') {
    return moment(0)
  }

  let hours = span in SPANS ? SPANS[span] : span
  if (typeof hours === 'string' && /^\d+$/.test(hours)) {
    hours = parseInt(hours, 10)
  }
  return moment().subtract(hours, 'hours')
}

export function times(x) {
  return x === 1 ? 'once'
       : x === 2 ? 'twice'
       : x >=  3 ? `${x} times`
       : ''
}

export function days(h) {
  if (h <= 24 || (h < 48 && h % 24 !== 0)) {
    return h === 1 ? 'hour' : `${h} hours`
  }
  const x = Math.floor(h / 24)
  return x === 1 ? 'day' : `${x} days`
}

export function joinList(args, sep = ', ', lastSep = ' and ') {
  let tail = args.pop()
  let head = args.join(sep)
  return head ? head + lastSep + tail : tail
}

// channel names that we can auto-fix
const LOENENT = /^loenent|1theK \(.*?\)|LOEN MUSIC Official Channel \(.*?\)$/i
const SMENT = /^sment|smtown$/i
// random stuff
const MV = /Music ?Video/i
const MVPREFIX = /^\[M\/?V\] ?/i
const MVSUFFIX = /\(?(?:(?:Off?icial)? ?Music ?Video|M\/?V)\)?$/i
const FEATURING = /Feat(?:uring)?|With/i
const TEASER = /^\s*\[Teaser\]\s*/i

export function fixTags(at) {
  let author = at.author.trim()
  let title = at.title.trim()

  if (author === '' || author === '?' ||
      SMENT.test(author) || LOENENT.test(author)) {
    let parts = title.split(' _ ') // mostly loenent
    if (parts.length === 1) parts = title.split('_') // mostly sment
    if (parts.length > 1) {
      if (parts.length > 2) {
        let last = parts.pop().trim()
        // drop things like "Music Video", "MusicVideo", but  keep things like
        // "Dance Practice", and "Music Video (feat. X)", in brackets
        if (!MV.test(last) || FEATURING.test(last)) {
          parts[parts.length - 1] = parts[parts.length - 1] + ` (${last})`
        }
      }
      author = parts[0].trim()
      title = parts.slice(1).join('_').trim()
    }
  }

  title = title.replace(MVSUFFIX, '')

  author = author.replace(MVPREFIX, '')
  if (TEASER.test(author)) {
    author = author.replace(TEASER, '')
    title += ' (Teaser)'
  }

  author = author.trim()
  title = title.trim()

  return { author, title }
}
