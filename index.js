// import library
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');
require('dotenv').config();

// utility
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// game settings
const token = process.env.DISCORD_TOKEN;
const rows = 5;
const cols = 5;
let mines_pos = [];
let reveal_pos = [];
let tile_numbers = [];
let is_over = false;
let is_win = false;

// game setup function
function initializeGame() {
  mines_pos = [];
  reveal_pos = [];
  tile_numbers = [];
  is_over = false;
  is_win = false;

  // generate 5 unique mines
  while (mines_pos.length < 5) {
    const pos = getRandomInt(0, rows * cols);
    if (!mines_pos.includes(pos)) {
      mines_pos.push(pos);
    }
  }

  // calculate adjacent mine counts
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let count = 0;
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
          if (mines_pos.includes(r * cols + c)) count++;
        }
      }
      tile_numbers.push(count);
    }
  }
}

// define intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// login
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// message event
client.on('messageCreate', async message => {
  try {
    if (message.author.bot) return;

    if (message.content === '!start') {
      initializeGame();

      let row_arr = [];
      for (let row = 0; row < rows; row++) {
        let button_arr = [];
        for (let col = 0; col < cols; col++) {
          const button = new ButtonBuilder()
            .setCustomId(`${row * cols + col}`)
            .setLabel('\u200B')
            .setStyle(ButtonStyle.Primary);
          button_arr.push(button);
        }
        row_arr.push(new ActionRowBuilder().addComponents(button_arr));
      }

      await message.channel.send({
        content: 'Game is starting...',
        components: row_arr
      });
    }
  } catch (error) {
    console.error('Error in messageCreate:', error);
    await message.channel.send('⚠️ An error occurred while starting the game.');
  }
});

// button interaction
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  try {
    const clicked = parseInt(interaction.customId);

    if (mines_pos.includes(clicked)) {
      is_over = true;
      reveal_pos = Array.from({ length: rows * cols }, (_, i) => i); // reveal everything
    } else if (!reveal_pos.includes(clicked)) {
      // Zero-tile reveal using flood fill
      const stack = [clicked];
      const visited = new Set();

      while (stack.length > 0) {
        const pos = stack.pop();
        if (visited.has(pos)) continue;
        visited.add(pos);
        reveal_pos.push(pos);

        const row = Math.floor(pos / cols);
        const col = pos % cols;

        if (tile_numbers[pos] === 0) {
          for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
              if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
              const neighbor = r * cols + c;
              if (!visited.has(neighbor)) {
                stack.push(neighbor);
              }
            }
          }
        }
      }
    }

    if (reveal_pos.length >= rows*cols-mines_pos.length) {
      is_win = true;
    }

    // Re-render the board
    let row_arr = [];
    for (let row = 0; row < rows; row++) {
      let button_arr = [];
      for (let col = 0; col < cols; col++) {
        const pos = row * cols + col;
        const isRevealed = reveal_pos.includes(pos);
        const isMine = mines_pos.includes(pos);

        const label =
          isRevealed && isMine
            ? '💣'
            : isRevealed
              ? tile_numbers[pos] === 0 ? '\u200B' : `${tile_numbers[pos]}`
              : '\u200B';

        const button = new ButtonBuilder()
          .setCustomId(`${pos}`)
          .setLabel(label)
          .setStyle(
            isRevealed
              ? (isMine ? ButtonStyle.Danger : ButtonStyle.Secondary)
              : ButtonStyle.Primary
          )
          .setDisabled(isRevealed || is_over);

        button_arr.push(button);
      }
      row_arr.push(new ActionRowBuilder().addComponents(button_arr));
    }

    if (is_win) {
      if (!is_over) {
        await interaction.reply({
          content: '🚩 Y O U R  W I N - type `!start` to play again.',
          components: row_arr,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '☠️ G A M E  O V E R - type `!start` to play again.',
          components: row_arr,
          ephemeral: true
        });
      }
      return;
    } else {
      await interaction.reply({
        content: 'Keep going...',
        components: row_arr
      });
    }

  } catch (error) {
    console.error('Error in InteractionCreate:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ An error occurred.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ An error occurred.', ephemeral: true });
    }
  }
});


// global error logging
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});

client.login(token);
