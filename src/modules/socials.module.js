const debug = require('debug')('sekshi:social-media')

function Socials(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "fb": sekshi.USERROLE.NONE,
        "web": sekshi.USERROLE.NONE
    };
}

Socials.prototype.name = "Socials";
Socials.prototype.author = "Sooyou";
Socials.prototype.version = "0.0.2";
Socials.prototype.description = "Socials features to greet new users etc";

Socials.prototype.destroy = function() {

};

Socials.prototype.fb = function(user) {
    this.sekshi.sendChat("https://facebook.com/welovekpop.club");
};

Socials.prototype.web = function(user) {
    this.sekshi.sendChat("http://welovekpop.club");
};

module.exports = Socials;
