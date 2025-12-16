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
   🎮 RPS GAMES
========================= */
const rpsGames = new Map();

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
    )
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

  /* ---------- SLASH ---------- */
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "rps") return;

    const challenger = interaction.user;
    const opponent = interaction.options.getUser("user");
    const bet = interaction.options.getInteger("money");
    const choice = interaction.options.getString("choice");

    if (opponent.bot)
      return interaction.reply({ content: "🤖 You can't play against bots.", ephemeral: true });

    if (opponent.id === challenger.id)
      return interaction.reply({ content: "❌ You can't play against yourself.", ephemeral: true });

    if (bet <= 0)
      return interaction.reply({ content: "❌ Bet must be positive.", ephemeral: true });

    if (getBalance(challenger.id) < bet)
      return interaction.reply({ content: "❌ You don't have enough coins.", ephemeral: true });

    if (getBalance(opponent.id) < bet)
      return interaction.reply({ content: "❌ Opponent doesn't have enough coins.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("🪨📄✂️ RPS CHALLENGE")
      .setColor("Gold")
      .setDescription(
        `**${challenger.username}** challenged **${opponent.username}**!\n\n` +
        `💰 Bet: **${bet} coins**`
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

  /* ---------- BUTTON ---------- */
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith("rps_")) return;

    const game = rpsGames.get(interaction.message.id);
    if (!game)
      return interaction.reply({ content: "⌛ This game expired.", ephemeral: true });

    if (interaction.user.id !== game.opponentId)
      return interaction.reply({ content: "❌ This is not your challenge.", ephemeral: true });

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

    const embed = new EmbedBuilder()
      .setTitle("✊ RPS RESULT")
      .setColor("Green")
      .addFields(
        { name: "Challenger", value: name(challengerChoice), inline: true },
        { name: "Opponent", value: name(opponentChoice), inline: true },
        { name: "Result", value: result }
      );

    rpsGames.delete(interaction.message.id);

    interaction.update({
      embeds: [embed],
      components: []
    });
  }
});

client.login(process.env.TOKEN);
