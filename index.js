import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes
} from "discord.js";

/* =========================
   🤖 CLIENT
========================= */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   💰 BALANCES (TEMP)
========================= */
const balances = new Map();
/* =========================
   ⛏️ MINING DATA
========================= */
const inventories = new Map();

const minerals = [
  { id: "air", name: "Air", chance: 25, value: 0, img: "https://i.imgur.com/OKFxYjH.jpeg" },
  { id: "stone", name: "Stone", chance: 25, value: 1, img: "https://i.imgur.com/GmuhJZx.jpeg" },
  { id: "coal", name: "Coal", chance: 25, value: 2, img: "https://i.imgur.com/eHAEijR.png" },
  { id: "iron", name: "Iron", chance: 10, value: 4, img: "https://i.imgur.com/goHV1Wn.jpeg" },
  { id: "emerald", name: "Emerald", chance: 10, value: 16, img: "https://i.imgur.com/xyK5oTs.png" },
  { id: "emerald2", name: "Emerald II", chance: 3, value: 60, img: "https://i.imgur.com/xyK5oTs.png" },
  { id: "diamond", name: "Diamond", chance: 1, value: 300, img: "https://i.imgur.com/Tmtzrhl.png" },
  { id: "diamond2", name: "Diamond II", chance: 1, value: 1000, img: "https://i.imgur.com/Tmtzrhl.png" }
];

const pickaxes = {
  wood:     { actions: 2 },
  stone:    { actions: 5 },
  iron:     { actions: 16 },
  diamond:  { actions: 50 }
};

/* =========================
   🎮 RPS GAMES
========================= */
const rpsGames = new Map();
/* =========================
   ⛏️ MG SESSIONS
========================= */
const mgSessions = new Map();

/* =========================
   🧠 HELPERS
========================= */
function getBalance(id) {
  if (!balances.has(id)) balances.set(id, 100);
  return balances.get(id);
}

function setBalance(id, value) {
  balances.set(id, value);
}

function beats(a, b) {
  return (
    (a === "r" && b === "s") ||
    (a === "p" && b === "r") ||
    (a === "s" && b === "p")
  );
}
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

function name(c) {
  return c === "r" ? "🪨 Rock" : c === "p" ? "📄 Paper" : "✂️ Scissors";
}

function useAction(session) {
  const RESET = 2 * 60 * 60 * 1000;
  const now = Date.now();

  if (!session.lastReset || now - session.lastReset >= RESET) {
    session.lastReset = now;
    session.actionsLeft = pickaxes[session.pickaxe].actions;
  }

  if (session.actionsLeft <= 0) return false;

  session.actionsLeft--;
  return true;
}

/* =========================
   📜 COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Rock Paper Scissors")
    .addUserOption(o =>
      o.setName("user").setDescription("Opponent").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("money").setDescription("Bet amount").setRequired(true)
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

  // ⛏️ MG
  new SlashCommandBuilder()
    .setName("mg")
    .setDescription("⛏️ Go mining")
];

/* =========================
   🚀 REGISTER
========================= */
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("📜 RPS command registered");
});

