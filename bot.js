const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require("discord.js");
const imaps = require("imap-simple");
const { type } = require("os");
const tokenPart1 = 'MTEwMzM5NTA0MzIzMTkzMjQ4Ng.GoqAg8.E';
const tokenPart2 = 'iSwhiHa74Z90jcmX-wQvOgdYFyTTb7SJPdUpQ';
const TOKEN = tokenPart1 + tokenPart2;
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages]
});

// 🔹 Temporary storage for credentials
const userCredentials = new Map();

client.once("ready", () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
});

// 🔹 Handle "Get Code" Button Click
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "request_code") {
        const modal = new ModalBuilder()
            .setCustomId("email_login")
            .setTitle("Enter Your Email Details");

        const emailInput = new TextInputBuilder()
            .setCustomId("email")
            .setLabel("Email Address")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("example@paradox5m.net")
            .setRequired(true);

        const passwordInput = new TextInputBuilder()
            .setCustomId("password")
            .setLabel("Email Password")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Your email password")
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(emailInput);
        const row2 = new ActionRowBuilder().addComponents(passwordInput);

        modal.addComponents(row1, row2);
        await interaction.showModal(modal);
    }

    // 🔹 Handle "Retry" button
    if (interaction.customId.startsWith("retry_code")) {
        await interaction.deferReply({ ephemeral: true }); // Defer reply to prevent timeout
    
        const userId = interaction.user.id;
        const credentials = userCredentials.get(userId);

        const sessionEmbed = new EmbedBuilder()
            .setTitle("⚠️ Your session expired. Please re-enter your details.")
            .setColor("Orange")
    
        if (!credentials) {
            await interaction.editReply({ components: [sessionEmbed] });
            return;
        }
    
        const { email, password } = credentials;
    
        try {
            const code = await getRockstarCode(email, password);
            if (code) {
                const foundEmbed = new EmbedBuilder()
                    .setTitle("✅ We Found Your Code!")
                    .setDescription(`Here is your verification code:\n\n\`\`\`${code}\`\`\``)
                    .setColor("Green")
                    .setFooter({ text: "Copy and paste this code to verify your account." });
    
                const retryButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`retry_code`)
                        .setLabel("Get Code Again")
                        .setStyle(ButtonStyle.Primary)
                );
    
                await interaction.editReply({ embeds: [foundEmbed], components: [retryButton] });
            } else {
                await sendRetryButton(interaction);
            }
        } catch (error) {
            console.error("IMAP Error:", error);
            await sendRetryButton(interaction);
        }
    }
    
});

// 🔹 Handle Email Submission & Fetch Rockstar Code
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "email_login") return;

    const userId = interaction.user.id;
    const email = interaction.fields.getTextInputValue("email");
    const password = interaction.fields.getTextInputValue("password");

    // 🔹 Store credentials temporarily
    userCredentials.set(userId, { email, password });
    console.log("getting code for: " + email + " : " + password + " [" + userId + "]");
    await interaction.deferReply({ ephemeral: true }); // Defer reply immediately

    const embed = new EmbedBuilder()
        .setTitle("🔄 Fetching your verification code...")
        .setColor("Green");
    
    await interaction.editReply({ embeds: [embed] });
    
    try {
        const code = await getRockstarCode(email, password);
        if (typeof code === "string") {
            const embed = new EmbedBuilder()
                .setTitle("✅ We Found Your Code!")
                .setDescription(`Here is your verification code:\n\n\`\`\`${code}\`\`\``)
                .setColor("Green")
                .setFooter({ text: "Copy and paste this code to verify your account." });
    
            const retryButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`retry_code`)
                    .setLabel("Get Code Again")
                    .setStyle(ButtonStyle.Primary)
            );
    
            await interaction.editReply({ embeds: [embed], components: [retryButton] });
        } else if (typeof code === "number") {
            await sendErrorMessage(interaction);
        } else {
            await sendRetryButton(interaction);
        }
    } catch (error) {
        console.error("IMAP Error:", error);
        await sendErrorMessage(interaction);
    }    
});

// 🔹 Function to Retrieve Rockstar Verification Code
async function getRockstarCode(email, password) {
    const config = {
        imap: {
            user: email,
            password: password,
            host: "mail.paradox5m.net", // Change if using Gmail, Outlook, etc.
            port: 993,
            tls: true,
            authTimeout: 10000
        }
    };

    return new Promise((resolve, reject) => {
        imaps.connect(config)
            .then((connection) => {
                return connection.openBox("INBOX").then(() => {
                    const searchCriteria = ["UNSEEN"];
                    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };

                    return connection.search(searchCriteria, fetchOptions).then((messages) => {
                        for (let message of messages) {
                            let subject = message.parts.find(part => part.which === "HEADER").body.subject[0];
                            if (subject.includes("Your Rockstar Games verification code")) {
                                let bodyText = message.parts.find(part => part.which === "TEXT").body;
                                let codeMatch = bodyText.match(/\b\d{6}\b/);
                                if (codeMatch) {
                                    resolve(codeMatch[0]);
                                    return;
                                }
                            }
                        }
                        resolve(null);
                    });
                });
            })
            .catch((error) => {
                console.error("IMAP Error:", error);
                resolve(0); // Prevent bot from crashing
            });
    });
}

// 🔹 Send Retry Button if No Code Found
// 🔹 Send Embed if No Code Found
async function sendRetryButton(interaction) {
    try {
        const embed = new EmbedBuilder()
        .setTitle("⚠️ We couldn't find your code.")
        .setDescription("We couldn't find a recent Rockstar verification code in your inbox. Please try again.")
        .setColor("Orange")
        .setFooter({ text: "Resend the verification code and try again." });

    const retryButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`retry_code`)
            .setLabel("Retry")
            .setStyle(ButtonStyle.Danger)
    );

    await interaction.followUp({
        embeds: [embed],
        components: [retryButton],
        ephemeral: true
    });

    } catch (error) {
        console.error("IMAP Error:", error);
    }
}


async function sendErrorMessage(interaction) {
    const embed = new EmbedBuilder()
    .setTitle("⛔ Something went wrong.")
    .setDescription("Verify the login details and try again.")
    .setColor("Red")
    .setFooter({ text: "Ensure the login details you entered are correct." });

    await interaction.followUp({
        embeds: [embed],
        ephemeral: true
    });
}

// 🔹 Slash Command to Spawn the Button
client.on("messageCreate", async (message) => {
    if (message.content === "!verify") {
        const embed = new EmbedBuilder()
            .setTitle("Rockstar Verification")
            .setDescription("Click the button below to retrieve your Rockstar verification code.")
            .setColor("#FF5A85");

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("request_code")
                .setLabel("Get Code")
                .setStyle(ButtonStyle.Primary)
        );
        await message.delete();
        await message.channel.send({ embeds: [embed], components: [button] });
    }
});

client.login(TOKEN);
