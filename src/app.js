var readline = require("readline");
var Sekshi = require("./sekshi");
var config = require('../config.json')

var sekshi = new Sekshi(config);

sekshi.start(require("../creds.json"));

sekshi.on(sekshi.CONN_PART, function() {
    console.error("connection parted");
    process.exit(1);
});

sekshi.on(sekshi.CONN_WARNING, function(warning) {
    console.warn("connection warning: " + warning)
});

var rl = readline.createInterface(process.stdin, process.stdout);

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