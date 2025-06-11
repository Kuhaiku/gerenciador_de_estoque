document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';

    // --- Elementos do DOM ---
    const addItemForm = document.getElementById('add-item-form');
    const itemsToAddContainer = document.getElementById('items-to-add-container');
    const addAnotherItemBtn = document.getElementById('add-another-item-btn');
    const itemsTableBody = document.querySelector('#items-table tbody');
    const newSaleForm = document.getElementById('new-sale-form');
    const clientNameInput = document.getElementById('client-name');
    const saleItemsContainer = document.getElementById('sale-items-container');
    const addItemToSaleBtn = document.getElementById('add-item-to-sale-btn');
    const totalPiecesSoldSpan = document.getElementById('total-pieces-sold');
    const totalSaleValueSpan = document.getElementById('total-sale-value');
    const salesHistoryContainer = document.getElementById('sales-history-container');
    const grandTotalValueSpan = document.getElementById('grand-total-value');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    let availableItems = [];

    // --- FUNÇÕES ---

    const fetchAndDisplayItems = async () => {
        try {
            const response = await fetch(`${apiUrl}/items`);
            if (!response.ok) throw new Error('Erro ao buscar itens.');
            
            const items = await response.json();
            availableItems = items;
            itemsTableBody.innerHTML = '';
            items.forEach(item => {
                const row = document.createElement('tr');
                row.dataset.itemId = item.id;
                row.innerHTML = `
                    <td data-label="Nome"><input type="text" class="edit-name" value="${item.name}"></td>
                    <td data-label="Quantidade"><input type="number" class="edit-quantity" value="${item.quantity}" min="0"></td>
                    <td data-label="Valor Interno (R$)"><input type="number" class="edit-internal-value" value="${item.internalValue}" step="0.01" min="0"></td>
                    <td data-label="Valor de Venda (R$)"><input type="number" class="edit-sale-value" value="${item.saleValue}" step="0.01" min="0"></td>
                    <td data-label="Ações"><button class="delete-btn">Excluir</button></td>
                `;
                itemsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao buscar itens:', error);
            alert('Não foi possível carregar os itens do servidor.');
        }
    };

    const fetchAndDisplaySales = async () => {
        try {
            const response = await fetch(`${apiUrl}/sales`);
            if (!response.ok) throw new Error('Erro ao buscar vendas.');

            const sales = await response.json();
            salesHistoryContainer.innerHTML = '';
            let grandTotal = 0;

            sales.sort((a, b) => b.id - a.id);

            sales.forEach(sale => {
                grandTotal += sale.totalValue;

                const itemsListHTML = sale.items.map(item => `
                    <li>
                        ${item.name} (${item.quantity} un.) - Valor Total: <strong>R$ ${(item.quantity * item.unitValue).toFixed(2)}</strong>
                    </li>
                `).join('');

                const saleCard = document.createElement('div');
                saleCard.className = 'sale-card';
                
                const saleDate = new Date(sale.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                const clientName = sale.clientName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                saleCard.innerHTML = `
                    <div class="sale-card-header">
                        <div class="info-venda">
                            <span class="client-name">${clientName}</span>
                            <span class="sale-id">Venda #${sale.id}</span>
                        </div>
                        <span class="sale-date">Data: ${saleDate}</span>
                    </div>
                    <div class="sale-card-body">
                        <p>Itens vendidos:</p>
                        <ul>${itemsListHTML}</ul>
                    </div>
                    <div class="sale-card-footer">
                        <span>Total de Peças: ${sale.totalPieces}</span>
                        <strong>Valor Total da Venda: R$ ${sale.totalValue.toFixed(2)}</strong>
                    </div>
                `;
                salesHistoryContainer.appendChild(saleCard);
            });

            grandTotalValueSpan.textContent = grandTotal.toFixed(2);

        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            alert('Não foi possível carregar o histórico de vendas.');
        }
    };

    // --- LÓGICA DE EVENTOS ---
    
    // Função para adicionar um novo item com preenchimento automático do valor de venda
    const addNewItemInputFields = (internalValue = '', saleValue = '') => {
        const newItemDiv = document.createElement('div');
        newItemDiv.classList.add('item-to-add');
        newItemDiv.innerHTML = `
            <input type="text" placeholder="Nome do Item" class="item-name" required>
            <input type="number" placeholder="Qtd" class="item-quantity" min="1" required>
            <input type="number" placeholder="Valor Interno (R$)" class="item-internal-value" value="${internalValue}" step="0.01" min="0.01" required>
            <input type="number" placeholder="Valor de Venda (R$)" class="item-sale-value" value="${saleValue}" step="0.01" min="0.01" required>
        `;
        itemsToAddContainer.appendChild(newItemDiv);

        // Adiciona listener para calcular o valor de venda automaticamente
        const internalValueInput = newItemDiv.querySelector('.item-internal-value');
        const saleValueInput = newItemDiv.querySelector('.item-sale-value');

        internalValueInput.addEventListener('input', () => {
            const val = parseFloat(internalValueInput.value);
            if (!isNaN(val)) {
                saleValueInput.value = (val * 1.50).toFixed(2); // 50% de acréscimo
            } else {
                saleValueInput.value = '';
            }
        });
    };

    // Chamada inicial para ter um item no formulário
    addNewItemInputFields();

    addAnotherItemBtn.addEventListener('click', () => {
        addNewItemInputFields(); // Adiciona um novo item com preenchimento automático
    });

    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemDivs = itemsToAddContainer.querySelectorAll('.item-to-add');
        const itemsToSave = Array.from(itemDivs).map(div => {
            const name = div.querySelector('.item-name').value;
            const quantity = parseInt(div.querySelector('.item-quantity').value);
            const internalValue = parseFloat(div.querySelector('.item-internal-value').value);
            const saleValue = parseFloat(div.querySelector('.item-sale-value').value);
            return { name, quantity, internalValue, saleValue };
        });

        if (itemsToSave.length === 0) return;

        try {
            await fetch(`${apiUrl}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemsToSave),
            });
            itemsToAddContainer.innerHTML = ''; // Limpa o container
            addNewItemInputFields(); // Adiciona um novo campo vazio após salvar
            fetchAndDisplayItems();
        } catch (error) {
            console.error('Erro ao adicionar itens:', error);
            alert('Falha ao salvar os itens.');
        }
    });

    itemsTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.itemId;
            if (confirm('Tem certeza que deseja excluir este item?')) {
                try {
                    await fetch(`${apiUrl}/items/${id}`, { method: 'DELETE' });
                    fetchAndDisplayItems();
                } catch (error) {
                    console.error('Erro ao excluir item:', error);
                    alert('Falha ao excluir o item.');
                }
            }
        }
    });

    itemsTableBody.addEventListener('change', async (e) => {
        if (e.target.tagName === 'INPUT') {
            const row = e.target.closest('tr');
            const id = row.dataset.itemId;
            const name = row.querySelector('.edit-name').value;
            const quantity = parseInt(row.querySelector('.edit-quantity').value);
            const internalValue = parseFloat(row.querySelector('.edit-internal-value').value);
            const saleValue = parseFloat(row.querySelector('.edit-sale-value').value);
            
            try {
                await fetch(`${apiUrl}/items/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, quantity, internalValue, saleValue }),
                });
            } catch (error) {
                console.error('Erro ao editar item:', error);
                alert('Falha ao atualizar o item.');
            }
        }
    });

    const updateSaleSummary = () => {
        const saleItems = saleItemsContainer.querySelectorAll('.sale-item');
        let totalPieces = 0;
        let totalValue = 0;

        saleItems.forEach(item => {
            const quantityInput = item.querySelector('.sale-item-quantity');
            const select = item.querySelector('.sale-item-select');
            
            const quantity = parseInt(quantityInput.value) || 0;
            const selectedOption = select.options[select.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.saleValue) {
                const value = parseFloat(selectedOption.dataset.saleValue);
                totalPieces += quantity;
                totalValue += quantity * value;
            }
        });
        totalPiecesSoldSpan.textContent = totalPieces;
        totalSaleValueSpan.textContent = totalValue.toFixed(2);
    };

    const createSaleItemRow = () => {
        const saleItemDiv = document.createElement('div');
        saleItemDiv.classList.add('sale-item');
        
        const select = document.createElement('select');
        select.classList.add('sale-item-select');
        select.required = true;

        let optionsHTML = '<option value="">Selecione um item...</option>';
        availableItems.forEach(item => {
            if (item.quantity > 0) {
                optionsHTML += `<option value="${item.id}" data-internal-value="${item.internalValue}" data-sale-value="${item.saleValue}">${item.name} (Estoque: ${item.quantity})</option>`;
            }
        });
        select.innerHTML = optionsHTML;
        
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.placeholder = 'Qtd';
        quantityInput.className = 'sale-item-quantity';
        quantityInput.min = '1';
        quantityInput.required = true;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-sale-item-btn';
        removeBtn.textContent = 'Remover';

        saleItemDiv.append(select, quantityInput, removeBtn);
        saleItemsContainer.appendChild(saleItemDiv);
    };

    addItemToSaleBtn.addEventListener('click', createSaleItemRow);

    saleItemsContainer.addEventListener('change', updateSaleSummary);
    saleItemsContainer.addEventListener('input', updateSaleSummary);
    saleItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-sale-item-btn')) {
            e.target.closest('.sale-item').remove();
            updateSaleSummary();
        }
    });

    newSaleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const clientName = clientNameInput.value.trim();
        if (!clientName) {
            return alert('Por favor, insira o nome do cliente.');
        }

        const saleItemDivs = saleItemsContainer.querySelectorAll('.sale-item');
        if (saleItemDivs.length === 0) return alert('Adicione pelo menos um item à venda.');

        let insufficientStock = false;
        const saleItems = Array.from(saleItemDivs).map(div => {
            const select = div.querySelector('.sale-item-select');
            const itemId = select.value;
            const quantitySold = parseInt(div.querySelector('.sale-item-quantity').value);
            const selectedItem = availableItems.find(item => item.id == itemId);

            if (!selectedItem || isNaN(quantitySold) || quantitySold <= 0) return null;

            if (quantitySold > selectedItem.quantity) {
                alert(`Estoque insuficiente para o item "${selectedItem.name}". Disponível: ${selectedItem.quantity}`);
                insufficientStock = true;
            }
            return { id: selectedItem.id, name: selectedItem.name, quantity: quantitySold, unitValue: selectedItem.saleValue };
        }).filter(Boolean);

        if (insufficientStock || saleItems.length === 0) return;

        const totalPieces = parseFloat(totalPiecesSoldSpan.textContent);
        const totalValue = parseFloat(totalSaleValueSpan.textContent);

        try {
            await fetch(`${apiUrl}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName, items: saleItems, totalValue, totalPieces }),
            });

            const stockUpdates = saleItems.map(soldItem => {
                const originalItem = availableItems.find(item => item.id === soldItem.id);
                return fetch(`${apiUrl}/items/${soldItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: originalItem.quantity - soldItem.quantity }),
                });
            });
            await Promise.all(stockUpdates);
            
            alert('Venda registrada com sucesso!');
            clientNameInput.value = '';
            saleItemsContainer.innerHTML = '';
            updateSaleSummary();
            fetchAndDisplayItems();
            fetchAndDisplaySales();

        } catch (error) {
            console.error('Erro ao registrar venda:', error);
            alert('Falha ao registrar a venda.');
        }
    });

    clearHistoryBtn.addEventListener('click', async () => {
        const password = prompt('Para limpar todo o histórico, digite a senha:');
        if (password === null) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/sales`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password })
            });

            if (response.ok) {
                alert('Histórico de vendas limpo com sucesso!');
                fetchAndDisplaySales();
            } else if (response.status === 401) {
                alert('Senha incorreta!');
            } else {
                throw new Error('Falha ao limpar o histórico.');
            }
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            alert('Ocorreu um erro ao tentar limpar o histórico.');
        }
    });

    // --- CARREGAMENTO INICIAL ---
    fetchAndDisplayItems();
    fetchAndDisplaySales();
});
