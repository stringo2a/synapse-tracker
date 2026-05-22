require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

console.log("Starting command deployment...");

// ================= COMMANDS =================
const commands = [

    // ===== CHECK =====
    new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check Roblox version'),

    // ===== HELP =====
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help menu'),

    // ===== MEMBERS =====
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
                .setDescription('User ID')
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
        .setDescription('Send invite in DM')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID')
                .setRequired(true)
        ),

    // ===== DM =====
    new SlashCommandBuilder()
        .setName('dm')
        .setDescription('DM a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message')
                .setRequired(true)
        ),

    // ===== DM ALL =====
    new SlashCommandBuilder()
        .setName('dm_all')
        .setDescription('DM all members')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message')
                .setRequired(true)
        ),

    // ===== ANNOUNCE =====
    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send announcement')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message')
                .setRequired(true)
        ),

    // ===== ADD APP =====
    new SlashCommandBuilder()
        .setName('add_app')
        .setDescription('Add an app')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('App name')
                .setRequired(true)
        ),

    // ===== LIST APPS =====
    new SlashCommandBuilder()
        .setName('list_apps')
        .setDescription('List all apps'),

    // ===== REMOVE APP =====
    new SlashCommandBuilder()
        .setName('remove_app')
        .setDescription('Remove app')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('App index')
                .setRequired(true)
        ),

    // ===== RENAME APP =====
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

    // ===== SET STATUS =====
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

    // ===== BULK STATUS =====
    new SlashCommandBuilder()
        .setName('bulk_status')
        .setDescription('Set all apps status')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('online/offline/updating')
                .setRequired(true)
        ),

    // ===== SET ANNOUNCEMENT =====
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
                .setDescription('Announcement')
                .setRequired(true)
        )

].map(cmd => cmd.toJSON());

// ================= REST =================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ================= DEPLOY =================
(async () => {

    try {

        console.log("Deploying global commands...");

        await rest.put(
            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),
            { body: commands }
        );

        console.log("Commands deployed globally!");

    } catch (err) {

        console.error("Deploy error:", err);
    }

})();