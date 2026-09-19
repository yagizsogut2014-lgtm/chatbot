const mineflayer = require('mineflayer');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Express form verilerini okuyabilsin
app.use(express.urlencoded({ extended: true }));

// Global Değişkenler
let bot = null;
let botStatus = "Kapalı";
let botLogs = [];

function addLog(text) {
    const time = new Date().toLocaleTimeString();
    const logEntry = `[${time}] ${text}`;
    console.log(logEntry);
    botLogs.unshift(logEntry); // En yeni log üstte dursun
    if (botLogs.length > 30) botLogs.pop(); // Son 30 logu tut
}

// --- GEMINI API BAŞLATMA ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- BOTU BAŞLATMA FONKSİYONU ---
function startBot() {
    if (bot) {
        addLog("Bot zaten çalışıyor!");
        return;
    }

    addLog("Bot başlatılıyor...");
    botStatus = "Bağlanıyor...";

    try {
        bot = mineflayer.createBot({
            host: process.env.MC_HOST || 'oyun.sunucuadresi.com',
            port: parseInt(process.env.MC_PORT) || 25565,
            username: process.env.MC_USERNAME || 'GeminiBot',
            version: process.env.MC_VERSION || '1.21.4'
        });

        bot.on('spawn', () => {
            botStatus = "Aktif (Oyunda)";
            addLog(`Bot başarıyla oyuna girdi: ${bot.username}`);

            // Otomatik Kayıt
            setTimeout(() => {
                if (bot) {
                    bot.chat('/register 12121212 12121212');
                    addLog('/register komutu gönderildi.');
                }
            }, 3000);

            // Otomatik Giriş
            setTimeout(() => {
                if (bot) {
                    bot.chat('/login 12121212');
                    addLog('/login komutu gönderildi.');
                }
            }, 6000);
        });

        bot.on('chat', async (username, message) => {
            if (username === bot.username) return;
            const lowerMsg = message.toLowerCase();

            // Özel Kelime Kontrolü
            if (lowerMsg.includes('sofiamc selam')) {
                bot.chat('aleyküm selam');
                return;
            }

            // Gemini Entegrasyonu
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
                    addLog('Gemini Hatası: ' + error.message);
                    bot.chat('Üzgünüm, şu anda yanıt oluşturamadım.');
                }
            }
        });

        bot.on('kicked', (reason) => {
            botStatus = "Atıldı (Kicked)";
            addLog(`Bot sunucudan atıldı: ${reason}`);
            bot = null;
        });

        bot.on('error', (err) => {
            addLog(`Bot Hatası: ${err.message}`);
        });

    } catch (e) {
        addLog("Kritik Hata: " + e.message);
        botStatus = "Hata Oluştu";
        bot = null;
    }
}

// --- BOTU DURDURMA FONKSİYONU ---
function stopBot() {
    if (bot) {
        bot.quit();
        bot = null;
        botStatus = "Kapalı";
        addLog("Bot manuel olarak kapatıldı.");
    } else {
        addLog("Bot zaten kapalı.");
    }
}

// --- WEB PANELİ (ARAYÜZ) ---
app.get('/', (req, res) => {
    let logHtml = botLogs.map(l => `<li>${l}</li>`).join('');
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>STYK-NET Minecraft Gemini Bot Paneli</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }
                .card { background: #1e293b; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                h1 { color: #38bdf8; margin-bottom: 10px; }
                .status { font-size: 20px; font-weight: bold; margin: 20px 0; padding: 10px; border-radius: 6px; display: inline-block; background: #334155; }
                .btn { padding: 12px 24px; font-size: 16px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; margin: 10px; text-decoration: none; display: inline-block; }
                .btn-start { background: #22c55e; color: white; }
                .btn-stop { background: #ef4444; color: white; }
                .btn:hover { opacity: 0.9; }
                .logs { text-align: left; background: #090d16; padding: 15px; border-radius: 6px; height: 200px; overflow-y: auto; font-family: monospace; font-size: 13px; color: #38bdf8; margin-top: 20px; }
                ul { padding-left: 20px; margin: 0; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🤖 STRYKER Bot Kontrol Paneli</h1>
                <p>Minecraft & Gemini Yapay Zeka Entegrasyon Paneli</p>
                
                <div>
                    Durum: <span class="status">${botStatus}</span>
                </div>

                <div>
                    <form action="/start" method="POST" style="display:inline;">
                        <button type="submit" class="btn btn-start">Botu Başlat / Aktif Et</button>
                    </form>
                    <form action="/stop" method="POST" style="display:inline;">
                        <button type="submit" class="btn btn-stop">Botu Kapat</button>
                    </form>
                </div>

                <h3>Canlı Log Akışı</h3>
                <div class="logs">
                    <ul>${logHtml || '<li>Henüz log bulunmuyor...</li>'}</ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/start', (req, res) => {
    startBot();
    res.redirect('/');
});

app.post('/stop', (req, res) => {
    stopBot();
    res.redirect('/');
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`Web paneli ${PORT} portunda çalışıyor.`);
});
