const SekshiModule = require('../Module')

export default class Test extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'test'
    this.author = 'test'
    this.version = 'test'

    super(sekshi, options)

    this.permissions = {
      test: sekshi.USERROLE.MANAGER
    }
  }

  test(user) {
    this.sekshi.sendChat('Test!')
  }

}