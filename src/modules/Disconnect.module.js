export default class Disconnect {
    constructor(sekshi) {
        this.name = "Disconnect";
        this.author = "Sooyou";
        this.version = "0.2.0";
        this.description = "Provides basic moderation tools";

        this.sekshi = sekshi;
        this.waitlist = [];
        this.dropped = [];

        this.permissions = {
            "dc": sekshi.USERROLE.NONE
        };

        this.onWaitlistUpdate = this.onWaitlistUpdate.bind(this)
        this.onUserLeave = this.onUserLeave.bind(this)
        sekshi.on(sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate);
        sekshi.on(sekshi.USER_LEAVE, this.onUserLeave);
    }

    destroy() {
        this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate);
        this.sekshi.removeListener(this.sekshi.USER_LEAVE, this.onUserLeave);
    }

    onWaitlistUpdate(oldWaitlist, newWaitlist) {
        this.waitlist = oldWaitlist;
    }

    onUserLeave(user) {
        if(!user)
            return;

        for(var i = this.waitlist.length - 1; i >= 0; i--) {
            if(this.waitlist[i] == user.id) {

                this.dropped.push({
                    id: this.waitlist[i],
                    position: i
                });
                break;
            }
        }
    }

    dc(user) {

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
    }

}