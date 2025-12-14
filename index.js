import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";

/* ───────── CLIENT ───────── */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ───────── SLASH COMMANDS ───────── */

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all GambliX commands"),

  new SlashCommandBuilder()
    .setName("ht")
    .setDescription("Play Heads or Tails")
    .addStringOption(option =>
      option
        .setName("side")
        .setDescription("Choose heads (h) or tails (t)")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "h" },
          { name: "Tails", value: "t" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("money")
        .setDescription("Amount of money to bet")
        .setRequired(true)
        .setMinValue(1)
    )
];

/* ───────── READY ───────── */

client.once("ready", async () => {
  console.log("✅ GambliX is online");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error(error);
  }
});

/* ───────── INTERACTIONS ───────── */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* ───── /help ───── */
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
            "The higher the number you roll, the more money you earn."
        },
        {
          name: "✊ Rock Paper Scissors",
          value:
            "`/rps <r/p/s> <money> @user`\n" +
            "Challenge another server member to a classic duel."
        },
        {
          name: "🃏 Card Challenge",
          value:
            "`/challenge @user <money>`\n" +
            "A strategic card duel between two players."
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
            "Buy loot boxes, miners, pickaxes and more!"
        },
        {
          name: "⛏️ Mining Game",
          value:
            "`/mg`\n" +
            "Mine resources, manage turns and sell for profit."
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

  /* ───── /ht ───── */
  if (interaction.commandName === "ht") {
    const side = interaction.options.getString("side");
    const money = interaction.options.getInteger("money");

    const result = Math.random() < 0.5 ? "h" : "t";
    const resultText = result === "h" ? "Heads" : "Tails";

    const win = side === result;

    await interaction.reply({
      content:
        `🪙 **Heads or Tails**\n\n` +
        `You chose: **${side === "h" ? "Heads" : "Tails"}**\n` +
        `Result: **${resultText}**\n\n` +
        (win
          ? `🎉 **YOU WON!** You earned **${money} coins**.`
          : `💀 **You lost!** You lost **${money} coins**.`),
      ephemeral: false
    });
  }
});

/* ───────── LOGIN ───────── */

client.login(process.env.TOKEN);
