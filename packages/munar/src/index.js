import { Munar } from 'munar-core'

export default async function run (opts) {
  const adapters = opts.adapters || []
  const plugins = opts.plugins || []
  const mongoUri = opts.mongo || 'mongodb://localhost:27017/munar'

  const bot = new Munar({
    mongo: mongoUri
  })

  bot.use('system', { enable: true })

  adapters.forEach((adapterArr) => {
    let adapter
    let options = {}
    if (Array.isArray(adapterArr)) {
      [ adapter, options ] = adapterArr
    } else {
      adapter = adapterArr
    }

    if (typeof adapter === 'string') {
      adapter = require(`munar-adapter-${adapter}`)
    }
    adapter = adapter.default || adapter

    bot.adapter(adapter, options)
  })

  plugins.forEach((pluginArr) => {
    let plugin
    let options = {}
    if (Array.isArray(pluginArr)) {
      [ plugin, options ] = pluginArr
    } else {
      plugin = pluginArr
    }

    bot.use(plugin, options)
  })

  await bot.start()
}
