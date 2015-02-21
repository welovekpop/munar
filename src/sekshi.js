/*****************************/
/* Bot created for We <3 KPOP*/
/*          on plug.dj.      */
/*                           */
/*          join at:         */
/*    play.welovekpop.club   */
/*****************************/

var Plugged = require("plugged");
var path = require("path");
var util = require("util");
var fs = require("fs");
var debug = require('debug')('sekshi:sekshi')
var logChat = require('debug')('sekshi:chat')
var mongoose = require('mongoose')

const unescape = require('unescape')

module.exports = Sekshi

function Sekshi(args) {
    Sekshi.super_.call(this);

    this.invokeLogger(function(msg, verbosity, color) {
        debug(msg)
    });

    this.options = args

    this.db = mongoose.connect(args.mongo);

    this.modules = {};
    this.delimiter = args.delimiter || '!';
    this.modulePath = args.modulePath || path.join(__dirname, "modules");

    this._room = args.room

    this.loadModules(this.modulePath);
    this.onMessage = this.onMessage.bind(this)
}

util.inherits(Sekshi, Plugged);

Sekshi.prototype.start = function(credentials) {
    try {
        this.login(credentials);
    } catch (err) {
        console.error("error at login: " + err.message);
        return;
    }

    this.on(this.CHAT, this.onMessage);

    this.once(this.LOGIN_SUCCESS, function _onLoginSuccess() {
        this.cacheChat(true);
        this.connect(this._room);
    });

    this.once(this.LOGIN_ERROR, function _onLoginError(err) {
        console.error("something strange happened while trying to log in");
        console.error("Error: " + err);
    })

    this.once(this.JOINED_ROOM, err => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
    });
};

Sekshi.prototype.stop = function() {
    this.unloadModules(this.modulePath);

    this.logout(() => {
        this.removeListener(this.CHAT, this.onMessage);
    });
};

Sekshi.prototype.setDelimiter = function(delimiter) {
    this.delimiter = delimiter;
};

Sekshi.prototype.setRoom = function(room) {
    this._room = room;
    this.connect(this._room);
};

Sekshi.prototype.parseArguments = function (str = '') {
    var args = [];
    var length = str.length;
    var compound = false;       //quoted?
    var sarg = false;           //started argument?
    var sidx = 0;               //start index
    var cidx = 0;               //current index

    // rule1: every non quoted word is a single argument
    // rule2: quoted words are meant to be a single argument
    while (cidx < length) {
        if (!sarg && str[cidx] !== ' ') {

            if (str[cidx] === '"') {
                sidx = ++cidx;
                compound = true;
            } else {
                sidx = cidx;
            }

            sarg = true;
        } else if (sarg && !compound && str[cidx] === ' ') {
            args.push(str.slice(sidx, cidx));
            sarg = false;
        } else if (sarg && compound && str[cidx] === '"') {
            args.push(str.slice(sidx, cidx));
            compound = false;
            sarg = false;
        }

        cidx++;
    }

    if (sarg)
        args.push(str.slice(sidx, cidx));

    return args
};

Sekshi.prototype.reloadmodules = function(modulePath) {
    this.unloadModules(modulePath);
    this.loadModules(modulePath);
};

Sekshi.prototype.lockskipDJ = function (id, position, cb) {
    this.skipDJ(id, e => {
        if (e) cb(e)
        else this.moveDJ(id, position, cb)
    })
}

// this might be a bit brittle
// it's to handle users with fancy chars in their names, but this does mean that
// if we actually try to send &amp;, it will come out as & instead
// TODO maybe fix this in SooYou/plugged?
Sekshi.prototype.sendChat = function (data) {
    return Sekshi.super_.prototype.sendChat.call(this, unescape(data))
}

Sekshi.prototype.onMessage = function(msg) {
    if (!this.getCurrentRoomStats()) {
        return
    }

    if (msg.message.charAt(0) === this.delimiter) {
        let func = null
        let user = msg.id === 'sekshi' ? { role: this.USERROLE.HOST }
                                       : this.getUserByID(msg.id, true)

        // nonexistent user
        if (!user) return

        user.role = user.role || this.USERROLE.NONE

        let args = this.parseArguments(msg.message)

        func = args.shift().replace(this.delimiter, '')
        args.unshift(user)

        for (let name in this.modules) if (this.modules.hasOwnProperty(name)) {
            let mod = this.modules[name]
            if (mod.enabled() && typeof mod[func] === 'function' && mod.permissions.hasOwnProperty(func)) {
                this.deleteMessage(msg.cid)
                if (user.role >= mod.permissions[func]) {
                    mod[func](...args)
                }
                else {
                    this.sendChat(`@${msg.username}: You don't have sufficient permissions to use this command.`, 5 * 1000)
                }
            }
        }
    } else {
        logChat(msg.username, msg.message)
    }
}

Sekshi.prototype.getModule = function (name) {
    return this.modules[name.toLowerCase()]
}

//get array of module files
Sekshi.prototype.getModuleFiles = function(modulePath, modules) {
    if (!fs.existsSync(modulePath)) {
        console.log(modulePath + " does not exist!");
        return [];
    }

    modules = modules || [];
    var stat = fs.statSync(modulePath);

    if (typeof stat === "undefined") {
        console.log("An error occured while fetching the path");
    } else {
        if (stat.isDirectory()) {
            var files = fs.readdirSync(modulePath);

            if (typeof files !== "undefined") {
                for (var i = 0, l = files.length; i < l; i++)
                    modules.push(...this.getModuleFiles(path.join(modulePath, files[i])));
            }

        } else if (stat.isFile()) {
            if (modulePath.slice(modulePath.indexOf('.') + 1) === "module.js")
                modules.push(modulePath);
        }
    }

    return modules;
};

Sekshi.prototype.isModuleEnabled = function (name) {
    return this.getModule(name).enabled()
};

Sekshi.prototype.loadModules = function (modulePath) {
    modulePath = modulePath || this.modulePath

    this.getModuleFiles(modulePath).forEach(file => {
        let Module = require(file)
        let mod = new Module(this, {})

        this.modules[mod.name.toLowerCase()] = mod
    })
}

Sekshi.prototype.unloadModules = function(modulePath) {
    modulePath = modulePath || this.modulePath;

    for (let name in this.modules) if (this.modules.hasOwnProperty(name)) {
        this.modules[name].destroy()
    }

    this.modules = {}
    this.getModuleFiles(modulePath).forEach(file => {
        delete require.cache[path.resolve(file)]
    })
};