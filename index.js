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
const THREE_MONTHS = 1000 * 60 * 60 * 24 * 90;

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

            // Create role if not exists
            if (!role) {

                role = await guild.roles.create({
                    name: OLD_MEMBER_ROLE_NAME,
                    color: 'Gold',
                    reason: 'Old member role auto-created'
                });

                console.log(`Created role in ${guild.name}`);
            }

            guild.members.cache.forEach(async (member) => {

                // Ignore bots
                if (member.user.bot) return;

                // Already has role
                if (member.roles.cache.has(role.id)) return;

                // Join date
                const joinedAt = member.joinedAt;

                if (!joinedAt) return;

                const timeInServer = Date.now() - joinedAt.getTime();

                // 3 months+
                if (timeInServer >= THREE_MONTHS) {

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
client.once('ready', () => {

    console.log(`${client.user.tag} is online`);

    // Roblox tracker
    checkRobloxUpdate();
    setInterval(checkRobloxUpdate, 60000);

    // Old member checker
    checkOldMembers();

    // Check every 1 hour
    setInterval(checkOldMembers, 60 * 60 * 1000);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);