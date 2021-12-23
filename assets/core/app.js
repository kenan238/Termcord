/* App */
const { Events, Controller, UserMessage, ArgTypeNames, SystemMessage } = require("./controller.js");
const { Logger, LogTypes } = require("./logger.js");
const blessed = require("reblessed");

const logger = new Logger('./app.log');

class App {
    constructor (token) {
        this.screen = blessed.screen();
        this.controller = null;
        this.history = [];
        this.historyPos = 0;
        this.logo = `
        ###         ###
       ##    #####    ##
       #################
       ####  #####  ####
       ###    ###    ###
      ####    ###    ####
     ######  #####  ######
     #####################
      #####   ####   ####
        ####        ###
       === TermCord ===
        `;
        this.startLoading(token);

    }
    createNewController(token) {
        this.controller = new Controller(token);
    }
    clearScreen () {
        this.screen.destroy();
        this.screen = blessed.screen();
    }
    formatChannel(curChnl, channel) {
        var prefix = "";

        if (channel.type == "GUILD_TEXT")
            prefix = "#";
        else if (channel.type == "GUILD_VOICE")
            prefix = "VC";
        else if (channel.type == "GUILD_CATEGORY")
            prefix = "CATEG";
        else if (channel.type == "GUILD_NEWS")
            prefix = "NEWS";
        else if (channel.type == "GUILD_STORE")
            prefix = "STORE";
        else if (channel.type == "DM")
            prefix = "DM";
        else if (channel.type == "GROUP_DM")
            prefix = "GRP";
        else
            prefix = "UNKNWN";
        
        var formatted = `${prefix} ➤ ${channel.name}{yellow-fg}:{/yellow-fg}{blue-fg}${channel.id}{/blue-fg}`;    

        logger.log(LogTypes.INFO, 'CHANNEL_FORMATTER', `Updating: CURRENT_CHANNEL=${curChnl.id} CHANNEL_TO_FORMAT=${channel.id}`);

        if(curChnl.id == channel.id)
            return `{inverse}${formatted}{/inverse}`;
        return formatted;
    }
    loadMessages() {
        this.controller.messages = [];
        try {
            this.controller.currentChannel.messages.fetch({ limit: 100 }).then(messages => {
                messages.forEach(message => {
                    let msg = new UserMessage(`@${message.author.username}#${message.author.discriminator}`, message.content);
                    this.controller.addMessage(msg);
                });
                this.screen.render();
            });
        } catch(e) {
            if (this.controller.currentChannel.type === "GUILD_VOICE") {
                var members = [...this.controller.currentChannel.members.values()];
                for(let i = 0; i < members.length; i++) { 
                    var member = members[i];
                    var muted = member.voice.selfMute ? "{red-fg}Muted{/red-fg}" : "{inverse}Unmuted{/inverse}";
                    var deafen = member.voice.selfDeaf ? "{magenta-fg}Deafen{/magenta-fg}" : "{inverse}Undeafen{/inverse}";
                    
                    var Smuted = member.voice.serverMute ? "{red-fg}Server Muted{/red-fg}" : "{inverse}Not Server Muted{/inverse}";
                    var Sdeafen = member.voice.serverDeaf ? "{magenta-fg}Server Deafen{/magenta-fg}" : "{inverse}Not Server Deafen{/inverse}";
                    this.controller.addMessage(new UserMessage(`@${member.user.username}#${member.user.discriminator}`, `${muted} | ${deafen} || ${Smuted} | ${Sdeafen}`));
                }
            }
            else
                this.controller.addMessage(new SystemMessage("Failed to load messages :( f in chat"));
        }
        this.screen.render();
    }
    startLoading (token) {
        this.screen.title = "Termcord - Connecting...";
        var loadingBox = blessed.loading({
            parent: this.screen,
            top: "center",
            left: "center",
            width: "80%",
            height: "100%",
            border: "line",
            tags: true,
            content: "Loading...",
            style: {
                bg: "black",
                fg: "white",
                border: {
                    fg: "red"
                },
                text: {
                    fg: "white"
                }
            }
        });
        // progress bar in blessed loading box
        var progressBar = blessed.progressbar({
            parent: loadingBox,
            top: "bottom",
            valign: "middle",
            right: "",
            width: "70%",
            height: "20%",
            border: "line",
            tags: true,
            filled: "0",
            ch: "█",
            style: {
                bg: "black",
                fg: "yellow"
            }
        });
        // print discord logo in ascii
        var logoBox = blessed.box({
            parent: loadingBox,
            top: "",
            width: "27%",
            height: "90%",
            border: "none",
            tags: true,
            content: `Loading...\n${this.logo}`,
            style: {
                bg: "black",
                fg: "green"
            }
        });
        
        
        
        this.screen.append(loadingBox);
        this.screen.render();
        this.createNewController(token);
        this.controller.client.dClient.on("ready", ()=> {
            progressBar.setProgress(100);
            this.screen.render();
            setTimeout(()=> {
                this.clearScreen();
                this.startApp();
            }, 500)
        });
    }
    startApp () {
        this.screen.title = "Termcord";
        this.controller._goToGuild(this.controller.client.getGuilds()[0]);

        this.appMain();
    }
    getInfo() {
        // Get guilds
        var guilds = this.controller.client.getGuilds();

        // Get channels
        var channels = this.controller.client.getChannels(this.controller.currentServer);

        // Members
        var members = this.controller.client.getMembers(this.controller.currentServer);

        return {
            "guilds": guilds, 
            "channels": channels,
            "members": members
        };
    }
    serverListBoxContent(guild) {
        var name = "➤ "+guild.name;

        if(this.controller.currentServer.id == guild.id)
            return `{inverse}${name}{/inverse}`;
        return name;
    }
    channelListBoxContent(channel) {
        var formatted = this.formatChannel(this.controller.currentChannel, channel) + "\n";
        if(channel.type == "GUILD_CATEGORY") {
            formatted += "\n";
            channel.children.forEach(c => {
                formatted += "{magenta-bg}  └{/magenta-bg}"+this.formatChannel(this.controller.currentChannel, c) + "\n";
            });
        }
        return channel.parent ? "" : formatted;
    }
    userListBoxContent(member) {
        var name = member.username;
        var discriminator = member.discriminator;

        var status = member.djs.presence?.status || "ERR";
        var statusStr = "";


        // get status color
        if(status == "online")
            statusStr = `{green-fg}ONLINE{/green-fg}`;
        else if(status == "idle")
            statusStr = `{yellow-fg}IDLE{/yellow-fg}`;
        else if(status == "dnd")
            statusStr = `{red-fg}DND{/red-fg}`;
        else
        statusStr = `{inverse}OFFLINE{/inverse}`;


        var name = `{blue-fg}@{/blue-fg}{bold}${name}{/bold}#{yellow-fg}${discriminator}{/yellow-fg} ${statusStr}`;
        var res = member.bot ? name+" [BOT]" : name;
        return res;
    }
    appMain() {
        var mainBox = blessed.box({
            parent: this.screen,
            top: "center",
            left: "center",
            width: "100%",
            height: "100%",
            border: "bg",
            tags: true,
            content: "Loading...",
            style: {
                bg: "black",
                fg: "white",
                border: {
                    bg: "red"
                },
                text: {
                    fg: "white"
                }
            }
        });
        var serverListBox = blessed.list({
            parent: mainBox,
            top: "",
            left: "",
            width: "10%",
            height: "94%",
            border: "line",
            tags: true,
            content: "Loading Servers...",
            style: {
                bg: "black",
                fg: "white",
                border: {
                    fg: "blue"
                },
                text: {
                    fg: "white"
                }
            }
        });
        var userListBox = blessed.list({
            parent: mainBox,
            top: "",
            right: "",
            width: "20%",
            height: "94%",
            border: "line",
            tags: true,
            content: "Loading Members...",
            style: {
                bg: "gray",
                fg: "white",
                border: {
                    fg: "yellow"
                },
                text: {
                    fg: "white"
                }
            },
            scrollable: true
        });
        var channelListBox = blessed.box({
            parent: mainBox,
            top: "",
            left: "10%",
            width: "20%",
            height: "94%",
            border: "line",
            tags: true,
            content: "Loading Channel List...",
            style: {
                bg: "black",
                fg: "white",
                border: {
                    fg: "green"
                },
                text: {
                    fg: "white"
                }
            },                
            scrollable: true, 
            scrollbar: {      
              style: {        
                bg: 'blue' ,
                bar: {
                    bg: 'red'
                } 
              }               
            }
        });

        // make chat box
        var chatBox = blessed.box({
            parent: mainBox,
            top: "10%",
            left: "30%",
            width: "48%",
            height: "74%",
            border: "line",
            tags: true,
            content: "",
            style: {
                bg: "black",
                fg: "white",
                border: {
                    fg: "red"
                },
                text: {
                    fg: "white"
                }
            },                
            scrollable: true, 
            scrollbar: {      
              style: {        
                bg: 'yellow' ,
                bar: {
                    bg: 'red'
                } 
              }               
            }
        });
        // make input box
        var inputBox = blessed.textbox({
            parent: mainBox,
            top: "84%",
            left: "30%",
            width: "48%",
            tags: true,
            height: "10%",
            border: "bg",
            content: "Loading Input...",
            style: {
                bg: "yellow",
                fg: "black",
                border: {
                    bg: "yellow"
                },
                text: {
                    fg: "white"
                }
            },
            inputOnFocus: true
        });
        // make command output
        var commandOutput = blessed.box({
            parent: mainBox,
            top: "0%",
            left: "30%",
            width: "48%",
            height: "10%",
            border: "bg",
            tags: true,
            content: "",
            style: {
                bg: "blue",
                fg: "black",
                border: {
                    bg: "blue"
                },
                text: {
                    fg: "black"
                }
            }
        });

        inputBox.focus();

        this.screen.append(mainBox);
        this.screen.render();
        
        // load info
        var info = this.getInfo();

        serverListBox.setContent(info.guilds.map(guild => {
            return this.serverListBoxContent(guild);
        }).join("\n"));
        channelListBox.setContent(info.channels.map(channel => {
            return this.channelListBoxContent(channel);
        }).join("\n\n"));

        
        info.members.then(members => {
            userListBox.setContent(members.map(member => {
                return this.userListBoxContent(member);
            }).join("\n\n"));
            this.screen.render();
        }); 
        
        inputBox.on("submit", () => {
            var message = inputBox.getValue();
            this.history.push(message);
            this.historyPos = this.history.length - 1;
            if(message.startsWith("/")) {
                var output = this.controller.runCommand(message) || "The command did not return any output.";
                if(output.includes("<REFRESH_TERMCORD_UI>")) {
                    renderUI_event();
                    output = "Refresh event fired.";
                }
                commandOutput.setContent(output);
                inputBox.setValue("");
                inputBox.focus();
                this.screen.render();
                return;
            }

            try {
                this.controller.sendMessage(message);
            } catch (e) {
                this.controller.addMessage(new SystemMessage('Cannot send message'));
                logger.log(LogTypes.HANDLED_ERROR, 'MESSAGE_SENDER', `Cannot send message: ${e}`);
            }
            inputBox.setValue("");
            inputBox.focus();
            this.screen.render();
        });
        // tab autocomplete
        inputBox.key(["tab"], () => {
            var message = inputBox.getValue().replace("/", "");
            inputBox.setValue("");
            var cmd = Object.values(this.controller.commands).filter(c => c.name.startsWith(message.replace(/\s+/g, '')));

            inputBox.setValue(cmd.length > 0 ? "/"+cmd[0].name : "/");
            inputBox.cursor = inputBox.value.length;
            inputBox.focus();
            this.screen.render();

        });
        inputBox.key(["up"], () => {
            if(this.historyPos - 1 >= 0)
                this.historyPos--;
            if(this.history.length > 0) {
                logger.log(LogTypes.INFO, 'MESSAGE_SENDER', `History: ${this.history}`);
                inputBox.setValue(this.history[this.historyPos]);
                commandOutput.setContent(`{green-bg}History pos{/green-bg}: ${this.historyPos}/${this.history.length}`);
            }
            inputBox.focus();
            this.screen.render();
        });
        inputBox.key(["down"], () => {
            if(this.historyPos + 1 >= 0)
                this.historyPos++;
            if(this.history.length > 0) {
                logger.log(LogTypes.INFO, 'MESSAGE_SENDER', `History: ${this.history}`);
                inputBox.setValue(this.history[this.historyPos]);
                commandOutput.setContent(`{green-bg}History pos{/green-bg}: ${this.historyPos}/${this.history.length}`);
            }
            inputBox.focus();
            this.screen.render();
        });
        
        // show suggestions in realtime
        // inputBox.on("keypress", (ch, key) => {
        //     var message = inputBox.getValue().replace("/", "").replace(/\s+/g, '');
        //     var cmd = Object.values(this.controller.commands).filter(c => c.name.startsWith(message));
        //     if (cmd.length > 0 && message != "") {
        //         var cmdName = cmd[0].name;
        //         var argsStr = "";

        //         for(var argtype in cmd[0].args)
        //             argsStr += `{green-fg}[${ArgTypeNames[cmd[0].args[argtype]]}]{/green-fg} {gray-fg}{/gray-fg}`;
        //         var fullCmd = "/"+cmdName+" "+argsStr;
        //         inputBox.setValue(message + fullCmd.slice(inputBox.getValue().length, fullCmd.length));
        //     }
        // });
        
        this.loadMessages();
        
        this.controller.addEventListener(Events.onMessage, event => {
            var djs_message = event.data["djs_message"];
            var termcord_message = event.data["termcord_message"];
            
            var msg = termcord_message.formatWithColors();
            
            chatBox.setContent(chatBox.content + "\n" + msg);
            chatBox.setScrollPerc(100);
            this.screen.render();
        });
        this.controller.addEventListener(Events.onChatReRenderNeeded, event => {
            chatBox.setContent("");
            for(var message in this.controller.messages) { 
                var msg = message.formatWithColors();
                chatBox.setContent(chatBox.content + "\n" + msg);
                chatBox.setScrollPerc(100);
            }
            this.screen.render();
        });

        var renderUI_event = event => {
            logger.log(LogTypes.INFO, 'RENDER_UI_EVENT', `Refreshing UI...`);
            var info = this.getInfo();

            channelListBox.setContent("");
            chatBox.setContent("");
            userListBox.setContent("");

            serverListBox.setContent(info.guilds.map(guild => {
                return this.serverListBoxContent(guild);
            }).join("\n"));
            channelListBox.setContent(info.channels.map(channel => {
                return this.channelListBoxContent(channel);
            }).join("\n\n"));
            
            info.members.then(members => {
                userListBox.setContent(members.map(member => {
                    return this.userListBoxContent(member);
                }).join("\n\n"));
                this.screen.render();
            });
            this.loadMessages();
        };
        this.controller.addEventListener(Events.onChannelSwitch, renderUI_event);
        this.controller.addEventListener(Events.onGuildSwitch, renderUI_event);
        this.screen.render();
    }
}

module.exports = {
    App
}
