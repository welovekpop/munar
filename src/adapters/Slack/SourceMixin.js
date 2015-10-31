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

  canExecute(message) {
    return true
  }
}
