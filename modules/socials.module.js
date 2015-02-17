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
    "Hai ",
    "Welcome ",
    "How's it going ",
    "Good day ",
    "Hej ",
    "Sup ",
    "Hi ",
    "G'day "
    ];

    this.emojis = [
    ":exclamation:",
    ":purple_heart:",
    ":blue_heart:",
    ":v:",
    ":smirk:",
    ":laughing:"
    ];

    sekshi.on(sekshi.USER_JOIN, this.greet.bind(this));
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

    this.lastGreeted = user.id;

    setTimeout(this.sekshi.sendChat.bind(this.sekshi), 2*1000, [this.greetings[(user.username === "severus" ? this.greetings[4] : Math.floor(this.greetings.length * Math.random()))], 
        '@', user.username, ' ', 
        (user.username === "shineestaemint" ? " :heart:" :
            (this.sekshi.isFriend(user.id) ? 
                this.emojis[Math.floor(this.emojis.length * Math.random())] : 
                ''
            )
        )
        ].join(''));
};

Socials.prototype.fb = function(user) {
    this.sekshi.sendChat("https://www.facebook.com/welovekpop.club");
};

Socials.prototype.web = function(user) {
    this.sekshi.sendChat("http://www.welovekpop.club");
};

module.exports = Socials;
