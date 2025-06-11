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
        // Garantir que os novos campos são numéricos
        newItem.internalValue = parseFloat(newItem.internalValue); //
        newItem.saleValue = parseFloat(newItem.saleValue); //
        items.push(newItem);
    });
    await writeData(ITEMS_FILE, items);
    res.status(201).json(newItems);
});

app.put('/api/items/:id', async (req, res) => {
    const items = await readData(ITEMS_FILE);
    const itemId = parseFloat(req.params.id);
    // Desestruturar para obter os novos campos
    const { name, quantity, internalValue, saleValue } = req.body; //
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item não encontrado.' });
    }
    // Atualizar o item com os novos campos
    items[itemIndex] = { ...items[itemIndex], name, quantity, internalValue, saleValue }; //
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

app.post('/api/sales', async (req, res) => {
    // Adicionando discount e paymentMethod na desestruturação
    const { items: saleItems, totalValue, totalPieces, clientName, discount, paymentMethod } = req.body; //
    if (!saleItems || totalValue === undefined || totalPieces === undefined || !clientName || discount === undefined || !paymentMethod) { //
        return res.status(400).json({ message: 'Dados da venda incompletos. Nome do cliente, desconto e método de pagamento são obrigatórios.' }); //
    }

    const sales = await readData(SALES_FILE);
    const newSale = {
        id: Date.now(),
        date: new Date().toISOString(),
        clientName: clientName,
        items: saleItems,
        totalValue,
        totalPieces,
        discount, // Salva o desconto
        paymentMethod // Salva o método de pagamento
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
