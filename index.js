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

/* =========================
   💾 SIMPLE IN-MEMORY DATA
========================= */
const balances = new Map();
const lastDice = new Map();
const inventories = new Map(); // mining inventory
const pickaxes = new Map();    // pickaxe level

/* =========================
   💰 BALANCE FUNCTIONS
========================= */
function getBalance(userId) {
  if (!balances.has(userId)) balances.set(userId, 10);

  let bal = balances.get(userId);
  if (bal <= 0) {
    bal = 1; // safety coin
    balances.set(userId, bal);
  }
  return bal;
}

function setBalance(userId, amount) {
  balances.set(userId, amount);
}

/* =========================
   📜 SLASH COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show GambliX commands"),

  new SlashCommandBuilder()
    .setName("b")
    .setDescription("Check balance")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Check another user's balance")
        .setRequired(false)
    ),

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
    .setDescription("Roll a daily dice"),

  new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play Rock Paper Scissors against another player")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Opponent")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("money")
        .setDescription("Bet amount")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("choice")
        .setDescription("Your choice")
        .setRequired(true)
        .addChoices(
          { name: "Rock", value: "r" },
          { name: "Paper", value: "p" },
          { name: "Scissors", value: "s" }
        )
    )
];

/* =========================
   🚀 REGISTER COMMANDS
========================= */
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("📜 Slash commands registered");
});

/* =========================
   🎮 INTERACTION HANDLER
========================= */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  /* ---------- HELP ---------- */
  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("🎰 GAMBLIX SUPPORT!")
      .setColor("Gold")
      .setDescription(
`🎲 **Discord bot: GambliX**
RNG • BETTING • CASINO • 24/7

━━━━━━━━━━━━━━━━━━
🪙 **/ht <h/t> <money>**
Play Heads or Tails and bet your coins.

🎲 **/dice**
Roll a dice once per day.
Higher value = rarer & better.

💰 **/b**
Check your balance.
Extra: \`/b <user>\`

✊ **/rps <user> <money> <r/p/s>**
Rock Paper Scissors *(Coming soon)*

🃏 **/challenge <user> <money>**
Strategic card game *(Coming soon)*

⛏️ **/mg**
Mining simulator *(Coming soon)*

🛒 **/shop**
Buy items & upgrades *(Coming soon)*

━━━━━━━━━━━━━━━━━━
💬 Support: **@thearrasoverlordyt**
`
      )
      .setFooter({ text: "GambliX — Your luck. Your rules." });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /* ---------- BALANCE ---------- */
  if (interaction.commandName === "b") {
    const target = interaction.options.getUser("user") || interaction.user;
    const bal = getBalance(target.id);

    const embed = new EmbedBuilder()
      .setTitle("💰 Balance")
      .setColor("Green")
      .setDescription(`**${target.username}** has **$${bal}** 🪙`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /* ---------- HEADS OR TAILS ---------- */
  if (interaction.commandName === "ht") {
    const side = interaction.options.getString("side");
    const bet = interaction.options.getInteger("money");

    let balance = getBalance(userId);

    if (bet <= 0)
      return interaction.reply({ content: "❌ Bet must be positive.", ephemeral: true });

    if (bet > balance)
      return interaction.reply({ content: "❌ Not enough coins.", ephemeral: true });

    const before = balance;
    const result = Math.random() < 0.5 ? "h" : "t";
    const win = side === result;

    balance += win ? bet : -bet;
    setBalance(userId, balance);

    const embed = new EmbedBuilder()
      .setTitle("🎰 RESULTS")
      .setColor(win ? "Green" : "Red")
      .setDescription(win ? "🎉 **You won!**" : "❌ **You lost!**")
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

  /* ---------- DICE ---------- */
  if (interaction.commandName === "dice") {
    const now = Date.now();
    const last = lastDice.get(userId) || 0;

    if (now - last < 86400000)
      return interaction.reply({
        content: "⏳ You can roll the dice once per day.",
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
      .setColor("Purple")
      .setDescription(`You rolled **${roll}** 🎲`)
      .addFields({ name: "💰 New Balance", value: `$${balance}` });

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
