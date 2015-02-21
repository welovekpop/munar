function Emotes(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "thatsnono": sekshi.USERROLE.NONE,
        "assc": sekshi.USERROLE.NONE
    };
}

Emotes.prototype.name = "Emotes";
Emotes.prototype.author = "Sooyou";
Emotes.prototype.version = "0.1";
Emotes.prototype.description = "adds several emoticons as well as gifs and webms";

Emotes.prototype.destroy = function() {
    
};

Emotes.prototype.sendEmote = function(msg, username) {
    if(username) {
        var user = this.sekshi.getUserByName(username, true);

        if(user) {
            this.sekshi.sendChat(`@${user.username} ${msg}`);
            return;
        }
    }

    this.sekshi.sendChat(msg);
};

Emotes.prototype.thatsnono = function(user, username) {
    this.sendEmote("That's no no http://a.pomf.se/lcmeuw.webm", username);
};

Emotes.prototype.assc = function(user, username) {
    this.sendEmote("https://lh3.googleusercontent.com/d48ig8i3UaCaV9xjC6d6dVhCFU8iNBm9vk1yLRvQKT_UOBqJiTxaw3aPQBqNHDga98Z-1NCgq-I=w1896-h791", username);
};

module.exports = Emotes;
