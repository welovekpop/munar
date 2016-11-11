/* global jest, expect, it */
import lockskip from '../'

it('uses an adapter\'s lockskip method if available', async () => {
  const booth = {
    lockskip: jest.fn().mockReturnValue(Promise.resolve())
  }
  const adapter = {
    getDJBooth: jest.fn().mockReturnValue(booth)
  }

  await lockskip(adapter, { position: 2 })

  expect(booth.lockskip).toHaveBeenCalledWith(
    { position: 2 }
  )
})

it('moves the old DJ in the waitlist manually', async () => {
  const booth = {
    getDJ: jest.fn()
      .mockReturnValueOnce({ id: 1, username: 'Abc' })
      .mockReturnValueOnce({ id: 2, username: 'Def' }),
    skip: jest.fn(() => Promise.resolve())
  }
  const waitlist = {
    move: jest.fn(() => Promise.resolve())
  }
  const adapter = {
    getDJBooth: jest.fn(() => booth),
    getWaitlist: jest.fn(() => waitlist)
  }

  await lockskip(adapter, { position: 1 })

  expect(booth.skip).toHaveBeenCalled()
  expect(waitlist.move).toHaveBeenCalled()
})

it('gives a useful error message if the adapter does not support skipping DJ Booths', async () => {
  let threw = 0
  try {
    await lockskip({})
  } catch (e) {
    expect(e.message).toMatch(/does not support booth skipping/)
    threw += 1
  }

  const booth = {
    skip: 'not a function'
  }
  const adapter = {
    getDJBooth: jest.fn(() => booth)
  }

  try {
    await lockskip(adapter)
  } catch (e) {
    expect(e.message).toMatch(/does not support booth skipping/)
    threw += 1
  }

  expect(threw).toBe(2)
})
