require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const RAGEngine = require('./lib/rag');
const DatasetManager = require('./lib/dataset');
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/src', express.static(path.join(__dirname, 'src')));

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
const ragEngine = new RAGEngine();
const datasetManager = new DatasetManager();
let client = null;
let qrCodeData = null;
let isReady = false;
let isCleaning = false;
let isInitializing = false;
const handledMessageIds = new Set();
const knowledgeFile = path.join(__dirname, 'knowledge.json');
const behaviorFile = path.join(__dirname, 'config', 'behavior.json');
if (!fs.existsSync(knowledgeFile)) {
    fs.writeFileSync(knowledgeFile, JSON.stringify({
        keywords: {},
        responses: {}
    }, null, 2));
}
function loadKnowledge() {
    try {
        const data = fs.readFileSync(knowledgeFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading knowledge:', error);
        return { keywords: {}, responses: {} };
    }
}
function saveKnowledge(data) {
    try {
        fs.writeFileSync(knowledgeFile, JSON.stringify(data, null, 2));
        ragEngine.clearCache();
        return true;
    } catch (error) {
        console.error('Error saving knowledge:', error);
        return false;
    }
}
function loadBehavior() {
    try {
        if (!fs.existsSync(behaviorFile)) return null;
        const content = fs.readFileSync(behaviorFile, 'utf8');

        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading behavior config:', error.message);
        return null;
    }
}
function saveBehavior(obj) {
    try {
        fs.mkdirSync(path.dirname(behaviorFile), { recursive: true });
        fs.writeFileSync(behaviorFile, JSON.stringify(obj, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving behavior config:', error.message);
        return false;
    }
}
async function getAIResponse(message, contextItems = [], behavior =
    null) {
    try {
        const contextBlock = ragEngine.buildContextBlock(contextItems);
        let searchKey = "";
        if (!behavior) {
            behavior = loadBehavior() || {
                system_instructions: 'Jawab hanya berdasarkan konteks yang diberikan. Jika tidak ada jawaban, tampilkan fallback.',
                fallback_response: 'Mohon maaf, untuk item itu belum ada ditoko kami.',
                max_sentences: 2,
                language: 'id'
            };
        }
        if (!contextBlock || contextItems.length === 0) {
            const userQuery = message.toLowerCase().trim(); // Gunakan message.body agar konsisten dengan kodinganmu
            const knowledge = loadKnowledge();
            const matchedKeyword = Object.keys(knowledge.responses).find(key =>
                userQuery.includes(key.toLowerCase())
            );

            if (matchedKeyword) {
                return knowledge.responses[matchedKeyword];
            }

            const isProductQuery = userQuery.includes("produk") ||
                userQuery.toLowerCase().includes("daftar") ||
                userQuery.toLowerCase().includes("tas") ||
                userQuery.toLowerCase().includes("bag") ||
                userQuery.toLowerCase().includes("topi") ||
                userQuery.toLowerCase().includes("aksesoris") ||
                userQuery.toLowerCase().includes("murah") ||
                userQuery.toLowerCase().includes("termurah") ||
                userQuery.toLowerCase().includes("dibawah") ||
                userQuery.toLowerCase().includes("kurang dari") ||
                userQuery.toLowerCase().includes("mahal") ||
                userQuery.toLowerCase().includes("termahal") ||
                userQuery.toLowerCase().includes("diatas") ||
                userQuery.toLowerCase().includes("lebih dari") ||
                userQuery.toLowerCase().includes("terbaik") ||
                userQuery.toLowerCase().includes("rekomendasi") ||
                userQuery.toLowerCase().includes("terlaris") ||
                userQuery.toLowerCase().includes("laris") ||
                userQuery.toLowerCase().includes("paling laris");

            if (isProductQuery) {
                const aksesorisDocs = datasetManager.getDatasetDocuments('accesories');
                if (aksesorisDocs.length > 0) {
                    // Logika Filter Tas/Bag
                    const isSearchingBag = userQuery.toLowerCase().includes("tas") || userQuery.toLowerCase().includes("bag");
                    const isSearchingHat = userQuery.toLowerCase().includes("cap") || userQuery.toLowerCase().includes("hat") || userQuery.toLowerCase().includes("topi");
                    const isMurah = userQuery.toLowerCase().includes("murah") || userQuery.toLowerCase().includes("dibawah") || userQuery.toLowerCase().includes("kurang dari") || userQuery.toLowerCase().includes("termurah");
                    const isMahal = userQuery.toLowerCase().includes("mahal") || userQuery.toLowerCase().includes("diatas") || userQuery.toLowerCase().includes("lebih dari") || userQuery.toLowerCase().includes("termahal");
                    const isRekomendasi = userQuery.toLowerCase().includes("terbaik") || userQuery.toLowerCase().includes("rekomendasi");
                    const isLaris = userQuery.toLowerCase().includes("terlaris") || userQuery.toLowerCase().includes("laris") || userQuery.toLowerCase().includes("paling laris");
                    const isRateTinggi = userQuery.toLowerCase().includes("rating tertinggi") || userQuery.toLowerCase().includes("tinggi");
                    const isRateRendah = userQuery.toLowerCase().includes("rating terendah") || userQuery.toLowerCase().includes("rendah");

                    if (isSearchingBag) {
                        searchKey = 'bag'
                    } else if (isSearchingHat) {
                        searchKey = 'hat'
                    } else if (isMurah) {
                        searchKey = 'murah'
                    } else if (isMahal) {
                        searchKey = 'mahal'
                    } else if (isRekomendasi) {
                        searchKey = 'rekomendasi'
                    } else if (isLaris) {
                        searchKey = 'laris'
                    } else if (isRateTinggi) {
                        searchKey = 'rateTinggi'
                    } else if (isRateRendah) {
                        searchKey = 'rateRendah'
                    }

                    console.log(aksesorisDocs)

                    const listAksesoris = aksesorisDocs
                        .map(doc => {
                            const rawText = doc.text.split('\n');

                            const titleProduct = rawText.find(l => l.includes('whitespace-normal:')) || "";
                            let nama = titleProduct.replace(/whitespace-normal:/gi, "").replace(/"/g, "").trim() || (rawText || "").replace(/whitespace-normal:/gi, "").replace(/"/g, "").trim();

                            const hargaLine = rawText.find(l => l.includes('font-medium 2:')) || "";

                            const hargaRaw = hargaLine.replace('font-medium 2:', '').replace(/[^0-9]/g, "");
                            const harga = parseInt(hargaRaw, 10) || 0;

                            const ratingLine = rawText.find(l => l.includes('inline-block:')) || "";
                            const rateRaw = ratingLine.replace('inline-block:', '').replace(/[^0-9.]/g, "").trim();
                            const rate = parseFloat(rateRaw) || 0;

                            const larisLin = rawText.find(l => l.includes('truncate:')) || "";
                            const larisRaw = larisLin.replace('truncate:', '').replace(/[^0-9]/g, "");
                            const laris = parseInt(larisRaw, 10) || 0;
                            return { nama, harga, rate, laris };
                        })
                        .filter(item => {
                            if (searchKey === 'bag') {
                                return item.nama.toLowerCase().includes('bag') || item.nama.toLowerCase().includes('tas');
                            }

                            else if (searchKey === 'hat') {
                                return item.nama.toLowerCase().includes('hat') || item.nama.toLowerCase().includes('cap');
                            }
                            return true; // Tampilkan semua jika cuma ketik "daftar produk"
                        }).sort((a, b) => {
                            if (searchKey === 'murah') {
                                return a.harga - b.harga
                            } else if (searchKey === 'mahal') {
                                return b.harga - a.harga
                            } else if (searchKey === 'rekomendasi') {
                                if (b.rate !== a.rate) {
                                    return b.rate - a.rate;
                                }
                                if (b.laris !== a.laris) {
                                    return b.laris - a.laris;
                                }
                                return a.harga - b.harga
                            } else if (searchKey === 'laris') {
                                return b.laris - a.laris;
                            } else if (searchKey === 'rateTinggi') {
                                return b.rate - a.rate;
                            } else if (searchKey === 'rateRendah') {
                                return a.rate - b.rate;
                            }
                            return true
                        })
                        .map((item, idx) => {

                            const formatHarga = new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(item.harga);

                            if (searchKey === 'rekomendasi') {
                                return `${idx + 1}. ${item.nama} - ${formatHarga}, Rating ⭐ ${item.rate.toFixed(1)} || Terjual ${item.laris} item`

                            } else if (searchKey === 'laris') {
                                return `${idx + 1}. ${item.nama} - ${formatHarga} || Terjual ${item.laris} item`

                            } else if (searchKey === 'rateTinggi' || searchKey === 'rateRendah') {
                                return `${idx + 1}. ${item.nama} - ${formatHarga} ||  Rating ⭐ ${item.rate.toFixed(1)}`

                            } else {
                                return `${idx + 1}. ${item.nama} - ${formatHarga}`

                            }
                        })
                        .slice(0, 15)
                        .join('\n');

                    if (listAksesoris) {
                        if (searchKey === 'murah') {
                            return `Berikut daftar koleksi aksesoris termurah kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                        } else if (searchKey === 'mahal') {
                            return `Berikut daftar koleksi aksesoris termahal kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                        } else if (searchKey === 'rekomendasi') {
                            return `Berikut rekomendasi aksesoris kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;
                        }
                        else if (searchKey === 'laris') {
                            return `Berikut aksesoris kami yang terlaris:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                        }
                        else if (searchKey === 'rateTinggi') {
                            return `Berikut aksesoris kami yang memiliki rating tertinggi:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                        } else if (searchKey === 'rateRendah') {
                            return `Berikut aksesoris kami yang memiliki rating terendah:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                        }
                        return `Berikut daftar koleksi aksesoris kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;
                    }
                }
            }
        }
        const systemParts = [];
        if (behavior.system_instructions)
            systemParts.push(behavior.system_instructions);
        systemParts.push(`Jawab hanya menggunakan konteks berikut. Jika
konteks tidak memadai, jawab: ${behavior.fallback_response}`);

        systemParts.push(`Jawab maksimal ${behavior.max_sentences || 2}
kalimat. Bahasa: ${behavior.language || 'id'}.`);
        const systemMessage = systemParts.join(' ');
        const userMessage = `Konteks:\n${contextBlock}\n\nPertanyaan:
${message}`;
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            max_tokens: Number(process.env.GROQ_MAX_TOKENS || 200),
            temperature: 0.1
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error getting AI response:', error.message);
        return null;
    }
}
async function startBot() {
    if (isReady || isInitializing) {
        return { success: false, message: 'Bot sudah berjalan atau sedang dimulai' };
    }
    if (isCleaning) {
        return { success: false, message: 'Bot sedang dihentikan, harap tunggu' };
    }
    isInitializing = true;
    try {
        const clientInstance = initializeClient();
        await clientInstance.initialize();
        isInitializing = false;
        return { success: true, message: 'Bot dimulai, silakan scan QR code' };
    } catch (error) {
        isInitializing = false;
        client = null;
        qrCodeData = null;

        isCleaning = false;
        throw error;
    }
}
function initializeClient() {
    if (client) return client;
    client = new Client({
        authStrategy: new LocalAuth({ clientId: 'whatsapp-bot' }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-resources',
                '--disable-sync',
                '--disable-translate',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-component-extensions-with-background-pages'
            ],
            timeout: 120000
        }
    });
    client.on('qr', (qr) => {
        console.log('📱 QR Code Generated');
        console.log('\n🔗 Scan QR Code di bawah untuk connect bot:\n');
        qrCodeData = qr;
        qrcode.generate(qr, { small: true });
        console.log('\n');
    });
    client.on('ready', () => {
        console.log(' Bot is ready!');
        isReady = true;
        isCleaning = false;
    });
    client.on('authenticated', () => {
        console.log(' Client authenticated');
    });
    client.on('disconnected', (reason) => {
        console.log(' Client disconnected:', reason);

        isReady = false;
        client = null;
    });
    const handleIncomingMessage = async (message, eventName) => {
        try {
            console.log(
                ` ${eventName} event: from=${message.from}, fromMe=${message.fromMe},
body=${JSON.stringify(message.body)}`
            );
            const messageId = message && message.id && message.id._serialized ?
                message.id._serialized : null;
            if (messageId) {
                if (handledMessageIds.has(messageId)) {
                    console.log('↪ Ignoring duplicate event for same message');
                    return;
                }
                handledMessageIds.add(messageId);
                setTimeout(() => handledMessageIds.delete(messageId), 5 * 60 *
                    1000);
            }
            if (message.fromMe) {
                console.log(' Ignoring self-sent message to avoid reply loop');
                return;
            }
            const isPersonalChat = message.from.endsWith('@c.us') ||
                message.from.endsWith('@lid');
            const isNotStatus = !message.from.endsWith('@status');
            if (!isPersonalChat || !isNotStatus) {
                console.log(` Ignoring non-personal or status message:
from=${message.from}`);
                return;
            }
            console.log(` Personal Message from ${message.from}: ${message.body}`);
            try {
                await message.getChat().then(chat => chat.sendStateTyping());
            } catch (e) {
                console.log('Note: Cannot show typing indicator');
            }
            const knowledge = loadKnowledge();
            const keyword = message.body.toLowerCase().trim();

            if (knowledge.responses[keyword]) {
                await message.reply(knowledge.responses[keyword]);
                console.log(' Replied with FAQ keyword match');
            } else {
                const aksesorisKeywords = ['aksesoris', 'accessories', 'topi', 'tas', 'kaos kaki', 'bola'];
                const isTanyaAksesoris = aksesorisKeywords.some(k => message.body.toLowerCase().includes(k));

                let contextDocuments;

                if (isTanyaAksesoris) {

                    console.log("🔒 Filtering context: Only accesories.csv");
                    contextDocuments = datasetManager.getDatasetDocuments('accesories');

                } else {

                    contextDocuments = datasetManager.getAllDocuments();
                }


                const contextItems = ragEngine.retrieveContext(
                    message.body,
                    contextDocuments, // Gunakan hasil filter tadi
                    Number(process.env.RAG_TOP_K || 3)
                );
                console.log(`🔍 RAG Retrieved ${contextItems.length} relevant
context(s)`);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI response timeout')),
                        15000)
                );
                try {
                    const behavior = loadBehavior();
                    const aiResponse = await Promise.race([
                        getAIResponse(message.body, contextItems, behavior),
                        timeoutPromise
                    ]);
                    if (aiResponse) {
                        await message.reply(aiResponse);
                        console.log(` Replied with AI response (RAG contexts:
${contextItems.length})`);
                    } else {
                        await message.reply('Maaf, saya tidak memahami pesan Anda. Silakan coba lagi.');
                    }
                } catch (aiError) {
                    console.error('AI Error:', aiError.message);
                    await message.reply('Maaf, terjadi kesalahan dalam memproses pesan. Silakan coba lagi.');
                }
            }
        } catch (error) {
            console.error('Message handler error:', error.message);
        }
    };
    client.on('message', (message) => handleIncomingMessage(message, 'message'));
    client.on('message_create', (message) => handleIncomingMessage(message,
        'message_create'));

    return client;
}
app.get('/api/bot/status', (req, res) => {
    res.json({
        isReady,
        isCleaning,
        isInitializing,
        hasQRCode: qrCodeData ? true : false
    });
});
app.post('/api/bot/start', async (req, res) => {
    try {
        const result = await startBot();
        return res.json(result);
    } catch (error) {
        console.error('Error starting bot:', error.message);
        res.status(500).json({
            message: 'Error memulai bot. Pastikan koneksi internet stabil dan coba lagi.',
            success: false
        });
    }
});
app.post('/api/bot/stop', async (req, res) => {
    try {
        if (!client) {
            return res.json({
                message: 'Bot tidak sedang berjalan', success:
                    false
            });
        }
        isCleaning = true;
        isReady = false;
        qrCodeData = null;
        const clientToDestroy = client;
        client = null;
        res.json({ message: 'Bot sudah dihentikan', success: true });
        setImmediate(async () => {
            try {
                await clientToDestroy.destroy();
            } catch (destroyError) {

                console.error('Error destroying client:',
                    destroyError.message);
            } finally {
                isCleaning = false;
            }
        });
    } catch (error) {
        console.error('Error stopping bot:', error);
        isCleaning = false;
        res.status(500).json({
            message: 'Error menghentikan bot: ' +
                error.message, success: false
        });
    }
});
app.get('/api/bot/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.json({ qr: null });
    }
});
app.get('/api/datasets', (req, res) => {
    res.json({
        datasets: datasetManager.listDatasets(),
        totalDocuments: datasetManager.getAllDocuments().length
    });
});
app.get('/api/datasets/:name', (req, res) => {
    const docs = datasetManager.getDatasetDocuments(req.params.name);
    if (docs.length === 0) {
        return res.status(404).json({
            message: 'Dataset tidak ditemukan'
        });
    }
    res.json({ documents: docs });
});
app.post('/api/datasets', (req, res) => {
    try {
        const { name, data } = req.body;
        if (!name || !data) {
            return res.status(400).json({ message: 'name dan data harus diisi' });
        }

        const result = datasetManager.saveDataset(name, data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});
app.get('/api/knowledge/keywords', (req, res) => {
    const knowledge = loadKnowledge();
    res.json(knowledge);
});
app.post('/api/knowledge/keyword', (req, res) => {
    try {
        const { keyword, response } = req.body;
        if (!keyword || !response) {
            return res.status(400).json({ message: 'Keyword dan response harus diisi', success: false });
        }
        const knowledge = loadKnowledge();
        knowledge.responses[keyword.toLowerCase().trim()] = response;
        if (saveKnowledge(knowledge)) {
            res.json({
                message: 'Keyword berhasil disimpan', success: true
            });
        } else {
            res.status(500).json({
                message: 'Error menyimpan keyword',
                success: false
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error: ' + error.message, success:
                false
        });
    }
});
app.delete('/api/knowledge/keyword/:keyword', (req, res) => {
    try {
        const keyword =
            decodeURIComponent(req.params.keyword).toLowerCase();
        const knowledge = loadKnowledge();
        if (knowledge.responses[keyword]) {
            delete knowledge.responses[keyword];
            if (saveKnowledge(knowledge)) {

                res.json({
                    message: 'Keyword berhasil dihapus', success: true
                });
            } else {
                res.status(500).json({
                    message: 'Error menghapus keyword',
                    success: false
                });
            }
        } else {
            res.status(404).json({
                message: 'Keyword tidak ditemukan',
                success: false
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error: ' + error.message, success:
                false
        });
    }
});
app.get('/api/behavior', (req, res) => {
    try {
        const behavior = loadBehavior();
        if (!behavior) return res.status(404).json({ message: 'Behavior config not found' });
        res.json(behavior);
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});
app.post('/api/behavior', (req, res) => {
    try {
        const obj = req.body;
        if (!obj || typeof obj !== 'object') {
            return res.status(400).json({
                message: 'Invalid behavior object'
            });
        }
        const saved = saveBehavior(obj);
        if (saved) return res.json({
            message: 'Behavior saved', success:
                true
        });
        res.status(500).json({
            message: 'Error saving behavior', success:
                false
        });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});
app.listen(PORT, () => {
    console.log(` Server berjalan di http://localhost:${PORT}`);
    console.log(` Admin Dashboard: http://localhost:${PORT}`);

    console.log(` Datasets loaded:
${datasetManager.listDatasets().length}`);
    if (process.env.AUTO_START_BOT !== 'false') {
        setTimeout(() => {
            startBot().catch(error => {
                console.error('Error auto-starting bot:', error.message);
            });
        }, 500);
    }
});


app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Product.html'));
});




app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public/WelcomePage.html'));
});


app.get('/api/baca-csv', async (req, res) => {

    const response = await fetch('http://localhost:3001/api/datasets');
    const json = await response.json();

    const dataList = {
        all: {}
    };

    // 2. Isi dataList secara dinamis
    json.datasets?.forEach(item => {
        const fileName = `${item.name}.csv`;
        const filePath = `data/${fileName}`;

        dataList.all[filePath] = fileName;

        dataList[item.name] = {
            [filePath]: fileName
        };
    });


    try {
        const allData = {};
        let allMergedResults = [];
        Object.entries(dataList).forEach(([categoryName, files]) => {

            allData[categoryName] = [];

            Object.entries(files).forEach(([pathKey, fileName]) => {
                const filePath = path.join(__dirname, 'data', fileName);

                if (fs.existsSync(filePath)) {
                    const workbook = xlsx.readFile(filePath);
                    const sheetName = workbook.SheetNames[0];
                    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

                    allData[categoryName].push({
                        file: fileName,
                        total: jsonData.length,
                        results: jsonData
                    });


                    allMergedResults.push(...jsonData);

                } else {
                    console.error(`File tidak ditemukan: ${filePath}`);
                }
            });

            allData["all"] = [
                {
                    file: 'all.csv',
                    total: allMergedResults.length,
                    results: allMergedResults
                }
            ];
        });


        res.json({
            status: "success",
            data: allData
        });

    } catch (error) {
        console.error(error);
        res.status(404).json({
            status: "error",
            message: "File CSV tidak ditemukan di folder src/data/"
        });
    }
});

app.get('/api/bot/info', (req, res) => {
    if (isReady && client && client.info) {
        // Mengambil nomor dari client.info.wid.user
        res.json({
            success: true,
            number: client.info.wid.user
        });
    } else {
        res.json({
            success: false,
            message: 'Bot belum login'
        });
    }
});

