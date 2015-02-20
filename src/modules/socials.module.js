const debug = require('debug')('sekshi:greeting')

function Socials(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "greetusers": sekshi.USERROLE.BOUNCER,
        "fb": sekshi.USERROLE.NONE,
        "web": sekshi.USERROLE.NONE
    };

    this.autogreet = true;
    this.lastGreeted = -1;

    this.greetings = [
        'Hai @',
        'Welcome, @!',
        'hoi @',
        'Heyho @',
        'Hej @',
        '안녕, @!',
        'Hi @',
        '/me hugs @'
    ];

    this.emojis = [
        ':exclamation:',
        ':purple_heart:',
        ':blue_heart:',
        ':v:',
        ':smirk:',
        ':laughing:'
    ];

    this.greet = this.greet.bind(this)
    sekshi.on(sekshi.USER_JOIN, this.greet);
}

Socials.prototype.name = "Socials";
Socials.prototype.author = "Sooyou";
Socials.prototype.version = "0.0.2";
Socials.prototype.description = "Socials features to greet new users etc";

Socials.prototype.destroy = function() {
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.greet);
};

Socials.prototype.greetusers = function(toggle) {
    this.autogreet = (toggle.toLowerCase() === "true" ? true : false);
};

Socials.prototype.greet = function(user) {
    if(!this.autogreet || this.lastGreeted == user.id || user.username === this.sekshi.getSelf().username || !this.sekshi.isModuleEnabled(this.name))
        return;

    debug('saying hi', user)

    this.lastGreeted = user.id;

    let greeting = this.greetings[Math.floor(this.greetings.length * Math.random())]
    let message = greeting.replace(/@/, `@${user.username}`)
                + (this.sekshi.isFriend(user.id) ?
                     this.emojis[Math.floor(this.emojis.length * Math.random())] : '')
    setTimeout(this.sekshi.sendChat.bind(this.sekshi, message), 2 * 1000)
};

Socials.prototype.fb = function(user) {
    this.sekshi.sendChat("https://facebook.com/welovekpop.club");
};

Socials.prototype.web = function(user) {
    this.sekshi.sendChat("http://welovekpop.club");
};

module.exports = Socials;
