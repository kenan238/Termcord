const { Activity } = require("discord.js");
const { Client } = require("./client.js");
const { Logger } = require("./logger.js");

/* Messages */
class Message {
    constructor(title, content, colors) {
        this.title = title;
        this.content = content;
        this.colors = colors;
        this.type = "normal";
    }

    /**
     * 
     * @returns {string} formatted message
     */
    format() {
        return `${this.title}: ${this.type}`;
    }

    /**
     * 
     * @param {string} type 
     * @param {number} c 
     * @returns color
     */
    getColorFor(type, c) {
        var color = this.colors[type];
        if(typeof color == Array) {
            if(typeof c == Number) {
                return color[c];
            } else
                return color[0];
        }
        return color;
    }

    /**
     * @returns {string} formatted message with colors
     */
    formatWithColors() {
        var title = this.getColorFor("title", 0);
        var content = this.getColorFor("content", 0);

        return `{${title}}${this.title}:{/${title}} {${content}}${this.content}{/${content}}`;
    }
}

class SystemMessage extends Message {
    constructor(content) {
        super("System", content, {
            title: "green-fg",
            content: ["white-fg", "yellow-fg", "green-fg"]
        });
        this.type = "system";
    }
}

class UserMessage extends Message {
    constructor(name, content) {
        super(name, content, {
            title: "cyan-fg",
            content: "white-fg"
        });
        this.type = "user";
    }
}
/* Messages */

// Event
const Events = {
    onMessage: 0,
    onGuildSwitch: 1,
    onChannelSwitch: 2,
    onChatReRenderNeeded: 3
}
class Event {
    constructor(name, id, sender, data) {
        this.name = name;
        this.id = id;
        this.sender = sender;
        this.data = data;
    }
}

// Command parser
class CmdObject {
    constructor(cmd, args) {
        this.cmd = cmd;
        this.args = args;
    }
}

class CmdParser {
    constructor() { }
    parse(cmd) {
        // Get name
        var name = cmd.split(" ")[0].replace("/", "");
        // Get args
        var args = cmd.split(" ").slice(1);
        // Return object
        return new CmdObject(name, args);
    }
}

const ArgType = {
    server: 0,
    member : 1,
    channel: 2,
    role: 3,
    string: 4,
    number: 5,
    boolean: 6,
    none: 7
}
const ArgTypeNames = {
    0: "server",
    1: "member",
    2: "channel",
    3: "role",
    4: "string",
    5: "number",
    6: "boolean",
    7: "none"
};

class Command {
    constructor(name, func, args) {
        this.name = name;
        this.func = func;
        this.args = args;
    }
}

class Controller {
    constructor(token) {
        this.currentServer = null;
        this.currentChannel = null;
        this.currentMessages = [];

        this.client = new Client(token);
        this.events = {};
        this.commandParser = new CmdParser();
        this.commands = {
            "go_to_guild_by_id": new Command("go_to_guild_by_id", (guildid) => {
                this.goToGuildById(guildid);
            }, [ArgType.number]),
            "go_to_channel_by_id": new Command("go_to_channel_by_id", (channelid) => {
                this.goToChannelById(channelid);
            }, [ArgType.number]),
            "go_to_next_guild": new Command("go_to_next_guild", () => {
                var guilds = this.client.getGuilds();
                var curIdx = -1;
                for (let i = 0; i < guilds.length; i++) {
                    if (guilds[i].id === this.currentServer.id)
                        curIdx = i;
                }
                var nextIdx = (curIdx + 1);
                if(nextIdx >= guilds.length)
                    nextIdx = 0;
                this._goToGuild(guilds[nextIdx]);
            }, [ArgType.none]),
            "exit": new Command("exit", () => {
                process.exit();
            }, [ArgType.none]),
            "go_to_next_channel": new Command("go_to_next_channel", () => {
                var channels = this.currentServer.channels;
                var curIdx = -1;
                var categIdx = null;
                for (let i = 0; i < channels.length; i++) {
                    var channel = channels[i];
                    if(channel.type === "GUILD_CATEGORY") {
                        for(let j = 0; j < Array.from(channel.children.values()).length; j++) {
                            if(Array.from(channel.children.values())[j].id === this.currentChannel.id) {
                                curIdx = j;
                                categIdx = i;
                            }
                        }
                    }
                    else if(channel.id === this.currentChannel.id && curIdx == -1) {
                        curIdx = i;
                    }
                }

                if(categIdx == null) {
                    var nextIdx = (curIdx + 1);
                    if(nextIdx >= channels.length)
                        nextIdx = 0;
                    this._goToChannel(channels[nextIdx]);
                } else {
                    var nextIdx = (curIdx + 1);
                    var nextCategIdx = categIdx;
                    var switchedCategory = false;
                    if(nextIdx >= Array.from(channels[categIdx].children).length) {
                        nextCategIdx = (categIdx + 1);
                        switchedCategory = true;
                        nextIdx = 0;
                    }
                    if(nextCategIdx >= channels.filter(c => c.type === "GUILD_CATEGORY").length)
                        nextCategIdx = 0;
                    var child = Array.from(channels[nextCategIdx].children)[nextIdx];
                    this._goToChannel(child[1]);
                }
            }, [ArgType.none]),
            "get_current_guild_id": new Command("get_current_guild_id", () => this.currentServer.id),
            "get_current_channel_id": new Command("get_current_channel_id", () => this.currentChannel.id),
            "remove_system_messages": new Command("remove_system_messages", () => {
                this.messages = this.messages.filter(m => m.type !== "system");
                this.callEvent(Events.onChatReRenderNeeded, null);
                return "Yeeted all system messages away!";
            }, [ArgType.none]),
            "user_profile": new Command("user_profile", (username, info) => {
                var split = username.split("#");
                var name = split[0];
                var tag  = split[1];
                var user = this.client.getUserByName(name);

                if(info === "id") {
                    return user.id;
                } else if(info === "tag") {
                    return user.discriminator;
                } else if(info === "avatar") {
                    return user.djs.avatarURL();
                } else if(info == "name") {
                    return user.djs.username;
                } else if(info == "createdAt") {
                    return user.djs.createdAt.toDateString();
                }
                return "Invalid info";
            }, [ArgType.member, ArgType.string]),
            "join_vc": new Command("join_vc", () => {
                if(this.currentChannel.type !== "GUILD_VOICE")
                    return "{bold}Current channel{/bold} is not {magenta-fg}VC{/magenta-fg}";
                this.client.connectToChannel(this.currentChannel, this.currentServer);
                return "Joining.";
            }),
            "refresh": new Command("refresh", () => "<REFRESH_TERMCORD_UI>"),
            "mute": new Command("mute", () => {
                // TODO: implement
                return "Not implemented yet";
            }),
            "deafen": new Command("deafen", () => {
                // TODO: implement
                return "Not implemented yet";
            }),
        };

        this.client.dClient.on("message", msg => {
            this.addMessage(new UserMessage(`@${msg.author.username}#${msg.author.discriminator}`, msg.content), msg);
        });
    }

