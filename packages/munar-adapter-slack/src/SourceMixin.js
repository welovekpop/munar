import Channel from './Channel'

export default {
  getChannel (id) {
    return new Channel(this, this.client.getChannelGroupOrDMByID(id))
  },

  getChannelByName (name) {
    return new Channel(this, this.client.getChannelByName(name))
  },

  canExecute (message) {
    return true
  }
}
