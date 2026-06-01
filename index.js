require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
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
const VERSION_FILE =
'./velocity_version.txt';

let previousVersion = null;

// ================= SETTINGS =================
const OLD_MEMBER_ROLE_NAME =
"Old Member";

const FIVE_MONTHS =
1000 * 60 * 60 * 24 * 150;

console.log("Bot starting...");

// ================= ROBLOX UPDATE =================
async function checkRobloxUpdate() {

    try {

        const res =
            await axios.get(VERSION_API);

        const currentVersion =
            res.data.clientVersionUpload;

        if (!previousVersion) {

            previousVersion =
                currentVersion;

            return;
        }

        if (
            currentVersion !==
            previousVersion
        ) {

            const embed =
                new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(
                        '🔴 Roblox Updated'
                    )
                    .addFields(
                        {
                            name: 'Previous',
                            value:
                                previousVersion,
                            inline: true
                        },
                        {
                            name: 'Current',
                            value:
                                currentVersion,
                            inline: true
                        }
                    )
                    .setTimestamp();

            client.guilds.cache.forEach(
                async guild => {

                    const channel =
                        guild.channels.cache.find(
                            c =>
                                c.name ===
                                "announcements"
                        );

                    if (channel) {

                        channel.send({
                            embeds: [embed]
                        });
                    }

                    const workingChannel =
                        guild.channels.cache.find(
                            c =>
                                c.name ===
                                "working"
                        );

                    if (workingChannel) {

                        await workingChannel.setName(
                            "patched"
                        );
                    }
                }
            );

            previousVersion =
                currentVersion;
        }

    } catch (err) {

        console.log(
            "Roblox check error:",
            err.message
        );
    }
}

