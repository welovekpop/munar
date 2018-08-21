/* global describe, expect, it */
import isSameSong from '../isSameSong'

function s (start, end) {
  return {
    sourceType: 'test',
    sourceID: 'test',
    start,
    end
  }
}

describe('isSameSong', () => {
  it('returns false for different media', () => {
    expect(isSameSong({
      sourceType: 'uwave',
      sourceID: 'abc'
    }, {
      sourceType: 'uwave',
      sourceID: 'def'
    })).toBe(false)
    expect(isSameSong({
      sourceType: 'uwave',
      sourceID: 'abc'
    }, {
      sourceType: 'plugdj',
      sourceID: 'abc'
    })).toBe(false)
    expect(isSameSong({
      sourceType: 'uwave',
      sourceID: 'abc'
    }, {
      sourceType: 'plugdj',
      sourceID: 'def'
    })).toBe(false)
  })

  it('returns false for non overlapping songs', () => {
    expect(isSameSong(s(0, 10), s(11, 21))).toBe(false)
    expect(isSameSong(s(0, 10), s(10, 20))).toBe(false)
    expect(isSameSong(s(0, 10), s(7, 20))).toBe(false)
    expect(isSameSong(s(10, 20), s(0, 10))).toBe(false)
    expect(isSameSong(s(100, 150), s(0, 10))).toBe(false)
    expect(isSameSong(s(0, 20), s(180, 200))).toBe(false)
    expect(isSameSong(s(10, 20), s(0, 15))).toBe(false)
  })

  it('returns true for overlapping songs', () => {
    // entirely contained
    expect(isSameSong(s(0, 20), s(10, 20))).toBe(true)
    expect(isSameSong(s(10, 20), s(0, 20))).toBe(true)
    // > ⅔ contained
    expect(isSameSong(s(0, 100), s(20, 200))).toBe(true)
  })
})
