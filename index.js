import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  REST,
  Routes
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// 💾 SIMPLE MONEY STORE
// =====================
const balances = new Map();

function getBalance(userId) {
  if (!balances.has(userId)) {
    balances.set(userId, 10); // starting money
  }

  let balance = balances.get(userId);

  // Safety net: if 0, give 1 coin
  if (balance <= 0) {
    balance = 1;
    balances.set(userId, balance);
  }

  return balance;
}

function setBalance(userId, amount) {
  balances.set(userId, amount);
}

// =====================
// 📜 SLASH COMMANDS
// =====================
const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows GambliX commands"),

  new SlashCommandBuilder()
    .setName("b")
    .setDescription("Check your balance"),

  new SlashCommandBuilder()
    .setName("ht")
    .setDescription("Play Heads or Tails")
    .addStringOption(option =>
      option
        .setName("side")
        .setDescription("h = heads, t = tails")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "h" },
          { name: "Tails", value: "t" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("money")
        .setDescription("Amount to bet")
        .setRequired(true)
    )
];

// =====================
// 🚀 REGISTER COMMANDS
// =====================
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("📜 Slash commands registered");
});

// =====================
// 🎮 COMMAND HANDLER
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // -------- BALANCE --------
  if (interaction.commandName === "b") {
    const balance = getBalance(userId);

    const embed = new EmbedBuilder()
      .setTitle("💰 Your Balance")
      .setDescription(`You currently have **$${balance}** 🪙`)
      .setColor("Gold");

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // -------- HEADS OR TAILS --------
  if (interaction.commandName === "ht") {
    const side = interaction.options.getString("side");
    const bet = interaction.options.getInteger("money");

    let balance = getBalance(userId);

    if (bet <= 0) {
      return interaction.reply({
        content: "❌ Bet must be greater than 0.",
        ephemeral: true
      });
    }

    if (bet > balance) {
      return interaction.reply({
        content: "❌ You don't have enough coins.",
        ephemeral: true
      });
    }

    const before = balance;

    // Coin flip
    const result = Math.random() < 0.5 ? "h" : "t";
    const win = side === result;

    balance = win ? balance + bet : balance - bet;
    setBalance(userId, balance);

    const embed = new EmbedBuilder()
      .setTitle("🎰 RESULTS")
      .setColor(win ? "Green" : "Red")
      .setDescription(
        win
          ? "🎉 **You won!**"
          : "❌ **You lost!**"
      )
      .addFields(
        { name: "🪙 Bet", value: side === "h" ? "Heads" : "Tails", inline: true },
        { name: "💸 Before", value: `$${before}`, inline: true },
        {
          name: "💰 Balance Update",
          value: `Now: $${balance} (${win ? "+" : "-"}$${bet})`
        }
      )
      .setFooter({ text: "✨ Keep it up!" });

    return interaction.reply({ embeds: [embed] });
  }
});

// =====================
client.login(process.env.TOKEN);
