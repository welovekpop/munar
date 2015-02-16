var franc = require("franc");

function Language(sekshi) {
    this.sekshi = sekshi;

    this.warnings = [];

    this.permissions = {

    };

    sekshi.on(sekshi.CHAT, this.checkMessage.bind(this));
}

Language.prototype.name = "Language";
Language.prototype.author = "Sooyou";
Language.prototype.version = "0.1";
Language.prototype.description = "language detection module";

Language.prototype.destroy = function() {
    this.sekshi.removeListener(sekshi.CHAT, this.checkMessage.bind(this));
};

Language.prototype.checkMessage = function(message) {
    if(!this.sekshi.isModuleEnabled(this.name))
        return;

    var lang = franc.all(message.message, {
        whitelist: ["eng", "kor"]
    });

    console.log(lang);
    console.log(lang[0][1]);

    if(!(lang[0][1] > 0.75 || lang[1][1] > 0.75)) {
        this.sekshi.sendChat(['@', message.username, " rule 3, please speak english"].join(''));

        for(var i = this.warnings.length - 1; i >= 0; i--) {
            if(this.warnings[i].id == message.id) {
                this.warnings[i].count++;

                if(this.warnings[i] > 3) {
                    this.sekshi.banUser(message.id, this.sekshi.BANDURATION.DAY, this.sekshi.BANREASON.VIOLATING_COMMUNITY_RULES, function(err) {
                        if(!err) {
                            this.sendChat("Reason: Violated community rules", 10*1000);
                        }
                    });
                    return;
                }
            }
        }

        this.warnings.push({
            id: message.id,
            count: 1
        });
    }
};

module.exports = Language;
