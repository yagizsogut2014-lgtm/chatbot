const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Gemini API Başlatma
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Ana Sayfa - Kullanıcının site isteyeceği arayüz
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>STRYKER AI - Otomatik Site Üreteci</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }
                .card { background: #1e293b; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                h1 { color: #38bdf8; margin-bottom: 10px; }
                p { color: #94a3b8; margin-bottom: 30px; }
                textarea { width: 100%; height: 120px; background: #090d16; border: 1px solid #334155; color: #f8fafc; padding: 12px; border-radius: 8px; font-size: 15px; resize: none; box-sizing: border-box; }
                textarea:focus { outline: none; border-color: #38bdf8; }
                button { background: #3b82f6; color: white; border: none; padding: 14px 28px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 20px; width: 100%; transition: background 0.2s; }
                button:hover { background: #2563eb; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🚀 STRYKER AI Site Üreteci</h1>
                <p>Nasıl bir site istiyorsan aşağıya yaz, yapay zeka anında tasarlasın!</p>
                
                <form action="/generate" method="POST">
                    <textarea name="prompt" placeholder="Örn: Modern ve karanlık temalı bir Minecraft sunucu tanıtım sitesi olsun..."></textarea>
                    <button type="submit">Siteyi Oluştur</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Site Kodunu Gemini ile Üretme Rotası
app.post('/generate', async (req, res) => {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
        return res.send('Lütfen bir site açıklaması yazın! <a href="/">Geri dön</a>');
    }

    try {
        // Gemini'ye tam ve tek dosyalık şık bir HTML sitesi üretmesi için talimat veriyoruz
        const aiPrompt = `Kullanıcının şu isteğine göre profesyonel, modern, şık tasarımlı, CSS stilleri içine gömülü (tek dosya) tam bir HTML web sitesi kodu yaz. Sadece saf HTML kodunu ver, Markdown (\`\`\`html ... \`\`\`) blokları kullanma, doğrudan <!DOCTYPE html> ile başlat: ${userPrompt}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
        });

        let htmlCode = response.text.trim();

        // Eğer Gemini yanlışlıkla markdown eklerse temizleyelim
        htmlCode = htmlCode.replace(/^```html/, '').replace(/^```/, '').replace(/```$/, '').trim();

        // Üretilen siteyi geçici olarak sunucuda bir dosyaya kaydedelim
        const fileName = `site-${Date.now()}.html`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, htmlCode);

        res.send(`
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Site Hazır!</title>
                <style>
                    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }
                    .card { background: #1e293b; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; }
                    a { color: #38bdf8; text-decoration: none; font-weight: bold; }
                    .btn { background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>✨ Siten Başarıyla Oluşturuldu!</h1>
                    <p>Yapay zeka istediğin siteyi başarıyla kodladı.</p>
                    <a href="/view/${fileName}" target="_blank" class="btn">Oluşturulan Siteyi Görüntüle</a>
                    <br><br>
                    <a href="/">← Yeni Bir Site Yap</a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Gemini Üretim Hatası:', error);
        res.send('Site üretilirken bir hata oluştu: ' + error.message + ' <a href="/">Geri dön</a>');
    }
});

// Üretilen siteyi tarayıcıda gösterme rotası
app.get('/view/:filename', (req, res) => {
    const filePath = path.join(__dirname, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Site bulunamadı veya süresi doldu.');
    }
});

app.listen(PORT, () => {
    console.log(`Site üreteci ${PORT} portunda aktif!`);
});
