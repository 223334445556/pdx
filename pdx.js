'use strict';
const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const moment = require('moment');
const path = require('path');

const tokenPart1 = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.Gt8A23.u';
const tokenPart2 = '50lOTQNWWFBZA7GjKSnjMy9cXg0a34vKI7G-g';
const TOKEN = tokenPart1 + tokenPart2;

const REQUIRED_ROLE = 'pdx user';
const LOG_CHANNEL_ID = '1342191970843492403';  // Log channel ID
const SERVER_ID = '1322652117952892938';  // Server ID

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

    const roleCommand = new SlashCommandBuilder()
        .setName('role')
        .setDescription('Assign a role for a specified period of time')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to assign role')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Time period (minute, week, month)')
                .setRequired(true)
                .addChoices(
                    { name: 'minute', value: 'minute' },
                    { name: 'week', value: 'week' },
                    { name: 'month', value: 'month' }
                ));

    try {
        await client.application.commands.set([loaderCommand.toJSON(), squareCommand.toJSON(), roleCommand.toJSON()]);
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

    if (interaction.commandName === 'role') {
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isAdmin) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const time = interaction.options.getString('time');

        const role = interaction.guild.roles.cache.find(role => role.name === REQUIRED_ROLE);
        if (!role) return interaction.reply({ content: 'Role not found!', ephemeral: true });

        let duration;
        if (time === 'minute') {
            duration = 1;  // 1 minute
        } else if (time === 'week') {
            duration = 7 * 24 * 60;  // 1 week in minutes
        } else if (time === 'month') {
            duration = 30 * 24 * 60;  // 1 month in minutes
        }

        // Add role
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add(role);
        interaction.reply({ content: `${user.tag} has been assigned the role for ${time}.`, ephemeral: true });

        // Log the action
        const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);
        logChannel.send(`${user.tag} has been given the "${REQUIRED_ROLE}" role for ${time} by ${interaction.user.tag}.`);

        // Remove role after the specified duration
        setTimeout(async () => {
            await member.roles.remove(role);
            logChannel.send(`${user.tag}'s "${REQUIRED_ROLE}" role has been removed after ${time}.`);
        }, duration * 60000);  // Convert duration to milliseconds
    }
});

client.login(TOKEN);
