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
  { id: "air", name: "Aire", chance: 25, value: 0 },
  { id: "stone", name: "Piedra", chance: 25, value: 1 },
  { id: "coal", name: "Carbón", chance: 25, value: 2 },
  { id: "iron", name: "Hierro", chance: 10, value: 4 },
  { id: "emerald", name: "Esmeralda", chance: 10, value: 16 },
  { id: "emerald2", name: "Esmeralda II", chance: 3, value: 60 },
  { id: "diamond", name: "Diamante", chance: 1, value: 300 },
  { id: "diamond2", name: "Diamante II", chance: 1, value: 1000 }
];

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

    /* ===== ⛏️ MG ===== */
    if (interaction.commandName === "mg") {
      const userId = interaction.user.id;

      // eliminar sesión anterior
      if (mgSessions.has(userId)) {
        try {
          await mgSessions.get(userId).message.delete();
        } catch {}
        mgSessions.delete(userId);
      }

      const embed = new EmbedBuilder()
        .setTitle("⛏️ Mina")
        .setColor("DarkGrey")
        .setDescription("Elige una acción:")
        .addFields({
          name: "💰 Balance",
          value: `${getBalance(userId)} monedas`
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("mg_mine")
          .setLabel("⛏️ Minar")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("mg_sell")
          .setLabel("💰 Vender")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("mg_exit")
          .setLabel("🚪 Salir")
          .setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      mgSessions.set(userId, { message: msg });
      return;
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
    if (interaction.customId.startsWith("mg_")) {
      if (interaction.customId === "mg_mine") {
        const mineral = rollMineral();
        const inv = getInventory(interaction.user.id);
        inv[mineral.id] = (inv[mineral.id] || 0) + 1;

        return interaction.reply({
          content: `⛏️ Encontraste **${mineral.name}** (+${mineral.value})`,
          ephemeral: true
        });
      }

      if (interaction.customId === "mg_exit") {
        mgSessions.delete(interaction.user.id);
        return interaction.message.delete();
      }

      return;
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
