var util = require("util");

function Valentine(sekshi) {
    this.sekshi = sekshi;

    this.permissions = {
        "valentine": sekshi.USERROLE.NONE
    };

    this.index = 0;

    this.cards = [
    "http://longtailmyth.info/wp-content/uploads/2014/12/kpop-valentines-cards-tumblr-82m3vexw.jpg",
    "http://24.media.tumblr.com/8d152ce37ca5f02d0573c1d28623b6f3/tumblr_mzwyqcnotK1qe1twzo3_500.png",
    "http://36.media.tumblr.com/927058cc214037b67dd6034f0e2b31fb/tumblr_mzwyqcnotK1qe1twzo1_500.png",
    "https://40.media.tumblr.com/2aef889d61591ca41b0589275e2bcb7a/tumblr_mzwyqcnotK1qe1twzo5_r2_500.png",
    "http://41.media.tumblr.com/7ab2499abe872881858e692f7d3deb10/tumblr_mi7471UB8M1rzk6y3o1_500.jpg",
    "https://40.media.tumblr.com/1403c2e1eab747926c5e1fc2271252fc/tumblr_n01djzDSWt1tpyp8wo1_500.jpg",
    "The We :heart: KPOP wishes everyone a nice Valentine's Day",
    "http://24.media.tumblr.com/377342a6946b5c93d488b2ff6429f35e/tumblr_n0cy7zjRTs1romgh7o4_500.png",
    "http://www.theoneshots.com/wp-content/uploads/2014/02/20140208_theoneshots_valentines_Baro_Number.png",
    "http://31.media.tumblr.com/7983ca6fea7f077dd1129c335646577f/tumblr_n04sguFLMB1tpo0j5o7_500.jpg",
    "http://img4.wikia.nocookie.net/__cb20140215214439/degrassi/images/a/a4/KPOP_-_Valentines_cards_(3).jpg",
    "http://25.media.tumblr.com/d19fd36fd65304b3ec1af16648880c68/tumblr_mhzwmzwyBt1qiaib1o1_500.png",
    "http://31.media.tumblr.com/d92bc4134f839e43af5b8fd7af0042d5/tumblr_n04sguFLMB1tpo0j5o6_500.jpg",
    "http://41.media.tumblr.com/03a537974dad35ba588dbacfa668392a/tumblr_n0rf0nA3Q31rynutdo3_500.jpg",
    "http://upload.enewsworld.net/News/Contents/20130214/77429444.jpg",
    "http://24.media.tumblr.com/5d1c665062bf27a0c4078299aa038447/tumblr_mi2uszLqtC1s21mzqo1_500.png",
    "http://media.tumblr.com/c25800b8666806a5d0d78425503be9ef/tumblr_inline_mi2xw5JM7j1qz4rgp.png",
    "http://www.theoneshots.com/wp-content/uploads/2014/02/Changmin-copy.png",
    "The We :heart: KPOP wishes everyone a nice Valentine's Day",
    "http://longtailmyth.info/wp-content/uploads/2014/12/valentines-day-card-tumblr-kpop-0oi0ppcx.png",
    "http://25.media.tumblr.com/cce46f3d9de373c70ceab04243578f7f/tumblr_n0cy7zjRTs1romgh7o3_500.png",
    "http://41.media.tumblr.com/5a67794354488bfca1b563de811487eb/tumblr_mzw0xdjtWJ1romgh7o2_1280.png",
    "http://24.media.tumblr.com/c274dd1faaee54887872beae1003bc3e/tumblr_n00d92172j1s20akxo1_500.jpg",
    "http://24.media.tumblr.com/5f77f7277774945d23e954f6ca15b56f/tumblr_mi6202re5F1qa51lxo2_500.jpg",
    "https://31.media.tumblr.com/20b1eebcaea35adb12b4a048eca0d396/tumblr_n0wm8mIoDe1rijwaao1_500.png",
    "http://31.media.tumblr.com/fd4350f67292b8457e4ce83932b2b237/tumblr_n04dsdSZqi1soc5lso3_1280.jpg",
    "https://40.media.tumblr.com/4f9d16972e2f581e30a2bf7780d35f12/tumblr_mi11fkhel91rbc503o1_500.jpg",
    "http://41.media.tumblr.com/d4a9f41c483f60e07131aa5e0d8c8646/tumblr_mi0v9xicJ31qd56hgo2_500.jpg",
    "The We :heart: KPOP wishes everyone a nice Valentine's Day",
    "http://i50.tinypic.com/2u9tj47.jpg"
    ];

    this.greetings = [
    "@%s wishes you a happy valentine @%s",
    "@%s can be the fries in your sauce @%s",
    "@%s wants you @%s in their arms",
    "@%s likes to be the Fanta in your Cola @%s",
    "when @%s is the mountain, then you @%s be their dew",
    "@%s only likes to enjoy their tea with you @%s",
    "@%s is alone. Sucks to be you",
    "@%s needs @%s on their side",
    "@%s would like to cuddle with you @%s",
    "@%s wants to drive you wild... in bed. @%s",
    "@%s wants to have children with you @%s",
    "@%s hates this day"
    ];

    setInterval(this.sendCard.bind(this), 15*60*1000);
}

Valentine.prototype.name = "Valentine";
Valentine.prototype.author = "Sooyou";
Valentine.prototype.version = "1.0.0";
Valentine.prototype.description = "Valentine's Day special module";

Valentine.prototype.destroy = function() {
    
};

Valentine.prototype.sendCard = function() {
    if(this.sekshi.isModuleEnabled(this.name)) {
        this.sekshi.sendChat(this.cards[this.index]);
        this.index++;
    }
};

Valentine.prototype.valentine = function(user, valentine) {
    if(typeof valentine === "undefined")
        this.sekshi.sendChat(util.format(this.greetings[6], user.username));
    else
        this.sekshi.sendChat(util.format(this.greetings[Math.floor(this.greetings.length * Math.random())], user.username, valentine));
};

module.exports = Valentine;
