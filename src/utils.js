const moment = require('moment')

const SPANS = {
  d: 24,
  w: 24 * 7,
  m: 24 * 30
}

exports.spanToTime = function (span) {
  if (span === 'f') {
    return moment(0)
  }

  let hours = span in SPANS ? SPANS[span] : span
  if (typeof hours === 'string' && /^\d+$/.test(hours)) {
    hours = parseInt(hours, 10)
  }
  return moment().subtract(hours, 'hours')
}

exports.times = function (x) {
  return x === 1 ? 'once'
       : x === 2 ? 'twice'
       : x >=  3 ? `${x} times`
       : ''
}

exports.days = function (h) {
  if (h <= 24 || (h < 48 && h % 24 !== 0)) {
    return h === 1 ? 'hour' : `${h} hours`
  }
  const x = Math.floor(h / 24)
  return x === 1 ? 'day' : `${x} days`
}

exports.joinList = function (args, sep = ', ', lastSep = ' and ') {
  let tail = args.pop()
  let head = args.join(sep)
  return head ? head + lastSep + tail : tail
}
