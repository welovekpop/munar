import html from 'bel'
import parse from 'u-wave-parse-chat-markup'
import emoji from 'node-emoji'

function Markup (text) {
  return compile(parse(text))

  function compile (node) {
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(compile)
    switch (node.type) {
      case 'mention': return `@${node.user || node.group}`
      case 'link': return html`<a class="link dim light-pink" href=${node.href}>${node.text}</a>`
      case 'emoji': return emoji.get(node.name) || `:${node.name}:`
      case 'italic': return html`<i>${compile(node.content)}</i>`
      case 'bold': return html`<b>${compile(node.content)}</b>`
      case 'strike': return html`<s>${compile(node.content)}</s>`
      case 'code': return html`<span class="code">${compile(node.content)}</span>`
      return compile(node.content)
    }
  }
}

function TriggerRow ({ trigger, triggerCharacter }) {
  return html`
    <tr class="stripe-dark">
      <td class="pv2 ph3 trigger code">
        ${triggerCharacter}${trigger._id}
      </td>
      <td class="pv2 ph3 response">
        ${Markup(trigger.response)}
      </td>
    </tr>
  `
}

export function renderTriggers ({ triggerCharacter, triggers }) {
  return html`
    <html>
      <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="https://unpkg.com/tachyons@4.6.1/css/tachyons.min.css">
      </head>
      <body class="bg-dark-gray near-white mh5 mv3">
        <table class="collapse" style="margin: auto">
          <thead><tr>
            <th class="pv2 ph3 ttu">Trigger</th>
            <th class="pv2 ph3 ttu">Response</th>
          </tr></thead>
          <tbody>
            ${triggers.map((trigger) => TriggerRow({ trigger, triggerCharacter }))}
          </tbody>
        </table>
      </body>
    </html>
  `.toString()
}
