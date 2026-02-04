// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://192.168.1.7:8080'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuração do MySQL usando variáveis do .env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Configuração do Nodemailer com Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gilalmeidaarte@gmail.com',
        pass: 'avfa qohn athu ioch'
    }
});

// Rota para criar novo pedido
app.post('/criar-pedido', (req, res) => {
    const { cliente_nome, cliente_email, detalhes, valor } = req.body;
    // Validar valor
    if (valor && (isNaN(valor) || valor < 0)) {
        return res.status(400).json({ error: 'Valor inválido' });
    }
    // Gerar código único
    const generateCodigo = () => `PEDIDO${Math.floor(100 + Math.random() * 900)}`;
    let codigo = generateCodigo();

    // Verificar se o código já existe
    const checkCodigo = (callback) => {
        db.query('SELECT codigo FROM pedidos WHERE codigo = ?', [codigo], (err, results) => {
            if (err) {
                console.error('Erro ao verificar código:', err);
                return res.status(500).json({ error: 'Erro no servidor' });
            }
            if (results.length > 0) {
                codigo = generateCodigo();
                checkCodigo(callback);
            } else {
                callback();
            }
        });
    };

    checkCodigo(() => {
        const query = 'INSERT INTO pedidos (codigo, cliente_nome, cliente_email, status, detalhes, valor) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [codigo, cliente_nome, cliente_email, 'iniciado', detalhes, valor || null], (err, result) => {
            if (err) {
                console.error('Erro ao criar pedido:', err);
                return res.status(500).json({ error: 'Erro ao criar pedido' });
            }
            const pedidoId = result.insertId;
            db.query('INSERT INTO historico_pedidos (pedido_id, status, detalhes) VALUES (?, ?, ?)', [pedidoId, 'iniciado', detalhes], (err) => {
                if (err) {
                    console.error('Erro ao criar histórico:', err);
                    return res.status(500).json({ error: 'Erro ao criar histórico' });
                }
                // Enviar e-mail inicial ao cliente
                const mailOptions = {
                    from: 'Gil Almeida Arte <gilalmeidaarte@gmail.com>',
                    to: cliente_email,
                    subject: `Seu Pedido ${codigo} foi Iniciado!`,
                    html: `
                        <h2>Seu Pedido ${codigo} foi Iniciado!</h2>
                        <p>Olá, ${cliente_nome},</p>
                        <p>Boa notícia! Comecei a trabalhar no seu pedido: ${detalhes}.</p>
                        ${valor ? `<p>Valor: R$${parseFloat(valor).toFixed(2)}</p>` : ''}
                        <p>Acompanhe o progresso aqui: <a href="http://127.0.0.1:5500/acompanhar.html">Acompanhar Pedido</a></p>
                        <p>Qualquer dúvida, contate-me pelo WhatsApp: +55 (61) 99346-1625 ou por e-mail: contato@gilalmeida.art.br.</p>
                        <p>Atenciosamente,<br>Gil Almeida Arte</p>
                    `
                };
                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error('Erro ao enviar e-mail:', err);
                        res.status(500).json({ error: 'Pedido criado, mas erro ao enviar e-mail', codigo });
                        return;
                    }
                    res.json({ message: 'Pedido criado e e-mail enviado com sucesso', codigo });
                });
            });
        });
    });
});

