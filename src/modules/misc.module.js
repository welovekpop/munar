function Misc(sekshi) {
    this.sekshi = sekshi;
    this.waitlist = [];
    this.dropped = [];

    this.permissions = {
        "eta": sekshi.USERROLE.NONE,
        "help": sekshi.USERROLE.NONE
    };
}

Misc.prototype.name = "Misc";
Misc.prototype.author = "Sooyou";
Misc.prototype.version = "0.1.5";
Misc.prototype.description = "Provides basic moderation tools";

Misc.prototype.destroy = function() {
};

Misc.prototype.eta = function(user) {
    var waitlist = this.sekshi.getWaitlist();

    for(var i = waitlist.length; i >= 0; i--) {
        if(waitlist[i] == user.id) {
            this.sekshi.sendChat(`@${user.username} your turn is in around: ${i * 4} minutes`);
            break;
        }
    }
};

Misc.prototype.help = function(user) {
    this.sekshi.sendChat(`@${user.username} for more help or information, please visit our website: http://welovekpop.club`);
};

module.exports = Misc;
