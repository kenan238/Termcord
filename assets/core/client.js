/* Client */
const { SelfUser, BotUser, UserUser, djsUserToUserClass } = require("./resources/users.js");
const guilds = require("./resources/guild.js");
const discord = require("discord.js");
const { Intents } = require("discord.js");
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
} = require("@discordjs/voice");

/**
 * @argument {token} token
 * @summary Internal Client
 */
class Client {
    constructor(token) {
        this.token = token;
        this.dClient = new discord.Client({
            intents: [
                Intents.FLAGS.GUILDS, 
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
        });
    
        this.dClient.login(this.token);
        
        this.dClient.on("ready", () => {
            this.selfuser = new SelfUser(
                this.dClient.id, 
                this.dClient.user.name, 
                this.dClient.user.discriminator, 
                this.dClient.user.avatar
            );
        });
    }

    /**
     * @augments
     * @returns {Array<guilds.GuildGuild>} Guilds
     */
    getGuilds() {
        var guilds_ = [];
        var djs_guilds = this.dClient.guilds.cache.values();
        for(var guild of djs_guilds) {
            var guildObj = new guilds.GuildGuild(guild.id, guild.name);

            // Get channels
            var channels = [];

            guild.channels.cache.forEach(channel => {
                channels.push(channel)
            });

            guildObj.channels = channels;

            
            guildObj.djs = guild;
            guildObj.members = guild.members;
            guilds_.push(guildObj);
        }
        return guilds_;
    }

    /**
     * 
     * @param {guild} guild
     * @returns Channels
     */
    getChannels(guild) {
        return guild.channels;
    }

    /**
     * @param {category} category
     * @returns Channels from category
     */
    getChannelsFromCategory(category) {
        var channels = [];

        category.channels.forEach(channel => {
            channels.push(channel);
        });

        return channels;
    }

    /**
     * @param {channel} channel
     * @param {message} message
     * @returns undefined
     */
    sendMessage(channel, message) {
        if(message != "")
            channel.send(message);
    }

    /**
     * 
     * @param {id} id 
     * @returns User
     */
    getUserById(id) {
        var user = this.dClient.users.fetch(id);
        return djsUserToUserClass(user);
    }

    /**
     * 
     * @param {name} name 
     * @returns User
     */
    getUserByName(name) {
        var user = this.dClient.users.cache.find(user => user.username === name);
        return djsUserToUserClass(user);
    }

    /**
     * 
     * @param {guild} guild 
     * @returns Members
     */
    async getMembers(guild) {
        var unconverted = await guild.members.fetch();
        var converted = [];
        unconverted.forEach(member => {
            let topush = djsUserToUserClass(member.user);
            topush.djs = member;
            converted.push(topush);
        });

        return converted;
    }

    /**
     * 
     * @param {guild} guild
     * @param {name} name
     * @returns Member
     * @summary Returns member by name
     */
    async getMemberByName(guild, name) {
        var members = await this.getMembers(guild);
        var member = members.find(member => member.name === name);
        return djsUserToUserClass(member);
    }

    /**
     * 
     * @param {guild} guild
     * @param {id} id
     * @returns Member
     * @summary Returns member by id
     */
    async getMemberById(guild, id) {
        var members = await this.getMembers(guild);
        var member = members.find(member => member.id === id);
        return djsUserToUserClass(member.user);
    }

    /**
     * 
     * @summary Join voice channel
     * @param {*} channel 
     * @param {*} guild
     */
    async connectToChannel(channel, guild) {
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: guild.djs.voiceAdapterCreator,
        });
    
        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 30e3);
            return this.connection;
        } catch (error) {
            this.connection.destroy();
            throw error;
        }
    }  
    
    /**
     * 
     * @summary disconnect from channel
     */
    async disconnectFromChannel() {
        this.connection.disconnect();
    }

    /**
     *
     * @summary gets a role by id
     * @param {*} id
     */
    getRoleById(guild, id) {
        return guild.djs.roles.cache.find(r => r.id === id);
    }

    /**
     * 
     * @summary get all the roles from member
     * @param {*} guild
     * @param {*} member
     */
    getAllRolesFromMember(member) {
        
    }
}

module.exports = { Client };