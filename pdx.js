const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');

// Bot Token
const tokenPart1 = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.Gt8A23.u';
const tokenPart2 = '50lOTQNWWFBZA7GjKSnjMy9cXg0a34vKI7G-g';
const TOKEN = tokenPart1 + tokenPart2;

// Config
const LOADER_LINK = 'https://cdn.discordapp.com/attachments/1005573909829124148/1331423375926755349/pdx.exe?ex=67b722e5&is=67b5d165&hm=e16b9155d81dca58ee3ec1de6d12d3c371b856cc9a39b165f3c519869708e3c4&';
const REQUIRED_ROLE = 'pdx user';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function refreshCommands(interaction) {
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    if (!interaction.member || !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const commands = [
        new SlashCommandBuilder().setName('loader').setDescription('pdx loader download'),
        new SlashCommandBuilder()
            .setName('hwid')
            .setDescription('Request a HWID reset')
            .addStringOption(option => option.setName('key').setDescription('Provide your license key').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Provide your reason').setRequired(true))
            .addStringOption(option => option.setName('proof').setDescription('Provide screenshots or proof to back your serials changing').setRequired(true)),
        new SlashCommandBuilder()
            .setName('post')
            .setDescription('Post a message to a specific channel')
            .addStringOption(option => option.setName('channel_id').setDescription('Provide the channel ID').setRequired(true))
            .addStringOption(option => option.setName('body').setDescription('The content to post').setRequired(true)),
        new SlashCommandBuilder().setName('refresh').setDescription('Refresh all slash commands and remove unused ones'),
    ];

    try {
        await interaction.client.application.commands.set(commands);
        await interaction.reply({ content: 'All slash commands have been refreshed successfully!', ephemeral: true });
    } catch (error) {
        console.error('Error refreshing commands:', error);
        await interaction.reply({ content: 'An error occurred while refreshing commands.', ephemeral: true });
    }
}


client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    await refreshCommands({ client, reply: async () => {} });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'refresh') {
        await refreshCommands(interaction);
    }

    if (interaction.commandName === 'loader') {
        const hasRole = interaction.member.roles.cache.some(role => role.name === REQUIRED_ROLE);
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: 'No active subscriptions.', ephemeral: true });
        }

        await interaction.reply({ content: `loader - [click here](${LOADER_LINK})`, ephemeral: true });
    }

    if (interaction.commandName === 'hwid') {
        const key = interaction.options.getString('key');
        const reason = interaction.options.getString('reason');
        const proof = interaction.options.getString('proof');
        const user = interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        const resetTime = moment().format('MMMM Do YYYY, h:mm:ss a');
        const salesChannelId = '1342191970843492403';
        const salesChannel = interaction.guild.channels.cache.get(salesChannelId);

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
            footer: { text: 'pdx' },
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_hwid').setLabel('Accept').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('deny_hwid').setLabel('Deny').setStyle(ButtonStyle.Danger)
        );

        if (salesChannel) {
            await salesChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Your HWID reset request has been sent.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Sales channel not found.', ephemeral: true });
        }
    }
});

client.login(TOKEN);
