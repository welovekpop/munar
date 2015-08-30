const { Buffer } = require('buffer')
const moment = require('moment')
const { decode } = require('plugged/utils')

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
//=====================================================
//============== time input multi-parser ==============
export function spanToTime(span) {
  span = span.trim()
  // Don't fix what ain't broken
  if (span === 'f') {
    return moment(0)
  }

  let toRemove = {
    years: 0,
    months: 0,
    weeks:0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  }

  if(typeof span === 'string' && /^[\s|\d|y|M|w|d|h|m|s]*$/.test(span)){
    // ================== Complex Parse Start ==========================
    let choppedSpan = span.split('').filter(function(n){ return n !== ' ' })

    // This is helpful if things go bad.
    //console.log(choppedSpan);

    while(choppedSpan.length !== 0) {
      // This recipe has two ingredients:
      // First, we get a number.
      let timeAmount = ''
      while(/^\d+$/.test(choppedSpan[0]) && choppedSpan.length !== 0) {
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
  return toRemove
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

// inverse of plugged's decode utility
export function encode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&#34;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// attempt to split chat messages for plug without messing up the contents
export function splitMessageSemiProperlyMaybe(string, chunkSize = 250) {
  let parts = []
  // HTML-encode everything first, because plug truncates messages _after_
  // encoding (WTF‽)
  string = encode(string)
  // Plug also doesn't do a very good job of truncating messages with
  // multibyte characters, so we attempt to do something silly here that
  // sorta kinda wraps words before 250 bytes
  // It's not very good because I don't know how this should be done
  let buffer = new Buffer(string, 'utf8')
  let i = 0
  while (i < buffer.length) {
    let end = i + chunkSize
    if (end < buffer.length) {
      // search for last whitespace (just space lol.)
      while (buffer[end] !== 0x20 && end > i) {
        end--
      }
      if (end === 0) {
        // I DON'T KNOW WHAT TO DO
        // this breaks if it ends up in the middle of an HTML-encoded char
        // but what can you do *shrug* (at least it's not very likely to
        // happen!)
        end = i + chunkSize
      }
    }
    parts.push(buffer.slice(i, end))
    i += end
  }
  // stringify and decode stuff again
  return parts.map(buf => decode(buf.toString('utf8')).replace(/\\"/g, '"'))
}

export function joinList(args, sep = ', ', lastSep = ' and ') {
  let tail = args.pop()
  let head = args.join(sep)
  return head ? head + lastSep + tail : tail
}

export function roleName(role) {
  return 'user, resident DJ, bouncer, manager, cohost, host'.split(', ')[role]
}

// channel names that we can auto-fix
const LOENENT = /^loenent|1theK \(.*?\)|LOEN MUSIC Official Channel \(.*?\)$/i
const SMENT = /^sment|smtown$/i
// random stuff
const MV = /Music ?Video/i
const MVPREFIX = /^\[M\/?V\] ?/i
const FEATURING = /Feat(?:uring)?|With/i
const TEASER = /^\s*\[?(?:M\/?V\s*)?Teaser\]?\s*/i

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

  // taken from
  // https://github.com/brooke/Chrome-Last.fm-Scrobbler/blob/5c45a3b/connectors/youtube.js#L186-L216
  title = title
    .replace(/\s*\*+\s?\S+\s?\*+$/, '') // **NEW**
    .replace(/\s*\[[^\]]+\]$/, '') // [whatever]
    .replace(/\s*\[\s*(M\/?V)\s*\]/, '') // [MV] or [M/V]
    .replace(/\s*\(\s*(M\/?V)\s*\)/, '') // (MV) or (M/V)
    .replace(/[\s\-–_]+(M\/?V)\s*/, '') // MV or M/V
    .replace(/\s*\([^\)]*ver(\.|sion)?\s*\)$/i, '') // (whatever version)
    .replace(/\s*[a-z]*\s*ver(\.|sion)?$/i, '') // ver. and 1 word before (no parens)
    .replace(/\s*\.(avi|wmv|mpg|mpeg|flv)$/i, '') // video extensions
    .replace(/\s*(of+icial\s*)?(music\s*)?video/i, '') // (official)? (music)? video
    .replace(/\s*(ALBUM TRACK\s*)?(album track\s*)/i, '') // (ALBUM TRACK)
    .replace(/\s*\(\s*of+icial\s*\)/i, '') // (official)
    .replace(/\s*\(\s*[0-9]{4}\s*\)/i, '') // (1999)
    .replace(/\s+\(\s*(HD|HQ)\s*\)$/, '') // HD (HQ)
    .replace(/[\s\-–_]+(HD|HQ)\s*$/, '') // HD (HQ)
    .replace(/\s*video\s*clip/i, '') // video clip
    .replace(/\s+\(?live\)?$/i, '') // live
    .replace(/\(\s*\)/, '') // Leftovers after e.g. (official video)
    .replace(/^(|.*\s)"(.*)"(\s.*|)$/, '$2') // Artist - The new "Track title" featuring someone
    .replace(/^(|.*\s)'(.*)'(\s.*|)$/, '$2') // 'Track title'
    .replace(/^[\/\s,:;~\-–_\s"]+/, '') // trim starting white chars and dash
    .replace(/[\/\s,:;~\-–_\s"\s!]+$/, '') // trim trailing white chars and dash

  author = author
    .replace(/\s*[0-1][0-9][0-1][0-9][0-3][0-9]\s*/, '') // date formats ex. 130624
    .replace(/\[\s*(1080|720)p\s*\]/i, '') // [1080p]
    .replace(/\[\s*(M\/?V)\s*\]/, '') // [MV] or [M/V]
    .replace(/\(\s*(M\/?V)\s*\)/, '') // (MV) or (M/V)
    .replace(/\s*(M\/?V)\s*/, '') // MV or M/V
    .replace(/^[\/\s,:;~\-–_\s"]+/, '') // trim starting white chars and dash
    .replace(/[\/\s,:;~\-–_\s"\s!]+$/, '') // trim trailing white chars and dash

  author = author.replace(MVPREFIX, '')
  if (TEASER.test(author)) {
    author = author.replace(TEASER, '')
    title += ' (Teaser)'
  }

  author = author.trim()
  title = title.trim()

  return { author, title }
}

// Taken from the plug.dj app source code
export const emojiAliases = {
  '<3': 'heart',
  ':o)': 'monkey_face',
  ':*': 'kissing',
  ':-*': 'kissing',
  '</3': 'broken_heart',
  '<\\3': 'broken_heart',
  '=)': 'smiley',
  '=-)': 'smiley',
  ':D': 'smile',
  ':-D': 'smile',
  ':->': 'laughing',
  'XD': 'laughing',
  ';)': 'wink',
  ';-)': 'wink',
  ':)': 'blush',
  '(:': 'blush',
  ':-)': 'blush',
  ':s': 'confounded',
  '8)': 'sunglasses',
  '8|': 'flushed',
  ':|': 'neutral_face',
  ':-|': 'neutral_face',
  ':\\': 'confused',
  ':-\\': 'confused',
  ':/': 'confused',
  ':-/': 'confused',
  ':p': 'stuck_out_tongue',
  ':-p': 'stuck_out_tongue',
  ':P': 'stuck_out_tongue',
  ':-P': 'stuck_out_tongue',
  ':b': 'stuck_out_tongue',
  ':-b': 'stuck_out_tongue',
  ';p': 'stuck_out_tongue_winking_eye',
  ';-p': 'stuck_out_tongue_winking_eye',
  ';b': 'stuck_out_tongue_winking_eye',
  ';-b': 'stuck_out_tongue_winking_eye',
  ';P': 'stuck_out_tongue_winking_eye',
  ';-P': 'stuck_out_tongue_winking_eye',
  '):': 'disappointed',
  ':(': 'disappointed',
  ':-(': 'disappointed',
  '>:(': 'angry',
  '>:-(': 'angry',
  'D:': 'anguished',
  ':o': 'open_mouth',
  ':-o': 'open_mouth',
  '>XD': 'astonished',
  ':$': 'confused',
  'X$': 'confounded',
  ':~(': 'cry',
  ':[': 'disappointed',
  ':~[': 'disappointed_relieved',
  'XO': 'dizzy_face',
  ':#': 'grimacing',
  '<3)': 'heart_eyes',
  'O:)': 'innocent',
  ':~)': 'joy',
  ':<3': 'kissing_heart',
  'X<3': 'kissing_closed_eyes',
  ':O': 'open_mouth',
  ':-O': 'open_mouth',
  'Z:|': 'sleeping',
  'T_T': 'sob',
  'X-P': 'stuck_out_tongue_closed_eyes',
  'B-)': 'sunglasses',
  '~:(': 'sweat',
  '~:)': 'sweat_smile',
  'XC': 'tired_face',
  '>:/': 'unamused'
}