// ================= VELOCITY UPDATE =================
async function checkVelocityUpdate() {

    try {

        const velocityRes =
            await axios.get(
                VELOCITY_API
            );

        const currentVelocityVersion =
            velocityRes.data.trim();

        if (
            !fs.existsSync(
                VERSION_FILE
            )
        ) {

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

        if (
            savedVersion ===
            currentVelocityVersion
        ) {

            return;
        }

        const robloxRes =
            await axios.get(
                VERSION_API
            );

        const robloxVersion =
            robloxRes.data.clientVersionUpload;

        const embed =
            new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(
':white_check_mark: Synapse X Updated!'
                )
                .setDescription(
'Relaunch Synapse or grab a fresh install in <#1497931009554124862>'
                )
                .addFields(
                    {
                        name:
':rocket: Velocity Version',
                        value:
`\`${currentVelocityVersion}\``,
                        inline: true
                    },
                    {
                        name:
':video_game: Supported Roblox Version',
                        value:
`\`${robloxVersion}\``,
                        inline: true
                    },
                    {
                        name:
':clipboard: Reason',
                        value:
`Velocity updated from \`${savedVersion}\` to \`${currentVelocityVersion}\``
                    },
                    {
                        name:
':pencil: Changelog',
                        value:
'Updated for the latest Roblox'
                    }
                )
                .setFooter({
                    text:
'realvelocity.xyz'
                })
                .setTimestamp();

        client.guilds.cache.forEach(
            async guild => {

                const channel =
                    guild.channels.cache.find(
                        c =>
                            c.name ===
                            'syn-changelogs'
                    );

                if (channel) {

                    channel.send({
                        embeds: [embed]
                    });
                }

                const patchedChannel =
                    guild.channels.cache.find(
                        c =>
                            c.name ===
                            "patched"
                    );

                if (patchedChannel) {

                    await patchedChannel.setName(
                        "working"
                    );
                }
            }
        );

        fs.writeFileSync(
            VERSION_FILE,
            currentVelocityVersion
        );

    } catch (err) {

        console.log(
'Velocity update error:',
            err.message
        );
    }
}

// ================= OLD MEMBER =================
async function checkOldMembers() {

    for (
        const guild of
        client.guilds.cache.values()
    ) {

        try {

            await guild.members.fetch();

            let role =
                guild.roles.cache.find(
                    r =>
                        r.name ===
                        OLD_MEMBER_ROLE_NAME
                );

            if (!role) {

                role =
                    await guild.roles.create({
                        name:
                            OLD_MEMBER_ROLE_NAME,
                        color:
                            'Gold'
                    });
            }

            for (
                const member of
                guild.members.cache.values()
            ) {

                if (
                    member.user.bot
                ) continue;

                if (
                    member.roles.cache.has(
                        role.id
                    )
                ) continue;

                if (
                    !member.joinedAt
                ) continue;

                const timeInServer =
                    Date.now() -
                    member.joinedAt.getTime();

                if (
                    timeInServer >=
                    FIVE_MONTHS
                ) {

                    await member.roles.add(
                        role
                    );
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

    client.user.setStatus('do not disturb');

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
    async message => {

        if (
            message.author.bot
        ) return;

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
                    deleteMessageSeconds:
                        604800
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
// ================= PREFIX COMMANDS =================
client.on(
    'messageCreate',
    async message => {

        if (message.author.bot) return;

        const prefix = '.';

        if (
            !message.content.startsWith(prefix)
        ) return;

        const args =
            message.content
                .slice(prefix.length)
                .trim()
                .split(/ +/);

        const cmd =
            args.shift()?.toLowerCase();

        // ================= GET USER =================
        async function getUser(arg) {

            if (!arg) return null;

            const mention =
                arg.match(/^<@!?(\d+)>$/);

            const userId =
                mention
                    ? mention[1]
                    : arg;

            try {

                const member =
                    await message.guild.members.fetch(
                        userId
                    );

                return member;

            } catch {

                return null;
            }
        }

        // ===== HELP =====
        if (cmd === 'help') {

            return message.reply(`
.help
.check
.members
.ban
.unban
.kick
.timeout
.invite
.dm
.dm_all
.announce
.remove_all_ms_role
            `);
        }

        // ===== MEMBERS =====
        if (cmd === 'members') {

            return message.reply(
`👥 Total Members: ${message.guild.memberCount}`
            );
        }

        // ===== CHECK =====
        if (cmd === 'check') {

            try {

                const res =
                    await axios.get(
                        VERSION_API
                    );

                return message.reply(
`Roblox Version: \`${res.data.clientVersionUpload}\``
                );

            } catch {

                return message.reply(
                    '❌ Failed to fetch version.'
                );
            }
        }

        // ===== BAN =====
        if (cmd === 'ban') {

            try {

                const member =
                    await getUser(args[0]);

                if (!member) {

                    return message.reply(
                        '❌ Could not find user.'
                    );
                }

                const reason =
                    args.slice(1).join(' ') ||
                    'No reason provided';

                await member.ban({
                    reason:
`You have been banned. Reason: ${reason}`
                });

                return message.reply(
`✅ ${member.user.tag} has been banned.`
                );

            } catch {

                return message.reply(
                    '❌ Could not ban user.'
                );
            }
        }

        // ===== UNBAN =====
        if (cmd === 'unban') {

            try {

                const userId =
                    args[0];

                if (!userId) {

                    return message.reply(
                        '❌ Provide user ID.'
                    );
                }

                await message.guild.members.unban(
                    userId
                );

                return message.reply(
`✅ Unbanned ${userId}`
                );

            } catch {

                return message.reply(
                    '❌ Could not unban user.'
                );
            }
        }

        // ===== KICK =====
        if (cmd === 'kick') {

            try {

                const member =
                    await getUser(args[0]);

                if (!member) {

                    return message.reply(
                        '❌ Could not find user.'
                    );
                }

                const reason =
                    args.slice(1).join(' ') ||
                    'No reason provided';

                await member.kick(
`You have been kicked. Reason: ${reason}`
                );

                return message.reply(
`✅ ${member.user.tag} has been kicked.`
                );

            } catch {

                return message.reply(
                    '❌ Failed to kick user.'
                );
            }
        }

        // ===== TIMEOUT =====
        if (cmd === 'timeout') {

            try {

                const member =
                    await getUser(args[0]);

                if (!member) {

                    return message.reply(
                        '❌ Could not find user.'
                    );
                }

                const minutes =
                    parseInt(args[1]);

                if (isNaN(minutes)) {

                    return message.reply(
                        '❌ Invalid minutes.'
                    );
                }

                const reason =
                    args.slice(2).join(' ') ||
                    'No reason provided';

                await member.timeout(
                    minutes * 60000,
`You have been timed out. Reason: ${reason}`
                );

                return message.reply(
`✅ ${member.user.tag} timed out for ${minutes} minutes.`
                );

            } catch {

                return message.reply(
                    '❌ Failed to timeout user.'
                );
            }
        }

        // ===== INVITE =====
        if (cmd === 'invite') {

            try {

                const userId =
                    args[0];

                const user =
                    await client.users.fetch(
                        userId
                    );

                await user.send(
`You've been invited!

https://discord.gg/eZp6rrMraK`
                );

                return message.reply(
`✅ Invite sent to ${user.tag}`
                );

            } catch {

                return message.reply(
                    '❌ Failed to send invite.'
                );
            }
        }

        // ===== DM =====
        if (cmd === 'dm') {

            try {

                const target =
                    args.shift();

                if (!target) {

                    return message.reply(
                        '❌ Provide a user.'
                    );
                }

                let user;

                // ===== USER BY ID =====
                if (/^\d+$/.test(target)) {

                    user =
                        await client.users.fetch(
                            target
                        ).catch(() => null);

                } else {

                    // ===== USER BY MENTION =====
                    user =
                        message.mentions.users.first();
                }

                if (!user) {

                    return message.reply(
                        '❌ Could not find user.'
                    );
                }

                const dmMessage =
                    args.join(' ');

                const attachment =
                    message.attachments.first();

                if (
                    !dmMessage &&
                    !attachment
                ) {

                    return message.reply(
                        '❌ Provide message or file.'
                    );
                }

                // ===== SEND LONG TEXT =====
                if (dmMessage) {

                    const chunks =
                        dmMessage.match(
                            /[\s\S]{1,1900}/g
                        );

                    for (const chunk of chunks) {

                        await user.send(chunk);
                    }
                }

                // ===== SEND FILE =====
                if (attachment) {

                    await user.send({
                        files: [
                            attachment.url
                        ]
                    });
                }

                return message.reply(
`✅ DM sent to ${user.tag}.`
                );

            } catch (err) {

                console.log(err);

                return message.reply(
                    '❌ Failed to DM user.'
                );
            }
        }

        // ===== DM ALL =====
        if (cmd === 'dm_all') {

            try {

                const dmMessage =
                    args.join(' ');

                const attachment =
                    message.attachments.first();

                if (
                    !dmMessage &&
                    !attachment
                ) {

                    return message.reply(
                        '❌ Provide message or file.'
                    );
                }

                const members =
                    await message.guild.members.fetch();

                let sent = 0;
                let failed = 0;

                for (
                    const [, member]
                    of members
                ) {

                    if (
                        member.user.bot
                    ) continue;

                    try {

                        // ===== TEXT =====
                        if (dmMessage) {

                            const chunks =
                                dmMessage.match(
                                    /[\s\S]{1,1900}/g
                                );

                            for (const chunk of chunks) {

                                await member.send(
                                    chunk
                                );
                            }
                        }

                        // ===== FILE =====
                        if (attachment) {

                            await member.send({
                                files: [
                                    attachment.url
                                ]
                            });
                        }

                        sent++;

                    } catch {

                        failed++;
                    }
                }

                return message.reply(
`✅ Done.

Sent: ${sent}
Failed: ${failed}`
                );

            } catch (err) {

                console.log(err);

                return message.reply(
                    '❌ Failed to DM all.'
                );
            }
        }

        // ===== ANNOUNCE =====
        if (cmd === 'announce') {

            try {

                const channelId =
                    args[0];

                const text =
                    args.slice(1).join(' ');

                const channel =
                    message.guild.channels.cache.get(
                        channelId
                    );

                if (!channel) {

                    return message.reply(
                        '❌ Invalid channel.'
                    );
                }

                await channel.send(text);

                return message.reply(
`✅ Announcement sent in ${channel}.`
                );

            } catch {

                return message.reply(
                    '❌ Failed to send announcement.'
                );
            }
        }
    }
);
// ================= SLASH COMMANDS =================
client.on(
    'interactionCreate',
    async interaction => {

        try {

            if (
                !interaction.isChatInputCommand()
            ) return;

            const cmd =
                interaction.commandName;

            await interaction.deferReply();

            // ===== HELP =====
            if (cmd === 'help') {

                return interaction.editReply(`
/help
/check
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
                `);
            }

            // ===== MEMBERS =====
            if (cmd === 'members') {

                return interaction.editReply(
`👥 Total Members: ${interaction.guild.memberCount}`
                );
            }

            // ===== CHECK =====
            if (cmd === 'check') {

                const res =
                    await axios.get(
                        VERSION_API
                    );

                return interaction.editReply(
`Roblox Version: \`${res.data.clientVersionUpload}\``
                );
            }

            // ===== BAN =====
            if (cmd === 'ban') {

                try {

                    const user =
                        interaction.options.getUser('user');

                    const reason =
                        interaction.options.getString('reason') ||
                        'No reason provided';

                    const member =
                        await interaction.guild.members.fetch(
                            user.id
                        );

                    await member.ban({
                        reason: reason
                    });

                    return interaction.editReply(
`✅ ${user.tag} has been banned. Reason: ${reason}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Could not ban user.'
                    );
                }
            }

            // ===== UNBAN =====
            if (cmd === 'unban') {

                try {

                    const userId =
                        interaction.options.getString(
                            'userid'
                        );

                    await interaction.guild.members.unban(
                        userId
                    );

                    return interaction.editReply(
`✅ Unbanned ${userId}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Could not unban user.'
                    );
                }
            }

            // ===== KICK =====
            if (cmd === 'kick') {

                try {

                    const user =
                        interaction.options.getUser('user');

                    const reason =
                        interaction.options.getString('reason') ||
                        'No reason provided';

                    const member =
                        await interaction.guild.members.fetch(
                            user.id
                        );

                    await member.kick(reason);

                    return interaction.editReply(
`✅ ${user.tag} has been kicked. Reason: ${reason}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to kick user.'
                    );
                }
            }

            // ===== TIMEOUT =====
            if (cmd === 'timeout') {

                try {

                    const user =
                        interaction.options.getUser('user');

                    const minutes =
                        interaction.options.getInteger(
                            'minutes'
                        );

                    const reason =
                        interaction.options.getString('reason') ||
                        'No reason provided';

                    const member =
                        await interaction.guild.members.fetch(
                            user.id
                        );

                    await member.timeout(
                        minutes * 60000,
                        reason
                    );

                    return interaction.editReply(
`✅ ${user.tag} has been timed out for ${minutes} minutes. Reason: ${reason}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to timeout user.'
                    );
                }
            }

            // ===== ANNOUNCE =====
            if (cmd === 'announce') {

                try {

                    const channel =
                        interaction.options.getChannel(
                            'channel'
                        );

                    const text =
                        interaction.options.getString(
                            'message'
                        );

                    await channel.send(text);

                    return interaction.editReply(
`✅ Announcement sent in ${channel}.`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to send announcement.'
                    );
                }
            }

            // ===== DM =====
            if (cmd === 'dm') {

                try {

                    const user =
                        interaction.options.getUser(
                            'user'
                        );

                    const text =
                        interaction.options.getString(
                            'message'
                        );

                    await user.send({
                        content: text
                    });

                    return interaction.editReply(
`✅ DM sent to ${user.tag}.`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to DM user.'
                    );
                }
            }

            // ===== DM ALL =====
            if (cmd === 'dm_all') {

                try {

                    const dmMessage =
                        interaction.options.getString(
                            'message'
                        );

                    const members =
                        await interaction.guild.members.fetch();

                    let sent = 0;
                    let failed = 0;

                    for (
                        const [, member]
                        of members
                    ) {

                        if (
                            member.user.bot
                        ) continue;

                        try {

                            await member.send(
                                dmMessage
                            );

                            sent++;

                        } catch {

                            failed++;
                        }
                    }

                    return interaction.editReply(
`Done.
Sent: ${sent}
Failed: ${failed}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to DM all.'
                    );
                }
            }

            // ===== INVITE =====
            if (cmd === 'invite') {

                try {

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

                    return interaction.editReply(
`✅ Invite sent to ${user.tag}`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to send invite.'
                    );
                }
            }

            // ===== REMOVE ROLE =====
            if (
                cmd ===
                'remove_all_ms_role'
            ) {

                try {

                    const role =
                        interaction.options.getRole(
                            'role'
                        );

                    let removed = 0;

                    await interaction.guild.members.fetch();

                    const membersWithRole =
                        interaction.guild.members.cache.filter(
                            member =>
                                member.roles.cache.has(
                                    role.id
                                )
                        );

                    for (
                        const [, member]
                        of membersWithRole
                    ) {

                        if (
                            member.user.bot
                        ) continue;

                        try {

                            await member.roles.remove(
                                role
                            );

                            removed++;

                        } catch {}
                    }

                    return interaction.editReply(
`✅ Removed role from ${removed} members.`
                    );

                } catch {

                    return interaction.editReply(
'❌ Failed to remove role.'
                    );
                }
            }

        } catch (err) {

            console.log(
                "Command error:",
                err
            );
        }
    }
);

// ================= LOGIN =================
client.login(process.env.TOKEN);