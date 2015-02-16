function Misc(sekshi) {
    this.sekshi = sekshi;
    this.waitlist = [];
    this.dropped = [];

    this.permissions = {
        "dc": sekshi.USERROLE.NONE,
        "eta": sekshi.USERROLE.NONE,
        "skip": sekshi.USERROLE.BOUNCER,
        "help": sekshi.USERROLE.NONE
    };

    sekshi.on(sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate.bind(this));
    sekshi.on(sekshi.USER_LEAVE, this.onUserLeave.bind(this));
}

Misc.prototype.name = "Misc";
Misc.prototype.author = "Sooyou";
Misc.prototype.version = "0.1.5";
Misc.prototype.description = "Provides basic moderation tools";

Misc.prototype.destroy = function() {
    this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate);
    this.sekshi.removeListener(this.sekshi.USER_LEAVE, this.onUserLeave);
};

Misc.prototype.onWaitlistUpdate = function(oldWaitlist, newWaitlist) {
    this.waitlist = oldWaitlist;
};

Misc.prototype.onUserLeave = function(user) {
    if(!user)
        return;
    
    for(var i = this.waitlist.length - 1; i >= 0; i--) {
        if(this.waitlist[i] == user.id) {
            //var key = "MISC:wdc:" + user.id;
            //this.sekshi.storage("set", [key, i]);
            //this.sekshi.storage("expire", [key, 6*60*60]);

            this.dropped.push({
                id: this.waitlist[i],
                position: i
            });
            break;
        }
    }
};

Misc.prototype.dc = function(user) {
    /*this.sekshi.storage("get", ["MISC:wdc:" + user.id], function(err, reply) {
        console.log(err);
        console.log(reply);
    });*/

    for(var i = this.dropped.length - 1; i >= 0; i--) {
        if(user.id == this.dropped[i].id) {
            var drop = this.dropped.splice(i, 1)[0];

            if(this.sekshi.getWaitlist().indexOf(drop.id) < 0) {
                this.sekshi.addToWaitlist(drop.id, function _miscUserAdded() {
                    this.moveDJ(drop.id, drop.position);
                });
            } else {
                this.sekshi.moveDJ(drop.id, drop.position);
            }

            break;
        }
    }
};

Misc.prototype.eta = function(user) {
    var waitlist = this.sekshi.getWaitlist();

    for(var i = waitlist.length; i >= 0; i--) {
        if(waitlist[i] == user.id) {
            this.sekshi.sendChat(['@', user.username, " your turn is in around: ", i*4, " minutes"].join(''));
            break;
        }
    }
};

Misc.prototype.help = function(user) {
    this.sekshi.sendChat(['@', user.username, " for more help or infos please visit our website http://www.welovekpop.club"].join(''));
};

Misc.prototype.skip = function(user) {
    this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id);
};

module.exports = Misc;
