const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const TOKEN = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.GTkT9p.yuLAXOFPzmeTvEEVXR8h2flBCvrFzLoOrNCado';  // Replace with your bot token
const LOADER_LINK = 'https://cdn.discordapp.com/attachments/1005573909829124148/1331423375926755349/pdx.exe?ex=67b722e5&is=67b5d165&hm=e16b9155d81dca58ee3ec1de6d12d3c371b856cc9a39b165f3c519869708e3c4&';
const REQUIRED_ROLE = 'pdx user';  // Replace with the required role name

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Register the /loader command
    const command = new SlashCommandBuilder()
        .setName('loader')
        .setDescription('pdx loader download');

    try {
        // Register the slash command globally
        await client.application.commands.set([command.toJSON()]);
        console.log('Slash command "/loader" has been registered.');
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
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);  // Corrected way to check admin

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

            // Delete the original /loader message from the user
            if (originalMessage && originalMessage.deletable) {
                await originalMessage.delete();
            }
        } catch (error) {
            console.error("Failed to delete command message:", error);
        }
    }
});

client.login(TOKEN);
