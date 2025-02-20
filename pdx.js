const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');  // Import the fs module to read the file

// Read the bot token from key.txt file (assuming it's split into parts in the file)
const tokenPart1 = 'MTM0MTQ1OTgyMTY2NDI3NjU0MQ.Gt8A23.u';  // First part of the token
const tokenPart2 = '50lOTQNWWFBZA7GjKSnjMy9cXg0a34vKI7G-g';  // Second part of the token

// Reconstruct the token by skipping the first two characters of the second part
const TOKEN = tokenPart1 + tokenPart2;  // Skips the first two characters of the second part

// Print the token to debug (this will help verify that the token is read correctly)
console.log("Reconstructed Bot Token: ", TOKEN);  // This will print the token in the console

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

// Login with the reconstructed token
client.login(TOKEN);
