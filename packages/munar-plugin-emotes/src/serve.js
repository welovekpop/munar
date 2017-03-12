import truncate from 'truncate-url'

export function renderEmotesList (emotes) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://unpkg.com/tachyons@4.6.1/css/tachyons.min.css">
    </head>
    <body class="bg-dark-gray near-white mh5 mv3">
      <table class="collapse" style="margin: auto">
        <thead><tr>
          <th class="pv2 ph3 ttu">Name</th>
          <th class="pv2 ph3 ttu">URL</th>
        </tr></thead>
        <tbody>
          ${emotes.map((emote) => `
            <tr class="stripe-dark">
              <td class="pv2 ph3">${emote.id}</td>
              <td class="pv2 ph3">
                <a href="${emote.url}" title="${emote.url}" class="link dim light-pink" target="_blank">
                  ${truncate(emote.url, 50)}
                </a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `.replace(/\s+/g, ' ')
}
