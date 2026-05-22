require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

console.log("Starting command deployment...");

// ================= COMMANDS =================
const commands = [

    new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check Roblox version'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help menu'),

    new SlashCommandBuilder()
        .setName('members')
        .setDescription('Get server member count'),

    // ===== BAN =====
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        ),

    // ===== UNBAN =====
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID to unban')
                .setRequired(true)
        ),

    // ===== KICK =====
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        ),

    // ===== TIMEOUT =====
    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to timeout')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Minutes')
                .setRequired(true)
        ),

    // ===== INVITE =====
    new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Send server invite in DMs')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID')
                .setRequired(true)
        ),

    // ===== APPS =====
    new SlashCommandBuilder()
        .setName('add_app')
        .setDescription('Add an app')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('App name')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('list_apps')
        .setDescription('List all apps'),

    new SlashCommandBuilder()
        .setName('remove_app')
        .setDescription('Remove app by index')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('App index')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('rename_app')
        .setDescription('Rename app')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('App index')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('New name')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('set_status')
        .setDescription('Set app status')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('App index')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('status')
                .setDescription('online/offline/updating')
                .setRequired(true)
        ),
        new SlashCommandBuilder()
    .setName('dm_all')
    .setDescription('DM all server members')
    .addStringOption(option =>
        option.setName('message')
            .setDescription('Message to send')
            .setRequired(true)
    ),
    new SlashCommandBuilder()
        .setName('bulk_status')
        .setDescription('Set all apps status')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('online/offline/updating')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('set_announcement')
        .setDescription('Set app announcement')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('App index')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Announcement text')
                .setRequired(true)
        )

].map(cmd => cmd.toJSON());

// ================= REST SETUP =================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ================= DEPLOY =================
(async () => {
    try {

        console.log("Deploying commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Commands deployed successfully!");

    } catch (err) {
        console.error("Failed to deploy commands:", err);
    }
})();