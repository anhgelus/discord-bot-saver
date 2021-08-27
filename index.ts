const { Client } = require("discord.js")

const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"]})

client.once("ready", () => {
    console.log("Client is ready")
})

client.on("messageCreate", async msg => {
    if (msg.content.startsWith(`<@!${client.user.id}> save`) ||
        msg.content.startsWith(`<@${client.user.id}> save`)
    ) {
        args = msg.content.split(" ")

        if (args.length < 3) {
            await msg.reply({ content: "You need to specify a channel !", ephemeral: true })
            return
        }

        channel = msg.mentions.channels.first() || client.channels.cache.get(args[2])

        if (!channel) {
            await msg.reply({ content: "Channel not found !" })
            return
        }


        const loading = "<a:loading:828006699537137705>"
        let loading_message = await msg.reply(`${loading} Getting all ${msg.channel}'s messages.`)

        let messages = await msg.channel.messages.fetch({ limit: 100 })
        let last_msg = messages.last().id
        while (true) {
            const messages_ = await msg.channel.messages.fetch({ before: last_msg, limit: 100 })
            if (!messages_ || !messages_.last()) break

            messages = messages.concat(messages_)
            last_msg = messages.last().id
        }

        let msg_count = 0
        messages.each(() => msg_count++)

        const webhook = await channel.createWebhook("Discord Channel Backup")
        messages = messages.map(msg => msg).reverse()

        loading_message = await loading_message.edit(`${loading} Sending messages. 0% done.`)

        for ([i, msg_] of messages.entries()) {
            if (!msg_.system) {
                const files = msg_.attachments.map(a => a)

                while (true) {
                    let try_count = 0
                    const max_tries = 5
                    try {
                        if (msg_.content) {
                            await webhook.send({ 
                                content: msg_.content, 
                                embeds: msg_.embeds, 
                                files: files,
                                components: msg_.components,
                
                                username: msg_.author.username,
                                avatarURL: msg_.author.avatarURL({ dynamic: true })
                            })
                        } else {
                            await webhook.send({
                                embeds: msg_.embeds, 
                                files: files,
                                components: msg_.components,
                
                                username: msg_.author.username,
                                avatarURL: msg_.author.avatarURL({ dynamic: true })
                            })
                        }
                        break
                    } catch {
                        try_count++
                        if (try_count >= max_tries) break
                    }
                }


                const msg_content = `${loading} Sending messages. ${Math.round((i + 1) / msg_count * 100)}% done.`
                if (loading_message.content !== msg_content) loading_message = await loading_message.edit(msg_content)
            }
        }

        await webhook.delete()
        await loading_message.edit("<:yes:828021810858688552> Done !")

    }
})


client.login("SUPER MEGA SECRET DISCORD BOT TOKEN")
