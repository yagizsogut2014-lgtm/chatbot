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

// Minecraft Bot Yapılandırması (Environment değişkenlerinden veya doğrudan yazabilirsin)
const bot = mineflayer.createBot({
    host: process.env.MC_HOST || 'sofiasky.mcsh.io', // Sunucu IP veya domain
    port: parseInt(process.env.MC_PORT) || 25565,        // Sunucu Portu
    username: process.env.MC_USERNAME || 'Sohbet',    // Botun oyundaki ismi
    version: process.env.MC_VERSION || '1.21.4'          // Sunucu sürümü
});

bot.on('spawn', () => {
    console.log(`Bot başarıyla oyuna girdi: ${bot.username}`);
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

    // 2. Gemini Entegrasyonu (Örneğin mesaj "!ai" ile başlıyorsa veya botun adı geçiyorsa)
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

            // Minecraft sohbeti uzun mesajları bölebilir, ilk kısmını veya kısa bir özetini gönderelim
            const replyText = response.text.replace(/\n/g, ' '); // Satır sonlarını düzelt
            
            // Minecraft chat sınırı için uzunsa kırpabilirsin, örnek ilk 200 karakter:
            bot.chat(replyText.slice(0, 200));

        } catch (error) {
            console.error('Gemini Hatası:', error);
            bot.chat('Üzgünüm, şu anda yanıt oluşturamadım.');
        }
    }
});

bot.on('error', (err) => console.log('Bot Hatası:', err));
bot.on('kicked', (reason) => console.log('Bot atıldı:', reason));
