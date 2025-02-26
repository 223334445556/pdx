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
        await client.application.commands.set([loaderCommand.toJSON(), hwidCommand.toJSON(), postCommand.toJSON()]);
        console.log('Commands registered.');
    } catch (err) {
        console.error('Failed to register commands:', err);
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

        const filePath = path.join(__dirname, 'pdx.exe');

        try {
            await interaction.reply({
                content: "loader:",
                files: [filePath],
                ephemeral: true
            });
        } catch (err) {
            console.error('Failed to upload loader:', err);
            await interaction.reply({ content: 'failed to upload loader', ephemeral: true });
        }
    }

    if (interaction.commandName === 'hwid') {
        const key = interaction.options.getString('key');
        const reason = interaction.options.getString('reason');
        const proof = interaction.options.getString('proof');
        const user = interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const resetTime = moment().format('MMMM Do YYYY, h:mm:ss a');

        const embed = {
            color: 0x0099ff,
            title: 'HWID Reset Request',
            description: `**User:** ${user.tag} (${user.id})\n**Key:** ${key}\n**Reason:** ${reason}\n**Proof:** ${proof}\n**Reset Time:** ${resetTime}`,
            fields: [
                {
                    name: 'Discord Info',
                    value: `**Username:** ${member.displayName}\n**ID:** ${user.id}\n**Joined:** ${member.joinedAt.toLocaleString()}\n**Roles:** ${member.roles.cache.map(role => role.name).join(', ')}`,
                },
            ],
            footer: { text: 'pdx' },
        };

        const acceptButton = new ButtonBuilder().setCustomId('accept_hwid').setLabel('Accept').setStyle(ButtonStyle.Success);
        const denyButton = new ButtonBuilder().setCustomId('deny_hwid').setLabel('Deny').setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(acceptButton, denyButton);

        const salesChannelId = '1342191970843492403';
        const salesChannel = interaction.guild.channels.cache.get(salesChannelId);

        if (salesChannel) {
            await salesChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Your HWID reset request has been sent.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Sales channel not found.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'post') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission.', ephemeral: true });
        }

        const channelId = interaction.options.getString('channel_id');
        const body = interaction.options.getString('body');
        const targetChannel = interaction.guild.channels.cache.get(channelId);

        if (targetChannel) {
            await targetChannel.send(body);
            await interaction.reply({ content: 'Message posted.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Channel not found.', ephemeral: true });
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId, member } = interaction;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    const message = interaction.message;
    const userId = message.embeds[0].description.match(/\((\d+)\)/)[1];
    const user = await client.users.fetch(userId);

    if (customId === 'accept_hwid') {
        await message.reply({ content: `HWID reset for ${user.tag} accepted by <@${interaction.user.id}>.` });
        await user.send(`Your HWID reset has been accepted.`);
    } else if (customId === 'deny_hwid') {
        await message.reply({ content: `HWID reset for ${user.tag} denied by <@${interaction.user.id}>.` });
        await user.send(`Your HWID reset was denied. Open a ticket for more info.`);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('accept_hwid').setLabel('Accept').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('deny_hwid').setLabel('Deny').setStyle(ButtonStyle.Danger).setDisabled(true)
    );

    await message.edit({ components: [row] });
});

client.login(TOKEN);
