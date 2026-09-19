const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'sofiasky.mcsh.io', // Sunucu IP adresiniz
  port: 25565,
  username: 'ChatBotYardimcisi',
  version: '1.21.4'
});

bot.on('spawn', () => {
  console.log('Bot başarıyla oyuna girdi!');
});

// Zorunlu kaynak paketini otomatik kabul etme olayı
bot.on('resourcePackSend', (url, hash) => {
  console.log('Kaynak paketi algılandı, indiriliyor...');
  bot.acceptResourcePack(); // Paketi otomatik onaylar ve sunucudan atılmayı önler
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
