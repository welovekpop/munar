export default function isSameSong (a, b) {
  // TODO abstract into a Media interface with an `isSameSong`-like method?
  if (a.sourceType !== b.sourceType || a.sourceID !== b.sourceID) {
    return false
  }

  // üWave medias have a start and end property, so an object with the same
  // sourceType and sourceID can still contain different songs. We'll assume
  // (quite arbitrarily) that anything that has a 2/3rds overlap in start/end
  // times is the same song.
  if ('start' in a && 'end' in a && 'start' in b && 'end' in b) {
    const duration = Math.min(b.end - b.start, a.end - a.start)
    let overlap = 0
    if (b.start >= a.start && b.start <= a.end) {
      // aaaaaaa
      //    bbbbbbb
      overlap = a.end - b.start
    } else if (b.end >= a.start && b.end <= a.end) {
      //    aaaaaaa
      // bbbbbbb
      overlap = b.end - a.start
    }
    if (overlap / duration < 2 / 3) {
      return false
    }
  }

  return true
}
