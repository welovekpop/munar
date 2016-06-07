import requireRelative from 'require-relative'

export default async function run (opts, dirname = __dirname) {
  const adapters = opts.adapters || []
  const plugins = opts.plugins || []

  const Munar = requireRelative('munar-core', dirname).default

  const bot = new Munar(opts)

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
