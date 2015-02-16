function Scheduler(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "start": sekshi.USERROLE.MANAGER,
        "stop": sekshi.USERROLE.MANAGER,
        "useplaylist": sekshi.USERROLE.MANAGER
    };
}

Scheduler.prototype.name = "Scheduler";
Scheduler.prototype.author = "Sooyou";
Scheduler.prototype.version = "0.1";
Scheduler.prototype.description = "Automatic planner for events";

Scheduler.prototype.destroy = function() {
    
};

Scheduler.prototype.start = function(user) {
    this.sekshi.setLock(true, true, function() {
        this.sekshi.setCycle(false, function() {
            this.sekshi.joinWaitlist();
            this.sekshi.sendChat("Welcome to the 'Best of 2014 event! It's been one heck of a year, a lot has happened. Some stuff was good, some was bad, but we still got a lot of KPOP together!");
        }.bind(this));
    }.bind(this))
};

Scheduler.prototype.stop = function(user) {
    this.sekshi.setCycle(true, function() {
        this.sekshi.setLock(false, true, function() {
            this.sekshi.sendChat("thanks for joining in! The We Love KPOP team wishes you a happy new year!");
        }.bind(this));
    }.bind(this));
};

Scheduler.prototype.useplaylist = function(user, playlist) {
    
};

module.exports = Scheduler;