    // Guilds

    /**
     * 
     * @summary go to guild
     * @param {*} guild 
     */
    _goToGuild(guild) {
        this.currentServer = guild;
        this._goToChannel(this.client.getChannels(this.currentServer)[0]);

        this.callEvent(Events.onGuildSwitch, new Event("OnGuildSwitch", 0, this, {
            guild: this.currentServer,
            channel: this.currentChannel
        }));
    }

    /**
     * 
     * @summary gets guild by id
     * @param {Number} id 
     * @returns guild by id
     */
    goToGuildById(id) {
        var guild = this.client.getGuilds().find(g => g.id == id);
        if(guild)
            this._goToGuild(guild);
        else
            return;
    }
    
    /**
     * 
     * @summary get guild by name
     * @param {*} name 
     * @returns guild by name
     */
    goToGuildByName(name) {
        var guild = this.client.getGuilds().find(g => g.name == name);
        if(guild)
            this._goToGuild(guild);
        else
            return;
    }

    // Channels
    /**
     * 
     * @summary go to channel
     * @param {*} channel 
     */
    _goToChannel(channel) {
        this.currentChannel = this.correctChannel(channel);
        this.messages = [];

        this.callEvent(Events.onChannelSwitch, new Event("OnChannelSwitch", 0, this, {
            guild: this.currentServer,
            channel: this.currentChannel
        }));
    }

    /**
     * 
     * @param {*} channel 
     * @returns corrected channel
     */
    correctChannel(channel) {
        return (channel.type === "GUILD_CATEGORY") ? channel.children.values().next().value : channel;
    }

    /**
     * 
     * @summary gets channel by id
     * @param {*} id 
     * @returns channel by id
     */
    goToChannelById(id) {
        var allChannels = this.client.getChannels(this.currentServer);

        for (let i = 0; i < allChannels.length; i++) {
            var channel = allChannels[i];
            if (channel.id == id) {
                this._goToChannel(channel);
                return;
            }
        }
        return null;
    }

    /**
     * 
     * @summary goes to channel by name
     * @param {*} name 
     */
    goToChannelByName(name) {
        var allChannels = this.client.getChannels(this.currentServer);

        for (channel in allChannels) {
            if (channel.name == name) {
                this._goToChannel(channel);
                return;
            }
        }
        return null;
    }

    // Messages

    /**
     * 
     * @summary send message
     * @param {*} message 
     */
    sendMessage(message) {
        this.client.sendMessage(this.currentChannel, message);
    }

    /**
     * 
     * @summary add message
     * @param {*} msg 
     */
    addMessage(msg, djs = null) {
        this.messages.push(msg);

        this.callEvent(Events.onMessage, new Event("OnMessage", 0, this, {
            termcord_message: msg,
            djs_message: djs
        }));
    }

    // Events

    /**
     * 
     * @summary add event
     * @param {*} type 
     * @param {*} callback 
     */
    addEventListener(type, callback) {
        if(!this.events[type])
            this.events[type] = [];
    
        this.events[type].push(callback);
    }

    /**
     * 
     * @param {*} type 
     * @param {*} data 
     */
    callEvent(type, event) {
        var got = this.events[type];
        if(!got) return;

        if(got.length === 1)
            got[0](event);
        else {
            for(var v in got) {
                v(event);
            }
        }
    }

    runCommand(cmd) {
        var cmdObj = this.commandParser.parse(cmd);
        var cmdName = cmdObj.cmd;
        var cmdArgs = cmdObj.args;

        if(!this.commands[cmdName])
            return;

        return this.commands[cmdName].func(...cmdArgs);
    }
}

module.exports = {
    Controller,
    Events,
    Event,
    Message,
    SystemMessage,
    UserMessage,
    ArgTypeNames
};