/* =========================
   🎮 INTERACTIONS
========================= */
client.on("interactionCreate", async interaction => {

  /* ---------- SLASH COMMANDS ---------- */
  if (interaction.isChatInputCommand()) {

/* ===== ⛏️ MG COMMAND ===== */
/* ===== ⛏️ MG COMMAND ===== */
if (interaction.commandName === "mg") {
  const userId = interaction.user.id;

  const block = rollMineral(); // 👈 UNA SOLA VEZ

  mgSessions.set(userId, {
    block,
    pickaxe: "wood",
    actionsLeft: pickaxes.wood.actions,
    lastReset: Date.now()
  });

  const embed = new EmbedBuilder()
    .setTitle("⛏️ Mining in the caves!")
    .setColor("DarkGrey")
    .setDescription("You moved forward and discovered a block.")
    .addFields(
      { name: "🧱 Current Block", value: block.name, inline: true },
      { name: "💰 Value", value: `${block.value} coins`, inline: true },
      { name: "⚡ Actions Left", value: `${pickaxes.wood.actions}`, inline: true }
    )
    .setImage(block.img);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mg_move")
      .setLabel("🚶 Move")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("mg_mine")
      .setLabel("⛏️ Mine")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("mg_sell")
      .setLabel("💰 Sell Inventory")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}


    /* ===== 🪨 RPS ===== */
    if (interaction.commandName === "rps") {
      const challenger = interaction.user;
      const opponent = interaction.options.getUser("user");
      const bet = interaction.options.getInteger("money");
      const choice = interaction.options.getString("choice");

      if (opponent.bot || opponent.id === challenger.id)
        return interaction.reply({ content: "❌ Invalid opponent.", ephemeral: true });

      if (bet <= 0)
        return interaction.reply({ content: "❌ Bet must be positive.", ephemeral: true });

      if (getBalance(challenger.id) < bet || getBalance(opponent.id) < bet)
        return interaction.reply({ content: "❌ Not enough coins.", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("🪨📄✂️ RPS CHALLENGE")
        .setColor("Gold")
        .setDescription(
          `**${challenger.username}** vs **${opponent.username}**\n💰 Bet: ${bet}`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rps_r").setLabel("🪨 Rock").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("rps_p").setLabel("📄 Paper").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("rps_s").setLabel("✂️ Scissors").setStyle(ButtonStyle.Primary)
      );

      const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      rpsGames.set(msg.id, {
        challengerId: challenger.id,
        opponentId: opponent.id,
        bet,
        choice
      });
    }
  }

  /* ---------- BUTTONS ---------- */
  if (interaction.isButton()) {

    /* ===== ⛏️ MG BUTTONS ===== */
if (interaction.customId === "mg_move") {
  const userId = interaction.user.id;
  const session = mgSessions.get(userId);
  if (!session) return;

  session.block = rollMineral();

  const embed = new EmbedBuilder()
    .setTitle("🚶 You moved deeper")
    .setColor("Blue")
    .setDescription("A new block appeared.")
    .addFields(
      { name: "🧱 Current Block", value: session.block.name, inline: true },
      { name: "💰 Value", value: `${session.block.value} coins`, inline: true }
    )
    .setImage(session.block.img);

  return interaction.update({ embeds: [embed] });
}
if (interaction.customId === "mg_mine") {
  const userId = interaction.user.id;
  const session = mgSessions.get(userId);
  if (!session) return;

  const block = session.block;
  const inv = getInventory(userId);

  inv[block.id] = (inv[block.id] || 0) + 1;
  session.block = minerals.find(m => m.id === "air");

  const embed = new EmbedBuilder()
    .setTitle("⛏️ Block Mined")
    .setColor("Orange")
    .setDescription(`You mined **${block.name}**.`)
    .addFields(
      { name: "📦 Stored", value: `${inv[block.id]}x`, inline: true },
      { name: "➡️ Current Block", value: "Air", inline: true }
    )
    .setImage(block.img);

  return interaction.update({ embeds: [embed] });
}
if (interaction.customId === "mg_sell") {
  const userId = interaction.user.id;
  const inv = getInventory(userId);
  let total = 0;

  for (const id in inv) {
    const mineral = minerals.find(m => m.id === id);
    if (!mineral) continue;
    total += mineral.value * inv[id];
  }

  inventories.set(userId, {});
  setBalance(userId, getBalance(userId) + total);

  const embed = new EmbedBuilder()
    .setTitle("💰 Inventory Sold")
    .setColor("Green")
    .setDescription("All minerals have been sold.")
    .addFields(
      { name: "💵 Earned", value: `${total} coins`, inline: true },
      { name: "💰 Balance", value: `${getBalance(userId)} coins`, inline: true }
    )
    .setImage("https://i.imgur.com/3ZUrjUP.png");

  return interaction.reply({ embeds: [embed], ephemeral: true });
}


    /* ===== 🪨 RPS BUTTONS ===== */
    if (!interaction.customId.startsWith("rps_")) return;

    const game = rpsGames.get(interaction.message.id);
    if (!game) return;

    const opponentChoice = interaction.customId.split("_")[1];
    const challengerChoice = game.choice;

    let result;
    if (challengerChoice === opponentChoice) {
      result = "🤝 Draw!";
    } else if (beats(challengerChoice, opponentChoice)) {
      setBalance(game.challengerId, getBalance(game.challengerId) + game.bet);
      setBalance(game.opponentId, getBalance(game.opponentId) - game.bet);
      result = "🎉 Challenger wins!";
    } else {
      setBalance(game.challengerId, getBalance(game.challengerId) - game.bet);
      setBalance(game.opponentId, getBalance(game.opponentId) + game.bet);
      result = "🎉 Opponent wins!";
    }

    rpsGames.delete(interaction.message.id);

    interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("✊ RPS RESULT")
          .setDescription(result)
      ],
      components: []
    });
  }
});

client.login(process.env.TOKEN);
