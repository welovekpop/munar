import { Plugin, command } from 'munar-core'

function stringifyArgument (type, index) {
  let message = type._flags.label
  if (type._description) {
    message += ` - ${type._description}`
  }
  if (type._flags.presence === 'required') {
    message += ' (required)'
  }

  return message
}

export default class Usage extends Plugin {
  getCommand (commandName) {
    const plugins = this.bot.plugins.loaded()
    for (const pluginName of plugins) {
      const plugin = this.bot.plugins.get(pluginName)
      const command = plugin &&
        plugin.commands.find((com) => com.names.includes(commandName))
      if (command) {
        return command
      }
    }
  }

  @command('help', {
    description: 'Show help text for Munar commands.',
    arguments: [
      command.arg.string().required()
        .description('The name of the command.')
    ]
  })
  showHelp (message, commandName) {
    const command = this.getCommand(commandName)
    if (command) {
      const { trigger } = this.bot.options
      const description = command.description || '(No description specified)'

      let usageString = `${trigger}${commandName}`
      command.arguments.forEach((type) => {
        usageString += ` <${type._flags.label}>`
      })

      const title = `\`${usageString}\` - ${description}`
      const argumentDescriptions = command.arguments
        .map(stringifyArgument)
        .map((descr, i) => `${i + 1}. ${descr}`)
        .join('\n')

      message.reply(title, command.arguments.length > 0 ? {
        attachments: [
          {
            title: 'Arguments',
            fallback: argumentDescriptions,
            text: argumentDescriptions
          }
        ]
      } : {})
    }
  }
}
