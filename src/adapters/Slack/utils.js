export function linkNames(slack, text) {
  return text
    .replace(/@(channel|everyone|group|here)/g, (match, name) => `<!${name}|${name}>`)
    .replace(/@([\w_-]+)/g, (match, name) => {
      const user = slack.getUserByName(name)
      return user ? `<@${user.id}|${name}>` : match
    })
    .replace(/#([\w_-]+)/g, (match, name) => {
      const channel = slack.getChannelByName(name)
      return channel ? `<#${channel.id}|${name}>` : match
    })
}
