const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const ITEMS_FILE = path.join(__dirname, 'items.json');
const SALES_FILE = path.join(__dirname, 'sales.json');

const readData = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

const writeData = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// --- API: Rotas para Itens ---
app.get('/api/items', async (req, res) => {
    const items = await readData(ITEMS_FILE);
    res.json(items);
});

app.post('/api/items', async (req, res) => {
    const newItems = req.body;
    if (!Array.isArray(newItems)) {
        return res.status(400).json({ message: 'A entrada deve ser um array de itens.' });
    }
    const items = await readData(ITEMS_FILE);
    newItems.forEach(newItem => {
        newItem.id = Date.now() + Math.random();
        items.push(newItem);
    });
    await writeData(ITEMS_FILE, items);
    res.status(201).json(newItems);
});

app.put('/api/items/:id', async (req, res) => {
    const items = await readData(ITEMS_FILE);
    const itemId = parseFloat(req.params.id);
    const updatedItemData = req.body;
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item não encontrado.' });
    }
    items[itemIndex] = { ...items[itemIndex], ...updatedItemData };
    await writeData(ITEMS_FILE, items);
    res.json(items[itemIndex]);
});

app.delete('/api/items/:id', async (req, res) => {
    let items = await readData(ITEMS_FILE);
    const itemId = parseFloat(req.params.id);
    const updatedItems = items.filter(item => item.id !== itemId);
    await writeData(ITEMS_FILE, updatedItems);
    res.status(204).send();
});

// --- API: Rotas para Vendas ---
app.get('/api/sales', async (req, res) => {
    const sales = await readData(SALES_FILE);
    res.json(sales);
});

// ALTERAÇÃO AQUI: Recebe e valida o nome do cliente
app.post('/api/sales', async (req, res) => {
    const { items: saleItems, totalValue, totalPieces, clientName } = req.body;
    if (!saleItems || totalValue === undefined || totalPieces === undefined || !clientName) {
        return res.status(400).json({ message: 'Dados da venda incompletos. Nome do cliente é obrigatório.' });
    }

    const sales = await readData(SALES_FILE);
    const newSale = {
        id: Date.now(),
        date: new Date().toISOString(),
        clientName: clientName, // Salva o nome do cliente
        items: saleItems,
        totalValue,
        totalPieces
    };

    sales.push(newSale);
    await writeData(SALES_FILE, sales);
    res.status(201).json(newSale);
});

app.delete('/api/sales', async (req, res) => {
    const { password } = req.body;

    if (password !== '8812') {
        return res.status(401).json({ message: 'Senha incorreta.' });
    }

    try {
        await writeData(SALES_FILE, []);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao limpar o histórico de vendas.' });
    }
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
