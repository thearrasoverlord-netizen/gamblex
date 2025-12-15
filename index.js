import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
const rpsGames = new Map();
const minerals = [
  { id: "air", name: "Air", value: 0, chance: 35, img: "https://i.imgur.com/OKFxYjH.jpeg" },
  { id: "stone", name: "Stone", value: 1, chance: 30, img: "https://i.imgur.com/GmuhJZx.jpeg" },
  { id: "coal", name: "Coal", value: 5, chance: 15, img: "https://i.imgur.com/eHAEijR.png" },
  { id: "iron", name: "Iron", value: 12, chance: 10, img: "https://i.imgur.com/goHV1Wn.jpeg" },
  { id: "emerald", name: "Emerald", value: 60, chance: 7, img: "https://i.imgur.com/xyK5oTs.png" },
  { id: "diamond", name: "Diamond", value: 150, chance: 3, img: "https://i.imgur.com/Tmtzrhl.png" }
];

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
// ⬇️ PEGA ESTO AQUÍ
function rollMineral() {
  const total = minerals.reduce((sum, m) => sum + m.chance, 0);
  let roll = Math.random() * total;

  for (const m of minerals) {
    if (roll < m.chance) return m;
    roll -= m.chance;
  }

  return minerals[0]; // fallback
}

function getInventory(userId) {
  if (!inventories.has(userId)) inventories.set(userId, {});
  return inventories.get(userId);
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
  .setName("mg")
  .setDescription("⛏️ Mine minerals and make money"),

new SlashCommandBuilder()
  .setName("rps")
  .setDescription("Challenge someone to Rock Paper Scissors")
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
      .setDescription("Your move")
      .setRequired(true)
      .addChoices(
        { name: "Rock", value: "r" },
        { name: "Paper", value: "p" },
        { name: "Scissors", value: "s" }
      )
  ),
]
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
  if (interaction.isChatInputCommand()) {
if (interaction.isButton()) {
  const userId = interaction.user.id;

  /* ---------- BREAK ---------- */
  if (interaction.customId.startsWith("mg_break_")) {
    const mineralId = interaction.customId.replace("mg_break_", "");
    const inv = getInventory(userId);

    inv[mineralId] = (inv[mineralId] || 0) + 1;

    return interaction.reply({
      content: `⛏️ You mined **${mineralId}**!\n📦 Inventory: **${inv[mineralId]}**`,
      ephemeral: true
    });
  }

  /* ---------- MOVE ---------- */
  if (interaction.customId.startsWith("mg_move_")) {
    const mineral = rollMineral();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mg_break_${mineral.id}`)
        .setLabel("⛏️ Break")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`mg_move_${mineral.id}`)
        .setLabel("🚶 Move")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("mg_sell")
        .setLabel("💰 Sell inventory")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("⛏️ Mining")
      .setColor("Orange")
      .setDescription(
        `You found **${mineral.name}**\n` +
        `💰 Worth: **$${mineral.value}**`
      )
      .setImage(mineral.img);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  /* ---------- SELL ---------- */
  if (interaction.customId === "mg_sell") {
    const inv = getInventory(userId);
    let total = 0;

    for (const id in inv) {
      const mineral = minerals.find(m => m.id === id);
      if (!mineral) continue;

      total += mineral.value * inv[id];
    }

    inventories.set(userId, {}); // reset inventory

    const ba

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
    /* ---------- MINING ---------- */
  if (interaction.commandName === "mg") {
    const mineral = rollMineral();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mg_break_${mineral.id}`)
        .setLabel("⛏️ Break")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`mg_move_${mineral.id}`)
        .setLabel("🚶 Move")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("mg_sell")
        .setLabel("💰 Sell inventory")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("⛏️ Mining")
      .setColor("Orange")
      .setDescription(
        `You found **${mineral.name}**\n` +
        `💰 Worth: **$${mineral.value}**\n` +
        `🎯 Chance: **${mineral.chance}%**`
      )
      .setImage(mineral.img);

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  /* ---------- RPS ---------- */
/* ---------- RPS (REAL WITH BUTTONS) ---------- */
if (interaction.commandName === "rps") {
  const opponent = interaction.options.getUser("user");
  const bet = interaction.options.getInteger("money");
  const challenger = interaction.user;

  if (opponent.bot)
    return interaction.reply({ content: "🤖 You can't play against bots.", ephemeral: true });

  if (opponent.id === challenger.id)
    return interaction.reply({ content: "❌ You can't play against yourself.", ephemeral: true });

  const bal1 = getBalance(challenger.id);
  const bal2 = getBalance(opponent.id);

  if (bet <= 0)
    return interaction.reply({ content: "❌ Bet must be positive.", ephemeral: true });

  if (bet > bal1)
    return interaction.reply({ content: "❌ You don't have enough coins.", ephemeral: true });

  if (bet > bal2)
    return interaction.reply({ content: "❌ Opponent doesn't have enough coins.", ephemeral: true });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("rps_r").setLabel("🪨 Rock").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("rps_p").setLabel("📄 Paper").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("rps_s").setLabel("✂️ Scissors").setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setTitle("🪨📄✂️ RPS CHALLENGE!")
    .setColor("Gold")
    .setDescription(
      `**${challenger.username}** has challenged **${opponent.username}**!\n\n` +
      `💰 Bet: **${bet} coins**\n` +
      `⏳ You have **1 hour** to choose.`
    );

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    time: 60 * 60 * 1000 // 1 hour
  });

  collector.on("collect", i => {
    if (i.user.id !== opponent.id) {
      return i.reply({ content: "❌ This challenge is not for you.", ephemeral: true });
    }

    const opponentChoice = i.customId.split("_")[1];
    const choices = ["r", "p", "s"];
    const challengerChoice = choices[Math.floor(Math.random() * 3)];

    const win =
      (challengerChoice === "r" && opponentChoice === "s") ||
      (challengerChoice === "p" && opponentChoice === "r") ||
      (challengerChoice === "s" && opponentChoice === "p");

    const draw = challengerChoice === opponentChoice;

    if (!draw) {
      if (win) {
        setBalance(challenger.id, bal1 + bet);
        setBalance(opponent.id, bal2 - bet);
      } else {
        setBalance(challenger.id, bal1 - bet);
        setBalance(opponent.id, bal2 + bet);
      }
    }

    const name = c =>
      c === "r" ? "🪨 Rock" :
      c === "p" ? "📄 Paper" :
      "✂️ Scissors";

    const resultEmbed = new EmbedBuilder()
      .setTitle("✊ RPS RESULTS")
      .setColor(draw ? "Grey" : win ? "Green" : "Red")
      .addFields(
        { name: challenger.username, value: name(challengerChoice), inline: true },
        { name: opponent.username, value: name(opponentChoice), inline: true },
        {
          name: "Result",
          value: draw ? "🤝 Draw!" : win ? `🎉 ${challenger.username} won!` : `🎉 ${opponent.username} won!`
        }
      );

    collector.stop();
    i.update({ embeds: [resultEmbed], components: [] });
  });

  collector.on("end", (_, reason) => {
    if (reason === "time") {
      msg.edit({
        content: "⌛ RPS challenge expired. No response in time.",
        components: []
      });
    }
  });
}

});

client.login(process.env.TOKEN);
