const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'sofiasky.mcsh.io', // Buraya MC sunucu IP'nizi yazın
  port: 25565,                 // Port (Genelde 25565'tir)
  username: 'ChatBotYardimcisi', // Botun oyundaki adı
  version: '1.21.4'            // Kesin olarak 1.21.4 belirtiyoruz
});

bot.on('spawn', () => {
  console.log('Bot başarıyla 1.21.4 sunucusuna girdi!');
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  if (message.toLowerCase().includes('kutular nerede')) {
    setTimeout(() => {
      bot.chat(`Kutular /warp crates konumunda, @${username}!`);
    }, 1000);
  }
});

bot.on('error', (err) => console.log('Hata:', err));
bot.on('kicked', (reason) => console.log('Atıldı:', reason));
