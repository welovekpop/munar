import delay from 'delay'

const supportsBoothSkipping = (adapter) =>
  typeof adapter.getDJBooth === 'function' &&
  typeof adapter.getDJBooth().skip === 'function'
const supportsBoothLockskipping = (adapter) =>
  typeof adapter.getDJBooth === 'function' &&
  typeof adapter.getDJBooth().lockskip === 'function'

export default async function lockskip (adapter, { position = 1 } = {}) {
  if (supportsBoothLockskipping(adapter)) {
    const booth = adapter.getDJBooth()
    await booth.lockskip({ position })
  } else if (supportsBoothSkipping(adapter)) {
    // Attempt to lockskip manually.
    const booth = adapter.getDJBooth()
    const waitlist = adapter.getWaitlist()
    const dj = await booth.getDJ()
    // Find the waitlist length to determine whether the DJ should be moved
    // after being skipped, or default to always moving the DJ to the lockskip
    // position.
    const waitlistLength = typeof waitlist.all === 'function'
      ? (await waitlist.all()).length
      : Infinity
    // Attempt to lockskip manually.
    await booth.skip()
    if (waitlistLength > position) {
      await delay(1000)
      await waitlist.move(dj.id, position)
    }
  } else {
    throw new Error('Adapter does not support booth skipping.')
  }
}
