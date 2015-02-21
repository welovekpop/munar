var os = require("os");

function SysMod(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "sysinfo": sekshi.USERROLE.COHOST,
        "moduleinfo": sekshi.USERROLE.COHOST,
        "listmodules": sekshi.USERROLE.COHOST,
        "togglemodule": sekshi.USERROLE.COHOST,
        "reloadmodules": sekshi.USERROLE.COHOST,
        "exit": sekshi.USERROLE.MANAGER
    };
}

SysMod.prototype.name = "System";
SysMod.prototype.author = "Sooyou";
SysMod.prototype.version = "0.10.0";
SysMod.prototype.description = "let's you receive information about modules; reload them; check system stats; and more";

SysMod.prototype.moduleinfo = function(user, modulename) {
    if(!modulename || modulename.length === 0) {
        this.sekshi.sendChat("usage: !moduleinfo \"modulename\"");
        return;
    }

    modulename = modulename.toLowerCase();

    for(var i = 0, l = this.sekshi.modules.length; i < l; i++) {
        if(this.sekshi.modules[i].module && this.sekshi.modules[i].module.name.toLowerCase() === modulename) {
            this.sekshi.sendChat([
                (this.sekshi.modules[i].enabled ? ":small_blue_diamond:" : ":small_red_triangle:"), " module information about : ", this.sekshi.modules[i].module.name,
                " :white_small_square: version: ", this.sekshi.modules[i].module.version,
                " :white_small_square: author: ", this.sekshi.modules[i].module.author,
                " :white_small_square: description: ", this.sekshi.modules[i].module.description
                ].join(''));
            return;
        }
    }

    this.sekshi.sendChat(["no module called '", modulename, "' found."].join(''));
};

SysMod.prototype.reloadmodules = function(user) {
    this.sekshi.reloadmodules();
};

SysMod.prototype.listmodules = function (user) {
    this.sekshi.sendChat(
        this.sekshi.modules.map(
            mod => `:${mod.enabled ? 'white_check_mark' : 'small_red_triangle'}: ${mod.module.name}`
        ).join(' ')
    )
}

SysMod.prototype.togglemodule = function(user, modulename) {
    if(!modulename || modulename.length === 0) {
        this.sekshi.sendChat("usage: !togglemodule \"modulename\"");
        return;
    }

    modulename = modulename.toLowerCase();

    for(var i = 0, l = this.sekshi.modules.length; i < l; i++) {
        if(this.sekshi.modules[i].module.name.toLowerCase() === modulename) {
            this.sekshi.modules[i].enabled = !this.sekshi.modules[i].enabled;
            this.sekshi.sendChat(['@', user.username, ' ', this.sekshi.modules[i].module.name, (this.sekshi.modules[i].enabled ? " enabled" : " disabled")].join(''));
            return;
        }
    }
};

SysMod.prototype.sysinfo = function(user) {
    this.sekshi.sendChat([
        " OS: ", os.type(), ' ', os.release(), " :white_small_square: Platform: ", os.platform(),
        " :white_small_square: Architecture: ", os.arch(), " :white_small_square: Uptime: ", os.uptime(),
        " :white_small_square: load: ", os.loadavg()
        ].join(''));
};

SysMod.prototype.exit = function(user) {
    process.exit(0);
};

SysMod.prototype.destroy = function() {
    this.sekshi = null;
};

module.exports = SysMod;
