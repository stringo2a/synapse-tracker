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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const VERSION_API =
    'https://clientsettings.roblox.com/v2/client-version/WindowsPlayer';

let previousVersion = null;

// ================= SETTINGS =================
const OLD_MEMBER_ROLE_NAME = "Old Member";
const FIVE_MONTHS = 1000 * 60 * 60 * 24 * 150;

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

// ================= OLD MEMBER CHECK =================
async function checkOldMembers() {

    client.guilds.cache.forEach(async (guild) => {

        try {

            await guild.members.fetch();

            let role = guild.roles.cache.find(
                r => r.name === OLD_MEMBER_ROLE_NAME
            );

            if (!role) {

                role = await guild.roles.create({
                    name: OLD_MEMBER_ROLE_NAME,
                    color: 'Gold'
                });
            }

            guild.members.cache.forEach(async (member) => {

                if (member.user.bot) return;

                if (member.roles.cache.has(role.id)) return;

                const joinedAt = member.joinedAt;

                if (!joinedAt) return;

                const timeInServer = Date.now() - joinedAt.getTime();

                if (timeInServer >= FIVE_MONTHS) {

                    try {

                        await member.roles.add(role);

                        console.log(
                            `Added Old Member to ${member.user.tag}`
                        );

                    } catch (err) {

                        console.log(
                            `Failed to add role to ${member.user.tag}`
                        );
                    }
                }
            });

        } catch (err) {

            console.log("Old member check error:", err);
        }
    });
}

// ================= READY =================
client.once('clientReady', () => {

    console.log(`${client.user.tag} is online`);

    client.user.setStatus('idle');

    checkRobloxUpdate();
    setInterval(checkRobloxUpdate, 60000);

    checkOldMembers();
    setInterval(checkOldMembers, 60 * 60 * 1000);
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
/check
/help
/ban
/unban
/kick
/timeout
/invite
/dm
/dm_all
/announce
/remove_all_ms_role
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

        // ===== UNBAN =====
        if (cmd === 'unban') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {

                return interaction.reply({
                    content: "No permission.",
                    ephemeral: true
                });
            }

            const userId = interaction.options.getString('userid');

            try {

                await interaction.guild.members.unban(userId);

                return interaction.reply({
                    content: `Unbanned user ID: ${userId}`
                });

            } catch {

                return interaction.reply({
                    content: "Failed to unban user.",
                    ephemeral: true
                });
            }
        }

        // ===== KICK =====
        if (cmd === 'kick') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {

                return interaction.reply({
                    content: "No permission.",
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser('user');

            try {

                const member = await interaction.guild.members.fetch(user.id);

                if (!member.kickable) {

                    return interaction.reply({
                        content: "I cannot kick this user.",
                        ephemeral: true
                    });
                }

                await member.kick();

                return interaction.reply({
                    content: `${user.tag} kicked.`
                });

            } catch {

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
`You've been invited!

https://discord.gg/eZp6rrMraK`
                );

                return interaction.reply({
                    content: `Invite sent to ${user.tag}`,
                    ephemeral: true
                });

            } catch {

                return interaction.reply({
                    content: "Cannot DM this user.",
                    ephemeral: true
                });
            }
        }

        // ===== DM =====
        if (cmd === 'dm') {

            const user = interaction.options.getUser('user');
            const message = interaction.options.getString('message');

            try {

                await user.send(message);

                return interaction.reply({
                    content: `DM sent to ${user.tag}.`,
                    ephemeral: true
                });

            } catch {

                return interaction.reply({
                    content: "Failed to DM user.",
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

        // ===== ANNOUNCE =====
        if (cmd === 'announce') {

            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');

            try {

                await channel.send(message);

                return interaction.reply({
                    content: `Announcement sent in ${channel}.`,
                    ephemeral: true
                });

            } catch {

                return interaction.reply({
                    content: "Failed to send announcement.",
                    ephemeral: true
                });
            }
        }

        // ===== REMOVE ALL MEMBERS WITH ROLE =====
        if (cmd === 'remove_all_ms_role') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {

                return interaction.reply({
                    content: "No permission.",
                    ephemeral: true
                });
            }

            const role = interaction.options.getRole('role');

            await interaction.reply({
                content: `Removing all members with role: ${role.name}...`,
                ephemeral: true
            });

            let removed = 0;
            let failed = 0;

            await interaction.guild.members.fetch();

            const membersWithRole =
                interaction.guild.members.cache.filter(member =>
                    member.roles.cache.has(role.id)
                );

            for (const [, member] of membersWithRole) {

                if (member.user.bot) continue;

                try {

                    await member.ban({
                        reason: `Mass removed by ${interaction.user.tag}`
                    });

                    removed++;

                } catch (err) {

                    failed++;
                    console.log(err);
                }
            }

            await interaction.followUp({
                content:
`Finished.

✅ Removed: ${removed}
❌ Failed: ${failed}`,
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