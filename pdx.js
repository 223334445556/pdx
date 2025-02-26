'use strict';
const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const moment = require('moment');
const path = require('path');

const tokenPart1 = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.Gt8A23.u';
const tokenPart2 = '50lOTQNWWFBZA7GjKSnjMy9cXg0a34vKI7G-g';
const TOKEN = tokenPart1 + tokenPart2;

const REQUIRED_ROLE = 'pdx user';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const loaderCommand = new SlashCommandBuilder()
        .setName('loader')
        .setDescription('pdx loader download');

    const hwidCommand = new SlashCommandBuilder()
        .setName('hwid')
        .setDescription('request a HWID reset')
        .addStringOption(option => option.setName('key').setDescription('provide your license key').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('provide your reason for the reset').setRequired(true))
        .addStringOption(option => option.setName('proof').setDescription('provide proof / screenshot links').setRequired(true));

    const postCommand = new SlashCommandBuilder()
        .setName('post')
        .setDescription('Post a message to a specific channel')
        .addStringOption(option => option.setName('channel_id').setDescription('Provide the channel ID').setRequired(true))
        .addStringOption(option => option.setName('body').setDescription('The content to post').setRequired(true));

    try {
        await client.application.commands.set([loaderCommand.toJSON()]);
        console.log('bot online & ready');
    } catch (err) {
        console.error('failed:', err);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'loader') {
        const hasRole = interaction.member.roles.cache.some(role => role.name === REQUIRED_ROLE);
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: "no active subscriptions.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({
            content: "generating loader...",
            ephemeral: true
        });

        const filePath = path.join(__dirname, 'pdx.exe');

        try {
            await interaction.editReply({
                content: "loader generated",
                files: [filePath],
                ephemeral: true
            });
        } catch (error) {
            console.error('failed to upload loader', error);
            await interaction.editReply({ content: 'failed to upload loader', ephemeral: true });
        }
    }
}),
client.login(TOKEN);
