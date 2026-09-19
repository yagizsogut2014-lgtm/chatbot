const mineflayer = require('mineflayer');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

// Render'da 7/24 açık kalabilmesi için basit bir web sunucusu
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Minecraft Gemini Bot aktif!');
});

app.listen(PORT, () => {
    console.log(`Web sunucusu ${PORT} portunda çalışıyor.`);
});

// Gemini API Başlatma
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Minecraft Bot Yapılandırması
const bot = mineflayer.createBot({
    host: process.env.MC_HOST || 'oyun.sunucuadresi.com',
    port: parseInt(process.env.MC_PORT) || 25565,
    username: process.env.MC_USERNAME || 'GeminiBot',
    version: process.env.MC_VERSION || '1.21.4'
});

bot.on('spawn', () => {
    console.log(`Bot başarıyla oyuna girdi: ${bot.username}`);

    // Oyuna girdikten 3 saniye sonra /register komutunu gönder
    setTimeout(() => {
        bot.chat('/register 12121212 12121212');
        console.log('/register komutu gönderildi.');
    }, 3000);

    // Oyuna girdikten 6 saniye sonra /login komutunu gönder
    setTimeout(() => {
        bot.chat('/login 12121212');
        console.log('/login komutu gönderildi.');
    }, 6000);
});

// Oyundan mesaj gelince tetiklenir
bot.on('chat', async (username, message) => {
    // Botun kendi mesajlarına yanıt vermesini engelle
    if (username === bot.username) return;

    const lowerMsg = message.toLowerCase();

    // 1. Özel Kelime / Cümle Kontrolleri
    if (lowerMsg.includes('sofiamc selam')) {
        bot.chat('aleyküm selam');
        return;
    }

    // 2. Gemini Entegrasyonu (!ai ile başlayan mesajlar)
    if (lowerMsg.startsWith('!ai ')) {
        const prompt = message.slice(4).trim();
        
        if (!prompt) {
            bot.chat('Efendim? Bana bir soru sor!');
            return;
        }

        try {
            bot.chat('Düşünüyorum...');

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const replyText = response.text.replace(/\n/g, ' ');
            bot.chat(replyText.slice(0, 200));

        } catch (error) {
            console.error('Gemini Hatası:', error);
            bot.chat('Üzgünüm, şu anda yanıt oluşturamadım.');
        }
    }
});

bot.on('error', (err) => console.log('Bot Hatası:', err));
bot.on('kicked', (reason) => console.log('Bot atıldı:', reason));
