import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all GambleX commands")
];

client.once("ready", async () => {
  console.log("✅ GambleX is online");

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

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "help") {
    await interaction.reply({
      content:
        "**🎰 GambleX Commands**\n\n" +
        "`/help` → Show this message\n" +
        "`/ht` → Heads or Tails\n" +
        "`/dice` → Daily dice roll\n" +
        "`/rps` → Rock Paper Scissors\n" +
        "`/challenge` → Card duel\n" +
        "`/b` → Balance & stats\n" +
        "`/shop` → Open the shop\n" +
        "`/mg` → Mining game",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
