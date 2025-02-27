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

    const squareCommand = new SlashCommandBuilder()
        .setName('square')
        .setDescription('Get a specific link based on the selected period')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Choose the period')
                .setRequired(true)
                .addChoices(
                    { name: 'Week', value: 'week' },
                    { name: 'Month', value: 'month' }
                ));

    try {
        await client.application.commands.set([loaderCommand.toJSON(), squareCommand.toJSON()]);
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
            console.error('failed to generate loader', error);
            await interaction.editReply({ content: 'failed to generate loader', ephemeral: true });
        }
    }

    if (interaction.commandName === 'square') {
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    
        if (!isAdmin) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }
    
        const period = interaction.options.getString('period');
    
        let link = '';
        if (period === 'week') {
            link = 'https://square.link/u/ZpgQHx1m';
        } else if (period === 'month') {
            link = 'https://square.link/u/Lnt6sOgD';
        }
    
        await interaction.reply({ content: link });
    }    
});

client.login(TOKEN);
