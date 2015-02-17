var readline = require("readline");
var Sekshi = require("./sekshi");
var config = require('./config.json')

var sekshi = new Sekshi(config);
legacyFixes(sekshi)

var rl = readline.createInterface(process.stdin, process.stdout);

sekshi.start(require("./creds.json"));

sekshi.on(sekshi.CONN_PART, function() {
    console.error("connection parted");
    process.exit(1);
});

sekshi.on(sekshi.CONN_WARNING, function(warning) {
    console.warn("connection warning: " + warning)
});

rl.setPrompt("Sekshi> ");
rl.prompt();

rl.on("line", function(line) {
    line = line.split(' ');
    switch(line.shift()) {
        case "reloadmodules":
            sekshi.unloadModules();
            sekshi.loadModules();
            break;

        case "unloadmodules":
            sekshi.unloadModules();
            break;

        case "loadmodules":
            sekshi.loadModules();
            break;

        case "sendchat":
            sekshi.sendChat(line.join(' '));
            break;

        case "start":
            sekshi.start();
            break;

        case "stop":
            sekshi.stop();
            break;

        case "exit":
            sekshi.stop();
            process.exit(0);
            break;

        case "help":
            console.log("commands:\n\
                reloadmodules: reloads all modules in module path.\n\
                unloadmodules: unloads all modules in module path.\n\
                loadmodules: loads all modules in module path.\n\
                start: logs the bot in.\n\
                stop: logs the bot out.\n\
                exit: stops application.");
            break;

        default:
            console.log("unknown command: " + line);
            break;
    }
    rl.prompt();
});


// Patch plugged for the old plug.dj socket server
function legacyFixes(plug) {
  var WebSocket = require('ws')
  WebSocket.prototype.sendMessage = function(type, data, offset) {
    offset = offset || 0;

    if(typeof type === "string" && (typeof data === "string" || typeof data === "number")) {
      this.send([
        '"{\\"a\\":\\"', type, '\\",\\"p\\":\\"', data,
        '\\",\\"t\\":\\"', Date.now() - offset, '\\"}"'
      ].join(''));
    }
  };

  plug.connectSocket = function () {
    if (this.sock)
      return "sock is already open!";

    var self = this;
    var sid = Math.floor(Math.random() * 1000);
    var id = "xxxxxxxx".replace(/x/g, function _rep() {
      return "abcdefghijklmnopqrstuvwxyz0123456789_".charAt(Math.floor(Math.random() * 37));
    });

    this.log("Server: " + sid, 3, "yellow");
    this.log("ID: " + id, 3, "yellow");

    this.sock = new WebSocket("wss://shalamar.plug.dj/socket/" + sid + '/' + id + "/websocket");

    /*================= SOCK OPENED =================*/
    this.sock.on("open", function _sockOpen() {
      self.log("socket opened", 3, "magenta");
      self.emit(self.SOCK_OPEN, self);
    });

    /*================= SOCK CLOSED =================*/
    this.sock.on("close", function _sockClose() {
      self.log("sock closed", 3, "magenta");
      self.emit(self.SOCK_CLOSED, self);
    });

    /*================= SOCK ERROR ==================*/
    this.sock.on("error", function _sockError(err) {
      self.log("sock error!", 3, "magenta");
      self.log(err, 3, "red");
      self.emit(self.SOCK_ERROR, self, err);
    });

    /*================= SOCK MESSAGE =================*/
    this.sock.on("message", function _receivedMessage(msg) {
      switch(msg.charAt(0)) {
        case "o":
          this.sendMessage("auth", self.auth, self.offset);
          self.keepAliveCheck.call(self);
          break;

        case "h":
          self.keepAliveCheck.call(self);
          break;

        case "a":
          // Plug.dj weirdness…
          self.wsaprocessor(self, msg.slice(2, -1));
          break;

        default:
          self.log(["unknown message: ", msg].join(''), 1, "yellow");
          break;
      }
    });
  }
}