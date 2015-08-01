const Sekshi = require('./Sekshi')
const config = require('../config.json')
const debug = require('debug')('sekshi:app')
const pkg = require('../package.json')

function start() {
  const sekshi = new Sekshi(config)

  sekshi.start(require('../creds.json'))

  let timeout
  const onError = e => {
    console.error(e.stack || e)
    sekshi.stop(() => {
      console.error('stopped.')
      process.exit(1)
    })
  }

  sekshi.on(sekshi.CONN_ERROR, e => {
    console.error('connection error')
    onError(e)
  })
  sekshi.on(sekshi.SOCK_ERROR, e => {
    console.error('connection error')
    onError(e)
  })
  sekshi.on(sekshi.LOGIN_ERROR, e => {
    console.error('login error')
    onError(e)
  })

  sekshi.on(sekshi.CONN_PART, e => {
    console.error('connection parted')
    onError(e)
  })

  sekshi.on(sekshi.CONN_WARNING, warning => {
    console.warn('connection warning', warning)
  })

  process.on('uncaughtException', e => {
    console.error('uncaught exception')
    onError(e)
  })

  sekshi.on(sekshi.JOINED_ROOM, room => {
    if (room && process.argv[2] !== 'silent') {
      sekshi.sendChat(`/me SekshiBot v${pkg.version} started!`)
    }
    else if (!room) {
      console.error('join error')
      onError({})
    }
  })
}

start()
