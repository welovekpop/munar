# munar-plugin-reddit-feed

[Munar] plugin that posts about new Reddit posts.

## Installation

```shell
npm install --save munar-plugin-reddit-feed
```

## Usage

```js
{
  "plugins": [
    ["reddit-feed", {
      // Subreddits to poll. Required.
      "subreddits": ["listentothis", "subredditsimulator"],

      // Channel to send new posts to. Required.
      "output": "slack:random",

      // Message template for new post notifications. "$property" is substituted
      // with the corresponding property on the reddit post object. Some
      // commonly useful examples:
      //   $subreddit - Name of the sub that this post was submitted to.
      //   $title - Post title.
      //   $author - Username of the submitter.
      //   $permalink - Link to the post, excluding "https://reddit.com/".
      //   $id - Post ID, for short links like "https://redd.it/$id".
      // Defaults to:
      "template": "[r/$subreddit] $title https://redd.it/$id",

      // Interval in seconds between polls. Defaults to 60 seconds.
      "interval": 60
    }]
  ]
}
```

## License

[ISC]

[Munar]: http://munar.space
[ISC]: ../../LICENSE
