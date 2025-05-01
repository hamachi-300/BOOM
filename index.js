const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const rows = 2;
const cols = 2;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Game section

client.on('messageCreate', async message => {
  if (message.author.bot) return;   

    if (message.content === '!start') {
      const button1 = new ButtonBuilder()
      .setCustomId('click_me')
      .setLabel('Click Me!')
      .setStyle(ButtonStyle.Primary);

      const button2 = new ButtonBuilder()
        .setCustomId('secondary_button')
        .setLabel('Second Button')
        .setStyle(ButtonStyle.Secondary);

      const button3 = new ButtonBuilder()
        .setCustomId('click_me1')
        .setLabel('Click Me!')
        .setStyle(ButtonStyle.Primary);        
      
      const button4 = new ButtonBuilder()
        .setCustomId('secondary_button')
        .setLabel('Second Button')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents([button1, button2]);
      const row2 = new ActionRowBuilder().addComponents([button3, button4]);
      const row = [row1, row2]
      console.log(row)
      
      await message.channel.send({
        content: 'Here is a button:',
        components: row
      });
    }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'click_me') {
    await interaction.reply({ content: 'You clicked the button!', ephemeral: true });
  }
});

client.login(token);
