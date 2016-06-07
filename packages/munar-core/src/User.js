export default class User {
  constructor (source, id, username, sourceUser) {
    this.source = source
    this.id = id
    this.username = username
    this.sourceUser = sourceUser
  }

  compoundId () {
    const adapter = this.source.getAdapterName()
    return {
      adapter,
      sourceId: this.id
    }
  }
}
