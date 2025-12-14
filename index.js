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
// 💾 DATA STORES
// =====================
const balances = new Map();
const lastDice = new Map();

// =====================
// 💰 BALANCE FUNCTIONS
// =====================
function getBalance(userId) {
  if (!balances.has(userId)) balances.set(userId, 10);

  let bal = balances.get(userId);
  if (bal <= 0) {
    bal = 1;
    balances.set(userId, bal);
  }
  return bal;
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
    .addStringOption(o =>
      o.setName("side")
        .setDescription("Heads or Tails")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "h" },
          { name: "Tails", value: "t" }
        )
    )
    .addIntegerOption(o =>
      o.setName("money")
        .setDescription("Amount to bet")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll a daily dice")
];

// =====================
// 🚀 REGISTER
// =====================
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("📜 Commands registered");
});

// =====================
// 🎮 HANDLER
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const userId = interaction.user.id;

  // ---------- HELP ----------
  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("🎰 GAMBLIX — GAMBLING SUPPORT")
      .setDescription(
`Don't know how to start? Try these commands:

🪙 **/ht <h/t> <money>**
Heads or Tails betting game

🎲 **/dice**
Daily dice with risky odds

💰 **/b**
Check your balance`
      )
      .setColor("Gold");

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ---------- BALANCE ----------
  if (interaction.commandName === "b") {
    return interaction.reply({
      content: `💰 You have **$${getBalance(userId)}** 🪙`,
      ephemeral: true
    });
  }

  // ---------- HT ----------
  if (interaction.commandName === "ht") {
    const side = interaction.options.getString("side");
    const bet = interaction.options.getInteger("money");
    let balance = getBalance(userId);

    if (bet <= 0 || bet > balance)
      return interaction.reply({ content: "❌ Invalid bet.", ephemeral: true });

    const before = balance;
    const result = Math.random() < 0.5 ? "h" : "t";
    const win = side === result;

    balance += win ? bet : -bet;
    setBalance(userId, balance);

    const embed = new EmbedBuilder()
      .setTitle("🎰 RESULTS")
      .setColor(win ? "Green" : "Red")
      .setDescription(win ? "🎉 You won!" : "❌ You lost!")
      .addFields(
        { name: "🪙 Bet", value: side === "h" ? "Heads" : "Tails", inline: true },
        { name: "💸 Before", value: `$${before}`, inline: true },
        { name: "💰 Balance", value: `$${balance}` }
      )
      .setFooter({ text: "✨ Keep it up!" });

    return interaction.reply({ embeds: [embed] });
  }

  // ---------- DICE ----------
  if (interaction.commandName === "dice") {
    const now = Date.now();
    const last = lastDice.get(userId) || 0;

    if (now - last < 86400000)
      return interaction.reply({
        content: "⏳ You can only roll the dice once per day.",
        ephemeral: true
      });

    lastDice.set(userId, now);

    const r = Math.random();
    let roll = 1;

    if (r < 0.5) roll = 1;
    else if (r < 0.75) roll = 2;
    else if (r < 0.875) roll = 3;
    else if (r < 0.9375) roll = 4;
    else if (r < 0.96875) roll = 5;
    else roll = 6;

    let balance = getBalance(userId);
    balance *= roll;
    setBalance(userId, balance);

    const embed = new EmbedBuilder()
      .setTitle("🎲 DICE RESULTS")
      .setDescription(`You rolled **${roll}**`)
      .addFields({ name: "💰 New Balance", value: `$${balance}` })
      .setColor("Purple");

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
