const user_types = {
    USER: 0,
    BOT: 1,
    SELF: 2,
    UNKNOWN: 3,
};

// make a class for every user type
class User {
    constructor(id, username, discriminator, avatar, bot, djs) {
        this.id = id;
        this.username = username;
        this.discriminator = discriminator;
        this.avatar = avatar;
        this.bot = bot;
        this.type = user_types.UNKNOWN;
        this.djs = djs;
    }
}

class BotUser extends User {
    constructor(id, username, discriminator, avatar) {
        super(id, username, discriminator, avatar, true);
        this.type = user_types.BOT;
    }
}

class UserUser extends User {
    constructor(id, username, discriminator, avatar, djs) {
        super(id, username, discriminator, avatar, false, djs);
        this.type = user_types.USER;
    }
}

class SelfUser extends User {
    constructor(id, username, discriminator, avatar) {
        super(id, username, discriminator, avatar, false);
        this.type = user_types.SELF;
        this.friends = [];
    }
}

const djsUserToUserClass = (usr) => {
    var bot = new BotUser (usr.id, usr.username, usr.discriminator, usr.avatar, usr);
    var normal = new UserUser(usr.id, usr.username, usr.discriminator, usr.avatar, usr);

    return usr.bot ? bot : normal;
}

module.exports = {
    user_types,
    User,
    BotUser,
    UserUser,
    SelfUser,
    djsUserToUserClass
};