require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const VERSION_API =
    'https://clientsettings.roblox.com/v2/client-version/WindowsPlayer';

let previousVersion = null;

console.log("Bot starting...");

// ================= ROBLOX UPDATE CHECK =================
async function checkRobloxUpdate() {
    try {

        const res = await axios.get(VERSION_API);
        const currentVersion = res.data.clientVersionUpload;

        if (!previousVersion) {
            previousVersion = currentVersion;
            return;
        }

        if (currentVersion !== previousVersion) {

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔴 Roblox Updated')
                .addFields(
                    { name: 'Previous', value: previousVersion, inline: true },
                    { name: 'Current', value: currentVersion, inline: true }
                )
                .setTimestamp();

            client.guilds.cache.forEach(guild => {
                const channel = guild.channels.cache.find(
                    c => c.name === "announcements"
                );

                if (channel) {
                    channel.send({ embeds: [embed] });
                }
            });

            previousVersion = currentVersion;
        }

    } catch (err) {
        console.log("Roblox check error:", err.message);
    }
}

// ================= READY =================
client.once('ready', () => {
    console.log(`${client.user.tag} is online`);

    checkRobloxUpdate();
    setInterval(checkRobloxUpdate, 60000);
});

// ================= CRASH DETECTION =================
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (message.channel.name !== 'support-issues') return;

    const crashRegex = /\b(crash|crashing|crashed)\b/i;

    if (crashRegex.test(message.content)) {

        await message.reply(
`If *Roblox* is **crashing** after injection or execution, that might be a **Velocity API issue** or **Synapse might be down!**
[Quick Fix](https://discord.com/channels/1441199616266862737/1497926569363116175/1497928254894510181)
-# Reinstall Roblox if issues persist.`
        );
    }
});

// ================= COMMANDS =================
client.on('interactionCreate', async (interaction) => {

    try {

        if (!interaction.isChatInputCommand()) return;

        const cmd = interaction.commandName;

        // ===== HELP =====
        if (cmd === 'help') {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Help Menu")
                        .setColor("Blue")
                        .setDescription(`
/check - Roblox version
/help - Help menu
/ban - Ban user
/kick - Kick user
/timeout - Timeout user
/invite - DM invite link
/dm_all - DM all members
/set_announcement
                        `)
                ]
            });
        }

        // ===== CHECK =====
        if (cmd === 'check') {

            const res = await axios.get(VERSION_API);

            return interaction.reply({
                content: `Roblox Version: \`${res.data.clientVersionUpload}\``
            });
        }
            // ===== SET STATUS =====
if (cmd === 'set_status') {

    const index = interaction.options.getInteger('index');
    const status = interaction.options.getString('status');

    return interaction.reply({
        content: `App #${index} status changed to: ${status}`,
        ephemeral: true
    });
}
        // ===== BAN =====
        if (cmd === 'ban') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({
                    content: "No permission.",
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);

            await member.ban();

            return interaction.reply(`${user.tag} banned.`);
        }
// ===== SET ANNOUNCEMENT =====
if (cmd === 'set_announcement') {

    const index = interaction.options.getInteger('index');
    const text = interaction.options.getString('text');

    return interaction.reply({
        content: `Announcement for app #${index} set to:\n${text}`,
        ephemeral: true
    });
}
        // ===== KICK =====
if (cmd === 'kick') {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return interaction.reply({
            content: "You don't have permission to kick members.",
            ephemeral: true
        });
    }

    const user = interaction.options.getUser('user');

    try {

        const member = await interaction.guild.members.fetch(user.id);

        if (!member) {
            return interaction.reply({
                content: "Member not found.",
                ephemeral: true
            });
        }

        if (!member.kickable) {
            return interaction.reply({
                content: "I cannot kick this user. Their role may be higher than mine.",
                ephemeral: true
            });
        }

        await member.kick();

        return interaction.reply({
            content: `${user.tag} has been kicked.`,
            ephemeral: false
        });

    } catch (err) {

        console.log("Kick error:", err);

        return interaction.reply({
            content: "Failed to kick user.",
            ephemeral: true
        });
    }
}

        // ===== TIMEOUT =====
        if (cmd === 'timeout') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({
                    content: "No permission.",
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser('user');
            const minutes = interaction.options.getInteger('minutes');

            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(minutes * 60000);

            return interaction.reply(
                `${user.tag} timed out for ${minutes} minutes.`
            );
        }

        // ===== INVITE =====
        if (cmd === 'invite') {

            const userId = interaction.options.getString('userid');

            try {

                const user = await client.users.fetch(userId);

                await user.send(
`You've been invited to **${interaction.guild.name}**!

https://discord.gg/eZp6rrMraK`
                );

                return interaction.reply({
                    content: `Invite sent to ${user.tag}`,
                    ephemeral: true
                });

            } catch (err) {

                console.log("Invite error:", err);

                return interaction.reply({
                    content: "Cannot DM this user.",
                    ephemeral: true
                });
            }
        }

        // ===== DM ALL =====
        if (cmd === 'dm_all') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({
                    content: "Administrator only.",
                    ephemeral: true
                });
            }

            const dmMessage = interaction.options.getString('message');

            await interaction.reply({
                content: "Sending DMs...",
                ephemeral: true
            });

            const members = await interaction.guild.members.fetch();

            let sent = 0;
            let failed = 0;

            for (const [, member] of members) {

                if (member.user.bot) continue;

                try {

                    await member.send(dmMessage);
                    sent++;

                } catch {

                    failed++;
                }
            }

            await interaction.followUp({
                content: `Done.\nSent: ${sent}\nFailed: ${failed}`,
                ephemeral: true
            });
        }

    } catch (err) {

        console.log("Command error:", err);

        if (!interaction.replied) {
            interaction.reply({
                content: "Error executing command.",
                ephemeral: true
            });
        }
    }

});

// ================= LOGIN =================
client.login(process.env.TOKEN);