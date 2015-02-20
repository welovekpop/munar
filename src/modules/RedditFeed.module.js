var Snoocore = require("snoocore");
var when = require("when");
var util = require("util");

function RedditFeed(bot) {
    this.bot = bot;

    this.permissions = {
        "addsubreddit": bot.USERROLE.MANAGER,
        "removesubreddit": bot.USERROLE.MANAGER,
        "listsubreddits": bot.USERROLE.NONE,
        "setfeedinterval": bot.USERROLE.COHOST
    };

    this.timer = -1;
    this.settings = {
        "subreddits": ["kpop"],
        "interval": 300000,
        "format": "%feed | %title by %submitter | %link"
    };
    this.reddit = new Snoocore({ userAgent: "RedditFeed v" + this.version + " by /u/schrobby" });
    this.lastPost = "";

    if (this.areSettingsValid())
        this.timer = setTimeout(this.runTimer.bind(this), 0);
}

RedditFeed.prototype.destroy = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = -1;
    }
}

RedditFeed.prototype.name = "RedditFeed";
RedditFeed.prototype.author = "schrobby";
RedditFeed.prototype.version = "0.2.0";
RedditFeed.prototype.description = "Announces new submissions from a configurable list of subreddits.";

RedditFeed.prototype.setfeedinterval = function(user, interval) {
    this.settings["interval"] = interval;
};

RedditFeed.prototype.addsubreddit = function(user, subreddit) {
    subreddit = subreddit.toLowerCase();
    for(var i = this.settings["subreddits"].length - 1; i >= 0; i--) {
        if(this.settings["subreddits"][i].toLowerCase() === subreddit) {
            this.bot.sendChat(['@', user.username, " this subreddit is already registered!"].join(''));
            return;
        }
    }

    this.settings["subreddits"].push(subreddit);
};

RedditFeed.prototype.removesubreddit = function(user, subreddit) {
    subreddit = subreddit.toLowerCase();
    for(var i = this.settings["subreddits"].length - 1; i >= 0; i--) {
        if(this.settings["subreddits"][i].toLowerCase() === subreddit) {
            this.settings["subreddits"].splice(i, 1);
            this.bot.sendChat(['@', user.username, " removed subreddit: ", subreddit].join(''));
            return;
        }
    }

    this.bot.sendChat(['@', user.username, " this subreddit is not registered!"].join(''));
};

RedditFeed.prototype.listsubreddits = function(user) {
    var subreddits = ["registered subreddits: "];

    for(var i = this.settings["subreddits"].length - 1; i >= 0; i--) {
        subreddits.push(this.settings["subreddits"][i]);

        if(i > 0)
            subreddits.push(" :white_small_square: ");
    }

    this.bot.sendChat(subreddits.join(''));
};

RedditFeed.prototype.runTimer = function() {
    var subs = this.settings["subreddits"];
    var promises = [];
    var posts = [];
    var reqs = [];
    var chunk = 50;

    for (var i=0, j=subs.length; i<j; i+=chunk) {
        reqs.push(subs.slice(i, i+chunk).join('+'));
    }

    reqs.forEach(function(uri) {
        var promise = this.reddit("/r/$subreddit/new").listing({
            $subreddit: uri,
            before: this.lastPost,
            limit: 100
        }).then(function(result) {
            posts = posts.concat(result.children);
        }).catch(function(error) {
            console.error(error);
        });

        promises.push(promise);
    }.bind(this));

    when.all(promises).then(function() {
        if (this.lastPost && this.bot.isModuleEnabled(this.name)) {
            for(var i = posts.length - 1; i >= 0; i--) {
                this.bot.sendChat(`[r/kpop] ${posts[i].data.author} posted: ` +
                                  `${posts[i].data.title} https://reddit.com/${posts[i].data.id}`);
            }
        }

        if (posts.length > 0)
            /*@TODO: find a way to reliably get the most recent post */
            this.lastPost = posts[0].data.name;

        this.timer = setTimeout(this.runTimer.bind(this), this.settings["interval"]);
    }.bind(this))
}

RedditFeed.prototype.areSettingsValid = function(settings) {
    settings = settings || this.settings;
    var valid = true;

    Object.keys(this.settings).forEach(function(key) {
        if (this.settings[key] instanceof Array && this.settings[key].join('').length === 0)
            valid = false;
        else if (typeof this.settings[key] === "string" && this.settings[key].length === 0)
            valid = false;
        else if (typeof this.settings[key] === "number" && this.settings[key] <= 0)
            valid = false;
    }.bind(this));

    return valid;
}

module.exports = RedditFeed;