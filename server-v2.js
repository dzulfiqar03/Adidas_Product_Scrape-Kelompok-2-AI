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
        if (!behavior) {
            behavior = loadBehavior() || {
                system_instructions: 'Jawab hanya berdasarkan konteks yang diberikan. Jika tidak ada jawaban, tampilkan fallback.',
                fallback_response: 'Mohon maaf, untuk item itu belum ada ditoko kami.',
                max_sentences: 2,
                language: 'id'
            };
        }
        // jika tidak ada konteks yang relevan, kembalikan fallback tanpa memanggil LLM
        if (!contextBlock || contextItems.length === 0) {
            return behavior.fallback_response || 'Mohon maaf, untuk item itu belum ada di toko kami.';
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
    const handleIncomingMessage = async (msg, eventName) => {
        try {
            console.log(
                ` ${eventName} event: from=${msg.from}, fromMe=${msg.fromMe},
body=${JSON.stringify(msg.body)}`
            );
            const messageId = msg && msg.id && msg.id._serialized ?
                msg.id._serialized : null;
            if (messageId) {
                if (handledMessageIds.has(messageId)) {
                    console.log('↪ Ignoring duplicate event for same message');
                    return;
                }
                handledMessageIds.add(messageId);
                setTimeout(() => handledMessageIds.delete(messageId), 5 * 60 *
                    1000);
            }
            if (msg.fromMe) {
                console.log(' Ignoring self-sent message to avoid reply loop');
                return;
            }
            const isPersonalChat = msg.from.endsWith('@c.us') ||
                msg.from.endsWith('@lid');
            const isNotStatus = !msg.from.endsWith('@status');
            if (!isPersonalChat || !isNotStatus) {
                console.log(` Ignoring non-personal or status message:
from=${msg.from}`);
                return;
            }
            console.log(` Personal Message from ${msg.from}: ${msg.body}`);
            try {
                await msg.getChat().then(chat => chat.sendStateTyping());
            } catch (e) {
                console.log('Note: Cannot show typing indicator');
            }
            const knowledge = loadKnowledge();
            const keyword = msg.body.toLowerCase().trim();

            if (knowledge.responses[keyword]) {
                await msg.reply(knowledge.responses[keyword]);
                console.log(' Replied with FAQ keyword match');
            } else {
                const allDocuments = datasetManager.getAllDocuments();
                const contextItems = ragEngine.retrieveContext(
                    msg.body,
                    allDocuments,
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
                        getAIResponse(msg.body, contextItems, behavior),
                        timeoutPromise
                    ]);
                    if (aiResponse) {
                        await msg.reply(aiResponse);
                        console.log(` Replied with AI response (RAG contexts:
${contextItems.length})`);
                    } else {
                        await msg.reply('Maaf, saya tidak memahami pesan Anda. Silakan coba lagi.');
                    }
                } catch (aiError) {
                    console.error('AI Error:', aiError.message);
                    await msg.reply('Maaf, terjadi kesalahan dalam memproses pesan. Silakan coba lagi.');
                }
            }
        } catch (error) {
            console.error('Message handler error:', error.message);
        }
    };
    client.on('message', (msg) => handleIncomingMessage(msg, 'message'));
    client.on('message_create', (msg) => handleIncomingMessage(msg,
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


app.get('/welcome-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Welcome.html'));
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