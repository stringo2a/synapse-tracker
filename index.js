require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

const axios = require('axios');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= APIs =================
const VERSION_API =
    'https://clientsettings.roblox.com/v2/client-version/WindowsPlayer';

const VELOCITY_API =
    'https://realvelocity.xyz/assets/current_version.txt';

// ================= FILE =================
const VERSION_FILE = './velocity_version.txt';

let previousVersion = null;

// ================= SETTINGS =================
const OLD_MEMBER_ROLE_NAME = "Old Member";

// 5 months
const FIVE_MONTHS = 1000 * 60 * 60 * 24 * 150;

console.log("Bot starting...");

// ================= ROBLOX UPDATE CHECK =================
async function checkRobloxUpdate() {

    try {

        const res = await axios.get(VERSION_API);

        const currentVersion =
            res.data.clientVersionUpload;

        if (!previousVersion) {

            previousVersion = currentVersion;
            return;
        }

        if (currentVersion !== previousVersion) {

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔴 Roblox Updated')
                .addFields(
                    {
                        name: 'Previous',
                        value: previousVersion,
                        inline: true
                    },
                    {
                        name: 'Current',
                        value: currentVersion,
                        inline: true
                    }
                )
                .setTimestamp();

            client.guilds.cache.forEach(async guild => {

                const channel =
                    guild.channels.cache.find(
                        c => c.name === "announcements"
                    );

                if (channel) {

                    channel.send({
                        embeds: [embed]
                    });
                }

                const workingChannel =
                    guild.channels.cache.find(
                        c => c.name === "working"
                    );

                if (workingChannel) {

                    await workingChannel.setName(
                        "patched"
                    );
                }
            });

            previousVersion = currentVersion;
        }

    } catch (err) {

        console.log(
            "Roblox check error:",
            err.message
        );
    }
}

// ================= VELOCITY UPDATE CHECK =================
async function checkVelocityUpdate() {

    try {

        const velocityRes =
            await axios.get(VELOCITY_API);

        const currentVelocityVersion =
            velocityRes.data.trim();

        if (!fs.existsSync(VERSION_FILE)) {

            fs.writeFileSync(
                VERSION_FILE,
                currentVelocityVersion
            );

            console.log(
                `Saved first version: ${currentVelocityVersion}`
            );

            return;
        }

        const savedVersion =
            fs.readFileSync(
                VERSION_FILE,
                'utf8'
            ).trim();

        if (savedVersion === currentVelocityVersion) {

            console.log(
                `Current version: ${currentVelocityVersion}`
            );

            return;
        }

        const robloxRes =
            await axios.get(VERSION_API);

        const robloxVersion =
            robloxRes.data.clientVersionUpload;

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Synapse X Updated!')
            .setDescription(
                'Relaunch Synapse or grab a fresh install in #synapse-v2'
            )
            .addFields(
                {
                name: ':rocket: Velocity Version',
                value:
                `\`${currentVelocityVersion}\``,
                inline: true
                },
                {
                name: ':video_game: Supported Roblox Version',
                value:
                `\`${robloxVersion}\``,
                inline: true
                },
                {
                 name: ':clipboard: Reason',
                value:
                `Velocity updated from \`${savedVersion}\` to \`${currentVelocityVersion}\``
                },
                {
                name: ':pencil: Changelog',
                value:
                'Updated for the latest Roblox'
                }
            )
            .setFooter({
                text: 'realvelocity.xyz'
            })
            .setTimestamp();

        client.guilds.cache.forEach(async guild => {

            const channel =
                guild.channels.cache.find(
                    c => c.name === 'syn-changelogs'
                );

            if (channel) {

                channel.send({
                    embeds: [embed]
                });
            }

            const patchedChannel =
                guild.channels.cache.find(
                    c => c.name === "patched"
                );

            if (patchedChannel) {

                await patchedChannel.setName(
                    "working"
                );
            }
        });

        fs.writeFileSync(
            VERSION_FILE,
            currentVelocityVersion
        );

        console.log(
            `Updated from ${savedVersion} to ${currentVelocityVersion}`
        );

    } catch (err) {

        console.log(
            'Velocity update error:',
            err.message
        );
    }
}

