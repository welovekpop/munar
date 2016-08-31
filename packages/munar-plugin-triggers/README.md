# munar-plugin-triggers

[Munar] plugin for simple custom commands ("triggers").

## Installation

```shell
npm install --save munar-plugin-triggers
```

## Usage

```js
{
  "plugins": [
    "triggers"
  ]
}
```

## Triggers

Add custom triggers using `!trigger !triggername "response text"`.

Delete custom triggers using `!deltrigger !triggername`.

Use custom triggers using `!triggername`.

The response text can contain some variables:

| Variable | Substitution |
|----------|--------------|
| `$user` | Name of the user who used the trigger. |
| `$bot` | Name of the bot user. |
| `$anyone` | Name of a random user in the channel the trigger was used in. |
| `$target` | Name of the user this trigger was directed at, when used as `!triggername @targetUser`. Defaults to the name of the user who used the trigger if they did not enter a target. |
| `$target{default}` | Name of the user this trigger was directed at, but with a custom default if no target was entered. e.g., `$target{nobody}` to print "nobody", or `$target{$anyone}` to default to a random user. |

## License

[ISC]

[Munar]: http://munar.space
[ISC]: ../../LICENSE
