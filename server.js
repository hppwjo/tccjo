import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const user = [];


app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    if (senha.length < 6) {
        return res.status(400).json({ erro: "A senha deve ter 6 caracteres ou mais" });
    }

    const emailExiste = user.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (emailExiste) {
        return res.status(409).json({ erro: "Email já cadastrado" });
    }

    user.push({ usuario, email, senha });

    setTimeout(() => {
        res.json({
            mensagem: "CADASTRO COM SUCESSO",
            PERFIL: `Usuario @${usuario} cadastrado com o email ${email}`
        });
    }, 1000);
});


app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const usuarioExiste = user.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (!usuarioExiste || usuarioExiste.senha !== senha) {
        return res.status(400).json({ erro: "Usuario ou senha incorretos!" });
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioExiste.usuario
    });
});


app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const URL_API = 'https://api.groq.com/openai/v1/chat/completions';
        
    
        const MODELO = 'openai/gpt-oss-120b';

        if (!API_KEY) {
            console.error("❌ Chave GROQ_API_KEY não encontrada no .env");
            return res.status(500).json({ erro: "Chave da API não encontrada no servidor." });
        }

        const historico = req.body.historico || [];

        const mensagens = [
            {
                role: "system",
                content: "Você é o Omni-Man. Responda em português de forma curta, bem-humorada, arrogante como um viltrumita e objetiva."
            },
            ...historico
        ];

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY.trim()}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: mensagens,
                temperature: 0.7
            })
        });

        const textoBruto = await respostaBruta.text();
        console.log("Status Groq (Modelo OpenAI):", respostaBruta.status);

        if (!textoBruto) {
            return res.status(500).json({ erro: `Groq retornou resposta vazia (Status HTTP ${respostaBruta.status}).` });
        }

        const resultado = JSON.parse(textoBruto);

        if (!respostaBruta.ok) {
            console.error("❌ Erro retornado pela Groq:", resultado);
            return res.status(respostaBruta.status).json({ 
                erro: resultado.error?.message || "Erro na comunicação com a Groq." 
            });
        }

        const textoResposta = resultado.choices[0].message.content;
        return res.json({ resposta: textoResposta });

    } catch (erro) {
        console.error("❌ Erro detalhado no servidor:", erro);
        return res.status(500).json({ erro: erro.message || "Falha interna no servidor." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});