// ================= OLD MEMBER CHECK =================
async function checkOldMembers() {

    for (const guild of client.guilds.cache.values()) {

        try {

            await guild.members.fetch();

            let role =
                guild.roles.cache.find(
                    r => r.name === OLD_MEMBER_ROLE_NAME
                );

            if (!role) {

                role =
                    await guild.roles.create({
                        name: OLD_MEMBER_ROLE_NAME,
                        color: 'Gold'
                    });
            }

            for (const member of guild.members.cache.values()) {

                if (member.user.bot) continue;

                if (
                    member.roles.cache.has(role.id)
                ) continue;

                if (!member.joinedAt) continue;

                const timeInServer =
                    Date.now() -
                    member.joinedAt.getTime();

                if (timeInServer >= FIVE_MONTHS) {

                    await member.roles.add(role);
                }
            }

        } catch (err) {

            console.log(err);
        }
    }
}

// ================= READY =================
client.once('ready', async () => {

    console.log(
        `${client.user.tag} is online`
    );

    client.user.setStatus('idle');

    checkRobloxUpdate();
    setInterval(
        checkRobloxUpdate,
        60000
    );

    checkVelocityUpdate();
    setInterval(
        checkVelocityUpdate,
        60000
    );

    await checkOldMembers();

    setInterval(
        checkOldMembers,
        60 * 60 * 1000
    );
});

// ================= MESSAGE EVENTS =================
client.on(
    'messageCreate',
    async (message) => {

        if (message.author.bot) return;

        // ===== CRASH DETECTION =====
        if (
            message.channel.name ===
            'support-issues'
        ) {

            const crashRegex =
                /\b(crash|crashing|crashed)\b/i;

            if (
                crashRegex.test(
                    message.content
                )
            ) {

                await message.reply(
`If *Roblox* is **crashing** after injection or execution, that might be a **Velocity API issue** or **Synapse might be down!**
[Quick Fix](https://discord.com/channels/1441199616266862737/1497926569363116175/1497928254894510181)
-# Reinstall Roblox if issues persist.`
                );
            }
        }

        // ===== SAY-HI SOFTBAN =====
        if (
            message.channel.name ===
            'say-hi'
        ) {

            try {

                const member =
                    message.member;

                await member.ban({
                    deleteMessageSeconds: 604800
                });

                await message.guild.members.unban(
                    member.user.id
                );

            } catch (err) {

                console.log(
                    'Softban error:',
                    err.message
                );
            }
        }
    }
);

