const guild_types = {
    GUILD: 0,
    DM: 1,
    GROUP_DM: 2,
};

class Guild {
    constructor(id, name, type, djs) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.djs = djs;
    }
}

class GuildGuild extends Guild {
    constructor(id, name, djs) {
        super(id, name, guild_types.GUILD, djs);
        this.channels = [];
        this.members = [];
    }
}


class GuildDM extends Guild {
    constructor(id, name, to) {
        super(id, name, guild_types.DM);
    }
}


class GuildGroupDM extends Guild {
    constructor(id, name) {
        super(id, name, guild_types.GROUP_DM);
        this.members = [];
    }
}


module.exports = {
    guild_types,
    Guild,
    GuildGuild,
    GuildDM,
    GuildGroupDM,
};