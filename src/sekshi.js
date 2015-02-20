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

module.exports = Sekshi

function Sekshi(args) {
    Sekshi.super_.call(this);

    this.invokeLogger(function(msg, verbosity, color) {
        debug(msg)
    });

    this.db = mongoose.connect(args.mongo);

    this.modules = [];
    this.delimiter = args.delimiter || '!';
    this.modulePath = args.modulePath || path.join(__dirname, "modules");

    this._room = args.room

    this.loadModules(this.modulePath);
}

util.inherits(Sekshi, Plugged);

Sekshi.prototype.start = function(credentials) {
    try {
        this.login(credentials);
    } catch (err) {
        console.error("error at login: " + err.message);
        return;
    }

    this.once(this.LOGIN_SUCCESS, function _onLoginSuccess() {
        this.cacheChat(true);
        this.connect(this._room);
    });

    this.once(this.LOGIN_ERROR, function _onLoginError(err) {
        console.error("something strange happened while trying to log in");
        console.error("Error: " + err);
    })

    this.once(this.JOINED_ROOM, function _onJoinedRoom(err) {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }

        this.on(this.CHAT, this.onMessage.bind(this));
    });
};

Sekshi.prototype.stop = function() {
    this.unloadModules(this.modulePath);

    this.logout(function _logout() {
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

Sekshi.prototype.parseArguments = function(str, args) {
    args = args || [];
    str = str || "";
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
};

Sekshi.prototype.reloadmodules = function(modulePath) {
    this.unloadModules(modulePath);
    this.loadModules(modulePath);
};


Sekshi.prototype.onMessage = function(msg) {
    if (msg.message.charAt(0) === this.delimiter) {
        this.deleteMessage(msg.cid);

        var self = this;
        var args = [];
        var func = null;
        var user = self.getUserByID(msg.id, true);

        if(!user)
            return;

        if(typeof user.role === "undefined")
            user.role = 0;

        this.parseArguments(msg.message, args);

        func = args.shift().replace(this.delimiter, '');
        args.unshift(user);

        for (var i = 0, l = self.modules.length; i < l; i++) {
            if (self.modules[i].enabled && typeof self.modules[i].module[func] === "function") {
                if (args[0].role >= self.modules[i].module.permissions[func])
                    self.modules[i].module[func].apply(self.modules[i].module, args);
                else
                    self.sendChat(['@', msg.username, " you don't have permission to use this command"].join(''), 5 * 1000);
                break;
            }
        }
    } else {
        logChat(msg.username, msg.message)
    }
};

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
                    this.getModuleFiles(path.join(modulePath, files[i]), modules);
            }

        } else if (stat.isFile()) {
            if (modulePath.slice(modulePath.indexOf('.') + 1) === "module.js")
                modules.push(modulePath);
        }
    }

    return modules;
};

Sekshi.prototype.isModuleEnabled = function(modulename) {
    modulename = modulename.toLowerCase();

    for(var i = this.modules.length - 1; i >= 0; i--) {
        if(this.modules[i].module.name.toLowerCase() === modulename)
            return this.modules[i].enabled;
    }
};

Sekshi.prototype.loadModules = function(modulePath) {
    modulePath = modulePath || this.modulePath;

    var moduleFiles = this.getModuleFiles(modulePath);
    var module = null;

    for (var i = 0, l = moduleFiles.length; i < l; i++) {
        module = require(moduleFiles[i]);

        this.modules.push({
            enabled: true,
            module: new module(this)
        });
    }
};

Sekshi.prototype.unloadModules = function(modulePath) {
    modulePath = modulePath || this.modulePath;

    for (var i = 0, l = this.modules.length - 1; i < l; i++) {
        if (typeof this.modules[i].module.destroy !== "undefined")
            this.modules[i].module.destroy();
    }

    this.modules = [];
    var moduleFiles = this.getModuleFiles(modulePath);

    for (var i = 0, l = moduleFiles.length; i < l; i++) {
        delete require.cache[path.resolve(moduleFiles[i])];
    }
};