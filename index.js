const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const http = require('http');

// CONFIGURAÇÕES DO SR. JOSÉ DIVINO PRADO DA LAPA
const LINK_CARDAPIO = "https://pradodalapa-hue.github.io/Jdp-industrial-supreme-/";
const LINK_STATUS = "https://pradodalapa-hue.github.io/Leocardios_burguers_status/";

// Servidor HTTP simples para manter o Render ativo e saudável (Health Check)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MOTOR HELENA CORE ONLINE - LEOCARDIO'S BURGUER'S");
}).listen(PORT, () => {
    console.log(`[HELENA SERVER] Monitor HTTP ativo na porta ${PORT}`);
});

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessao_auth');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Silencia logs desnecessários para velocidade máxima
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n======================================================');
            console.log('ESCANEIE O QR CODE NOS LOGS DO RENDER:');
            console.log('======================================================\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[HELENA] Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) {
                iniciarBot();
            }
        } else if (connection === 'open') {
            console.log('\n======================================================');
            console.log('SISTEMA OPERACIONAL: BOT LEOCARDIO\'S ATIVO NO RENDER!');
            console.log('ENGENHARIA: SR. JOSÉ DIVINO PRADO DA LAPA');
            console.log('RESPOSTA: ULTRA-RÁPIDA (WEBSOCKET PURO)');
            console.log('======================================================\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ESCUTA DE MENSAGENS ULTRA-RÁPIDA
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid.includes('@g.us')) return;

            const remetente = msg.key.remoteJid;
            const textoCorpo = (
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                ""
            ).trim().toLowerCase();

            if (!textoCorpo) return;

            console.log(`[MENSAGEM DE ${remetente}]: ${textoCorpo}`);

            const keywords = ['oi', 'olá', 'boa noite', 'bom dia', 'boa tarde', 'cardapio', 'cardápio', 'lanche', 'menu'];

            if (keywords.includes(textoCorpo)) {
                const menu = `🍔 *LEOCARDIO'S BURGUER'S* 🍔\n\n` +
                    `Bem-vindo! Escolha uma opção:\n\n` +
                    `1️⃣ *Acompanhar meu pedido*\n` +
                    `2️⃣ *Ver Cardápio*\n` +
                    `3️⃣ *Falar com atendente*\n\n` +
                    `_Responda apenas com o número da opção._`;

                await sock.sendMessage(remetente, { text: menu });
                console.log(`⚡ [RESPOSTA] Menu enviado para ${remetente}`);
            } 
            else if (textoCorpo === '1') {
                const resposta = `🚀 *Status do Pedido*\n\nAcompanhe o andamento em tempo real:\n${LINK_STATUS}`;
                await sock.sendMessage(remetente, { text: resposta });
                console.log(`⚡ [RESPOSTA] Opção 1 enviada.`);
            } 
            else if (textoCorpo === '2') {
                const resposta = `🌐 *Cardápio Digital*\n\nVeja nossas opções aqui:\n${LINK_CARDAPIO}`;
                await sock.sendMessage(remetente, { text: resposta });
                console.log(`⚡ [RESPOSTA] Opção 2 enviada.`);
            } 
            else if (textoCorpo === '3') {
                const resposta = `📞 *Atendimento Humano*\n\nAguarde um instante, nossa equipe já vai te responder!`;
                await sock.sendMessage(remetente, { text: resposta });
                console.log(`⚡ [RESPOSTA] Opção 3 enviada.`);
            }
        } catch (erro) {
            console.error('[ERRO DISPARO]:', erro);
        }
    });
}

iniciarBot();
