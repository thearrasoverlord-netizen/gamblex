import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ───────── SLASH COMMANDS ───────── */

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all GambliX commands")
];

/* ───────── BOT READY ───────── */

client.once("ready", async () => {
  console.log("✅ GambliX is online");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
});

/* ───────── INTERACTIONS ───────── */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("🎰 GAMBLIX — GAMBLING SUPPORT!")
      .setDescription(
        "Don't know how to start yet? Check out some games we prepared for you!"
      )
      .addFields(
        {
          name: "🪙 Heads or Tails",
          value:
            "`/ht <h/t> <money>`\n" +
            "Heads or Tails! The iconic coin flip challenge is here to test your luck.\n" +
            "Bet `h` (heads) or `t` (tails) and become the **KING**!"
        },
        {
          name: "🎲 Daily Dice",
          value:
            "`/dice`\n" +
            "Throw the dice **once per day**!\n" +
            "The higher the number you roll, the more money you earn.\n" +
            "🍀 *Good luck!*"
        },
        {
          name: "✊ Rock Paper Scissors",
          value:
            "`/rps <r/p/s> <money> @user`\n" +
            "Challenge another server member to a classic duel.\n" +
            "Winner takes the bet — choose wisely!"
        },
        {
          name: "🃏 Card Challenge",
          value:
            "`/challenge @user <money>`\n" +
            "A strategic card duel between two players.\n" +
            "Play your cards carefully and win the central deck!"
        },
        {
          name: "💰 Balance & Stats",
          value:
            "`/b`\n" +
            "Check your current balance and gambling statistics."
        },
        {
          name: "🛒 Shop",
          value:
            "`/shop`\n" +
            "Buy loot boxes, miners, pickaxes and more to boost your earnings!"
        },
        {
          name: "⛏️ Mining Game",
          value:
            "`/mg`\n" +
            "Explore caves, mine valuable resources and sell them for profit.\n" +
            "Each action consumes a turn — plan wisely!"
        }
      )
      .setFooter({
        text: "Still have questions? Found a bug? DM @thearrasoverlordyt"
      })
      .setColor(0x00ff88);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
});

/* ───────── LOGIN ───────── */

client.login(process.env.TOKEN);