// Rota para buscar pedido por código
app.get('/pedido/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    const query = `
        SELECT p.*, h.status AS historico_status, h.detalhes AS historico_detalhes, h.data_atualizacao
        FROM pedidos p
        LEFT JOIN historico_pedidos h ON p.id = h.pedido_id
        WHERE p.codigo = ?
        ORDER BY h.data_atualizacao DESC
    `;
    db.query(query, [codigo], (err, results) => {
        if (err) {
            console.error('Erro na consulta:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        res.json(results);
    });
});

// Rota para atualizar status do pedido
app.post('/atualizar-pedido', (req, res) => {
    const { codigo, status, detalhes } = req.body;

    const queryPedido = 'SELECT id, cliente_email, cliente_nome FROM pedidos WHERE codigo = ?';
    db.query(queryPedido, [codigo], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pedido:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        const pedidoId = results[0].id;
        const clienteEmail = results[0].cliente_email;
        const clienteNome = results[0].cliente_nome;

        const updateQuery = 'UPDATE pedidos SET status = ? WHERE id = ?';
        db.query(updateQuery, [status, pedidoId], (err) => {
            if (err) {
                console.error('Erro ao atualizar pedido:', err);
                return res.status(500).json({ error: 'Erro no servidor' });
            }

            const insertHistorico = 'INSERT INTO historico_pedidos (pedido_id, status, detalhes) VALUES (?, ?, ?)';
            db.query(insertHistorico, [pedidoId, status, detalhes], (err) => {
                if (err) {
                    console.error('Erro ao inserir no histórico:', err);
                    return res.status(500).json({ error: 'Erro no servidor' });
                }

                const mailOptions = {
                    from: 'Gil Almeida Arte <gilalmeidaarte@gmail.com>',
                    to: clienteEmail,
                    subject: `Atualização do Pedido ${codigo}`,
                    text: `
Olá, ${clienteNome},

Seu pedido ${codigo} foi atualizado!

Status: ${status}
Detalhes: ${detalhes}

Acompanhe mais detalhes no nosso site: http://127.0.0.1:5500/acompanhar.html

Atenciosamente,
Gil Almeida Arte
                    `,
                    html: `
                        <h2>Atualização do Pedido ${codigo}</h2>
                        <p>Olá, ${cliente_nome},</p>
                        <p>Seu pedido foi atualizado com os seguintes detalhes:</p>
                        <ul>
                            <li><strong>Status:</strong> ${status}</li>
                            <li><strong>Detalhes:</strong> ${detalhes}</li>
                        </ul>
                        <p>Acompanhe mais detalhes em nosso site: <a href="http://127.0.0.1:5500/acompanhar.html">Acompanhar Pedido</a></p>
                        <p>Atenciosamente,<br>Gil Almeida Arte</p>
                    `
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error('Erro ao enviar e-mail:', err);
                        res.status(500).json({ error: 'Pedido atualizado, mas erro ao enviar e-mail' });
                        return;
                    }
                    res.json({ message: 'Pedido atualizado e e-mail enviado com sucesso' });
                });
            });
        });
    });
});

// Rota para enviar e-mail inicial
app.post('/enviar-email-inicial', (req, res) => {
    const { codigo } = req.body;
    const query = 'SELECT cliente_nome, cliente_email FROM pedidos WHERE codigo = ?';
    db.query(query, [codigo], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pedido:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        const { cliente_nome, cliente_email } = results[0];
        const mailOptions = {
            from: 'Gil Almeida Arte <gilalmeidaarte@gmail.com>',
            to: cliente_email,
            subject: `Seu Pedido ${codigo} foi Iniciado!`,
            html: `
                <h2>Seu Pedido ${codigo} foi Iniciado!</h2>
                <p>Olá, ${cliente_nome},</p>
                <p>Boa notícia! Comecei a trabalhar no seu pedido.</p>
                <p>Acompanhe o progresso aqui: <a href="http://127.0.0.1:5500/acompanhar.html">Acompanhar Pedido</a></p>
                <p>Qualquer dúvida, contate-me pelo WhatsApp: +55 (61) 99346-1625 ou por e-mail: contato@gilalmeida.art.br.</p>
                <p>Atenciosamente,<br>Gil Almeida Arte</p>
            `
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error('Erro ao enviar e-mail:', err);
                return res.status(500).json({ error: 'Erro ao enviar e-mail' });
            }
            res.json({ message: 'E-mail enviado com sucesso' });
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});