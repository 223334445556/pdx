const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');  // Import the fs module to read the file
const moment = require('moment');  // Import moment.js for formatting the time

// Read the bot token from key.txt file (assuming it's split into parts in the file)
const tokenPart1 = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.Gt8A23.u';  // First part of the token
const tokenPart2 = '50lOTQNWWFBZA7GjKSnjMy9cXg0a34vKI7G-g';  // Second part of the token

// Reconstruct the token by skipping the first two characters of the second part
const TOKEN = tokenPart1 + tokenPart2;  // Skips the first two characters of the second part

// Print the token to debug (this will help verify that the token is read correctly)
console.log("Reconstructed Bot Token: ", TOKEN);  // This will print the token in the console

const LOADER_LINK = 'https://cdn.discordapp.com/attachments/1005573909829124148/1331423375926755349/pdx.exe?ex=67b91d25&is=67b7cba5&hm=760eb832e78b800e95c60ba6c6c7d39e27995562a300010a6a97104f976f75f3&';
const REQUIRED_ROLE = 'pdx user';  // Replace with the required role name

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,  // For reading message interactions
    ],
});


client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Register the /loader command
    const loaderCommand = new SlashCommandBuilder()
        .setName('loader')
        .setDescription('pdx loader download');

    // Register the /hwid command
    const hwidCommand = new SlashCommandBuilder()
        .setName('hwid')
        .setDescription('request a HWID reset')
        .addStringOption(option => 
            option.setName('key')
                .setDescription('provide your license key')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('provide your reason for the reset')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('proof')
                .setDescription('provide proof / screenshot links')
                .setRequired(true)
        );

    // Register the /post command
    const postCommand = new SlashCommandBuilder()
        .setName('post')
        .setDescription('Post a message to a specific channel')
        .addStringOption(option =>
            option.setName('channel_id')
                .setDescription('Provide the channel ID where the message will be posted')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('body')
                .setDescription('The content to post')
                .setRequired(true)
        );

    try {
        // Register the slash commands
        await client.application.commands.set([loaderCommand.toJSON(), hwidCommand.toJSON(), postCommand.toJSON()]);
        console.log('Slash commands "/loader", "/hwid", and "/post" have been registered.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    // Handle /loader command
    if (interaction.commandName === 'loader') {
        // Check if the user is an admin or has the required role
        const hasRole = interaction.member.roles.cache.some(role => role.name === REQUIRED_ROLE);
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: "No active subscriptions.", ephemeral: true });
        }

        // Respond with the loader link
        await interaction.reply({ 
            content: `loader - [click here](${LOADER_LINK})`, 
            ephemeral: true 
        });

        // Delete the user's /loader command message
        try {
            const originalMessage = interaction.message;

            if (originalMessage && originalMessage.deletable) {
                await originalMessage.delete();
            }
        } catch (error) {
            console.error("Failed to delete command message:", error);
        }
    }

    // Handle /hwid command
    if (interaction.commandName === 'hwid') {
        const key = interaction.options.getString('key');  // Get the key from the user input
        const reason = interaction.options.getString('reason');
        const proof = interaction.options.getString('proof');
        const user = interaction.user;  // Get the user info
        const member = interaction.guild.members.cache.get(user.id);  // Get the member object

        const resetTime = moment().format('MMMM Do YYYY, h:mm:ss a');  // Get the current time using moment.js

        // Create the message with a "panel" style
        const embed = {
            color: 0x0099ff,
            title: 'HWID Reset Request',
            description: `**User:** ${user.tag} (${user.id})\n**Key:** ${key}\n**Reason:** ${reason}\n**Proof:** ${proof}\n**Reset Time:** ${resetTime}`,
            fields: [
                {
                    name: 'Discord Information',
                    value: `**Username:** ${member.displayName}\n**ID:** ${user.id}\n**Joined at:** ${member.joinedAt.toLocaleString()}\n**Roles:** ${member.roles.cache.map(role => role.name).join(', ')}`,
                },
            ],
            footer: {
                text: 'pdx',
            },
        };

        // Create the Accept and Deny buttons
        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_hwid')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId('deny_hwid')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptButton, denyButton);

        // Send the embed with buttons for admins
        const salesChannelId = '1342191970843492403'; // Replace with actual channel ID
        const salesChannel = interaction.guild.channels.cache.get(salesChannelId);

        if (salesChannel) {
            console.log(`Sales Channel found: ${salesChannel.name}`);
            const message = await salesChannel.send({ 
                embeds: [embed],
                components: [row] 
            });
            await interaction.reply({ content: 'your hwid reset has been sent, make sure your direct messages are open.', ephemeral: true });
        } else {
            console.log('Sales Channel not found');
            await interaction.reply({ content: 'Sales channel not found.', ephemeral: true });
        }
    }

    // Handle /post command
    if (interaction.commandName === 'post') {
        // Check if the user is an admin
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const channelId = interaction.options.getString('channel_id');
        const body = interaction.options.getString('body');

        // Fetch the target channel
        const targetChannel = interaction.guild.channels.cache.get(channelId);
        
        if (targetChannel) {
            await targetChannel.send(body);  // Send the post content to the specified channel
            await interaction.reply({ content: 'Your message has been posted successfully!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'The specified channel was not found.', ephemeral: true });
        }
    }
});

// Handle button clicks for accept/deny
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId, member } = interaction;

    if (customId === 'accept_hwid' || customId === 'deny_hwid') {
        // Ensure only admins can accept or deny
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to perform this action.', ephemeral: true });
        }

        const message = interaction.message;  // Get the message where the button was clicked
        const userId = message.embeds[0].description.split('(')[1].split(')')[0];  // Extract the user ID from the embed description

        const user = await client.users.fetch(userId);

        if (customId === 'accept_hwid') {
            const admin = interaction.user;  // Get the admin who clicked "Accept"
            await message.reply({ content: `hwid reset for ${user.tag} has been accepted by <@${admin.id}>.`, ephemeral: true });
            await user.send(`your hwid reset for valorant has been accepted by <@${admin.id}>.`);
        } else if (customId === 'deny_hwid') {
            const admin = interaction.user;  // Get the admin who clicked "Deny"
            await message.reply({ content: `hwid reset for ${user.tag} has been denied by <@${admin.id}>.`, ephemeral: true });
            await user.send(`your hwid reset for valorant has been denied by <@${admin.id}>. open a ticket for more information.`);
        }

        // Disable buttons after being clicked by rebuilding the row with disabled buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('accept_hwid')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),  // Disable the accept button

            new ButtonBuilder()
                .setCustomId('deny_hwid')
                .setLabel('Deny')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)  // Disable the deny button
        );

        // Edit the message to disable the buttons
        await message.edit({ components: [row] });
    }
});

// Login with the reconstructed token
client.login(TOKEN);