// ================= COMMANDS =================
client.on(
    'interactionCreate',
    async (interaction) => {

        try {

            if (
                !interaction.isChatInputCommand()
            ) return;

            const cmd =
                interaction.commandName;

            // ===== HELP =====
            if (cmd === 'help') {

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                "Help Menu"
                            )
                            .setColor(
                                "Blue"
                            )
                            .setDescription(`
/check
/help
/members
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

            // ===== MEMBERS =====
            if (cmd === 'members') {

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                "Server Members"
                            )
                            .setColor(
                                "Green"
                            )
                            .setDescription(
`👥 Total Members: **${interaction.guild.memberCount}**`
                            )
                    ]
                });
            }

            // ===== CHECK =====
            if (cmd === 'check') {

                const res =
                    await axios.get(
                        VERSION_API
                    );

                return interaction.reply({
                    content:
`Roblox Version: \`${res.data.clientVersionUpload}\``
                });
            }

            // ===== BAN =====
            if (cmd === 'ban') {

                const user =
                    interaction.options.getUser(
                        'user'
                    );

                const member =
                    await interaction.guild.members.fetch(
                        user.id
                    );

                await member.ban();

                return interaction.reply(
`${user.tag} banned.`
                );
            }

            // ===== UNBAN =====
            if (cmd === 'unban') {

                const userId =
                    interaction.options.getString(
                        'userid'
                    );

                await interaction.guild.members.unban(
                    userId
                );

                return interaction.reply(
`Unbanned ${userId}`
                );
            }

            // ===== KICK =====
            if (cmd === 'kick') {

                const user =
                    interaction.options.getUser(
                        'user'
                    );

                const member =
                    await interaction.guild.members.fetch(
                        user.id
                    );

                await member.kick();

                return interaction.reply(
`${user.tag} kicked.`
                );
            }

            // ===== TIMEOUT =====
            if (cmd === 'timeout') {

                const user =
                    interaction.options.getUser(
                        'user'
                    );

                const minutes =
                    interaction.options.getInteger(
                        'minutes'
                    );

                const member =
                    await interaction.guild.members.fetch(
                        user.id
                    );

                await member.timeout(
                    minutes * 60000
                );

                return interaction.reply(
`${user.tag} timed out for ${minutes} minutes.`
                );
            }

            // ===== INVITE =====
            if (cmd === 'invite') {

                const userId =
                    interaction.options.getString(
                        'userid'
                    );

                const user =
                    await client.users.fetch(
                        userId
                    );

                await user.send(
`You've been invited!

https://discord.gg/eZp6rrMraK`
                );

                return interaction.reply({
                    content:
`Invite sent to ${user.tag}`,
                    ephemeral: true
                });
            }

            // ===== DM =====
            if (cmd === 'dm') {

                const user =
                    interaction.options.getUser(
                        'user'
                    );

                const text =
                    interaction.options.getString(
                        'message'
                    );

                await user.send(text);

                return interaction.reply({
                    content:
`DM sent to ${user.tag}.`,
                    ephemeral: true
                });
            }

            // ===== DM ALL =====
            if (cmd === 'dm_all') {

                const dmMessage =
                    interaction.options.getString(
                        'message'
                    );

                await interaction.reply({
                    content:
                        "Sending DMs...",
                    ephemeral: true
                });

                const members =
                    await interaction.guild.members.fetch();

                let sent = 0;
                let failed = 0;

                for (const [, member] of members) {

                    if (member.user.bot) continue;

                    try {

                        await member.send(
                            dmMessage
                        );

                        sent++;

                    } catch {

                        failed++;
                    }
                }

                await interaction.followUp({
                    content:
`Done.
Sent: ${sent}
Failed: ${failed}`,
                    ephemeral: true
                });
            }

            // ===== ANNOUNCE =====
            if (cmd === 'announce') {

                const targetChannel =
                    interaction.options.getChannel(
                        'channel'
                    );

                const text =
                    interaction.options.getString(
                        'message'
                    );

                await targetChannel.send(
                    text
                );

                return interaction.reply({
                    content:
`Announcement sent in ${targetChannel}.`,
                    ephemeral: true
                });
            }

            // ===== REMOVE ROLE =====
            if (cmd === 'remove_all_ms_role') {

                const role =
                    interaction.options.getRole(
                        'role'
                    );

                await interaction.reply({
                    content:
`Removing role "${role.name}" from all members...`,
                    ephemeral: true
                });

                let removed = 0;

                await interaction.guild.members.fetch();

                const membersWithRole =
                    interaction.guild.members.cache.filter(
                        member =>
                            member.roles.cache.has(
                                role.id
                            )
                    );

                for (const [, member] of membersWithRole) {

                    if (member.user.bot) continue;

                    try {

                        await member.roles.remove(
                            role
                        );

                        removed++;

                    } catch {}
                }

                await interaction.followUp({
                    content:
`✅ Removed role from ${removed} members.`,
                    ephemeral: true
                });
            }

        } catch (err) {

            console.log(
                "Command error:",
                err
            );

            if (!interaction.replied) {

                interaction.reply({
                    content:
                        "Error executing command.",
                    ephemeral: true
                });
            }
        }
    }
);

// ================= LOGIN =================
client.login(process.env.TOKEN);