export default {
  getUser(id) {
    return this.client.getUserByID(id)
  },

  getUserByName(name) {
    return this.client.getUserByName(name)
  },

  getChannel(id) {
    return this.client.getChannelGroupOrDMByID(id)
  },

  getChannelByName(name) {
    return this.client.getChannelByName(name)
  },

  canExecute(message) {
    return true
  }
}
