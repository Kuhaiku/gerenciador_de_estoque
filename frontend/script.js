document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_PREFIX = 'estoque_vendas_';
    const ITEMS_STORAGE_KEY = STORAGE_PREFIX + 'items';
    const SALES_STORAGE_KEY = STORAGE_PREFIX + 'sales';
    const CLIENTS_STORAGE_KEY = STORAGE_PREFIX + 'clients';
    const ADMIN_PASSWORD = 'admin';

    // Variável para a porcentagem de venda (1.50 = 50% de lucro sobre o valor interno)
    const PERCENTUAL_VENDA_PADRAO = 1.70; // Altere este valor para mudar a porcentagem de venda

    // --- Elementos do DOM ---
    const addItemForm = document.getElementById('add-item-form');
    const itemsToAddContainer = document.getElementById('items-to-add-container');
    const addAnotherItemBtn = document.getElementById('add-another-item-btn');
    const itemsTableBody = document.querySelector('#items-table tbody');

    const addClientForm = document.getElementById('add-client-form');
    const clientRegisterNameInput = document.getElementById('client-register-name');
    const clientRegisterPhoneInput = document.getElementById('client-register-phone');
    const clientRegisterAddressInput = document.getElementById('client-register-address');
    const clientsTableBody = document.querySelector('#clients-table tbody');

    const newSaleForm = document.getElementById('new-sale-form');
    const saleClientSelect = document.getElementById('sale-client-select');

    // Referência ao contêiner para o input de nome de cliente anônimo no HTML
    const clientAnonymousNameContainer = document.getElementById('client-anonymous-name-container');

    const saleItemsContainer = document.getElementById('sale-items-container');
    const addItemToSaleBtn = document.getElementById('add-item-to-sale-btn');
    const totalPiecesSoldSpan = document.getElementById('total-pieces-sold');
    const totalValueBeforeDiscountSpan = document.getElementById('total-value-before-discount');
    const discountAppliedSpan = document.getElementById('discount-applied');
    const totalSaleValueSpan = document.getElementById('total-sale-value');
    const salesHistoryContainer = document.getElementById('sales-history-container');
    const grandTotalValueSpan = document.getElementById('grand-total-value');
    const estimatedProfitValueSpan = document.getElementById('estimated-profit-value');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const exportSalesBtn = document.getElementById('export-sales-btn');
    // Removendo referências a botões de exportação que não existem mais no HTML
    // const exportItemsBtn = document.getElementById('export-items-btn'); 
    // const exportClientsBtn = document.getElementById('export-clients-btn');

    const saleDiscountInput = document.getElementById('sale-discount');
    const paymentMethodSelect = document.getElementById('payment-method');
    const discountGroup = document.getElementById('discount-group');
    const paymentMethodGroup = document.getElementById('payment-method-group');

    let availableItems = [];
    let salesHistory = [];
    let clients = [];

    // Cria e insere o input para o nome do cliente anônimo dinamicamente
    const saleClientNameInputAnonymous = document.createElement('input');
    saleClientNameInputAnonymous.type = 'text';
    saleClientNameInputAnonymous.placeholder = 'Nome do comprador';
    saleClientNameInputAnonymous.id = 'sale-client-name-anonymous';
    saleClientNameInputAnonymous.classList.add('form-control'); // Para pegar os estilos padrão de input
    saleClientNameInputAnonymous.style.display = 'none'; // Começa escondido
    clientAnonymousNameContainer.appendChild(saleClientNameInputAnonymous); // Insere no novo container

    // --- Funções de Persistência (localStorage) ---
    const loadFromStorage = (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Erro ao carregar do localStorage (${key}):`, e);
            return [];
        }
    };

    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Erro ao salvar no localStorage (${key}):`, e);
            alert('Não foi possível salvar os dados. O armazenamento local pode estar cheio.');
        }
    };

    // --- Funções de Manipulação de Dados de Itens ---
    const fetchItems = () => {
        availableItems = loadFromStorage(ITEMS_STORAGE_KEY);
        availableItems = availableItems.map(item => ({
            id: item.id || Date.now() + Math.random(),
            name: item.name,
            quantity: item.quantity,
            internalValue: parseFloat(item.internalValue || 0),
            saleValue: parseFloat(item.saleValue || 0)
        }));
        displayItems();
    };

    const displayItems = () => {
        itemsTableBody.innerHTML = '';
        if (availableItems.length === 0) {
            itemsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum item cadastrado.</td></tr>';
            return;
        }

        availableItems.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.itemId = item.id;
            row.innerHTML = `
                <td data-label="Nome"><input type="text" class="edit-name" value="${escapeHTML(item.name)}"></td>
                <td data-label="Quantidade"><input type="number" class="edit-quantity" value="${item.quantity}" min="0"></td>
                <td data-label="Valor Interno (R$)"><input type="number" class="edit-internal-value" value="${item.internalValue.toFixed(2)}" step="0.01" min="0"></td>
                <td data-label="Valor de Venda (R$)"><input type="number" class="edit-sale-value" value="${item.saleValue.toFixed(2)}" step="0.01" min="0"></td>
                <td data-label="Ações"><button class="delete-btn"><i class="fas fa-trash-alt"></i> Excluir</button></td>
            `;
            itemsTableBody.appendChild(row);
        });
    };

    const addItem = (items) => {
        items.forEach(newItem => {
            newItem.id = Date.now() + Math.random();
            availableItems.push(newItem);
        });
        saveToStorage(ITEMS_STORAGE_KEY, availableItems);
        displayItems();
        document.querySelectorAll('.sale-item-select').forEach(select => populateSaleItemSelect(select));
    };

    const updateItem = (id, updatedFields) => {
        const itemIndex = availableItems.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            availableItems[itemIndex] = { ...availableItems[itemIndex], ...updatedFields };
            saveToStorage(ITEMS_STORAGE_KEY, availableItems);
            document.querySelectorAll('.sale-item-select').forEach(select => populateSaleItemSelect(select));
        }
    };

    const deleteItem = (id) => {
        availableItems = availableItems.filter(item => item.id != id);
        saveToStorage(ITEMS_STORAGE_KEY, availableItems);
        displayItems();
        document.querySelectorAll('.sale-item-select').forEach(select => populateSaleItemSelect(select));
    };

    // --- Funções de Manipulação de Dados de Clientes ---
    const fetchClients = () => {
        clients = loadFromStorage(CLIENTS_STORAGE_KEY);
        clients = clients.map(client => ({
            id: client.id || Date.now() + Math.random(),
            name: client.name,
            phone: client.phone || '',
            address: client.address || ''
        }));
        displayClients();
        populateClientSelect();
    };

    const displayClients = () => {
        clientsTableBody.innerHTML = '';
        if (clients.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        clients.forEach(client => {
            const row = document.createElement('tr');
            row.dataset.clientId = client.id;
            row.innerHTML = `
                <td data-label="Nome"><input type="text" class="edit-client-name" value="${escapeHTML(client.name)}"></td>
                <td data-label="Telefone"><input type="tel" class="edit-client-phone" value="${escapeHTML(client.phone || '')}"></td>
                <td data-label="Endereço"><input type="text" class="edit-client-address" value="${escapeHTML(client.address || '')}"></td>
                <td data-label="Ações"><button class="delete-btn"><i class="fas fa-trash-alt"></i> Excluir</button></td>
            `;
            clientsTableBody.appendChild(row);
        });
    };

    const addClient = (newClient) => {
        newClient.id = Date.now() + Math.random();
        clients.push(newClient);
        saveToStorage(CLIENTS_STORAGE_KEY, clients);
        displayClients();
        populateClientSelect();
    };

    const updateClient = (id, updatedFields) => {
        const clientIndex = clients.findIndex(client => client.id == id);
        if (clientIndex > -1) {
            clients[clientIndex] = { ...clients[clientIndex], ...updatedFields };
            saveToStorage(CLIENTS_STORAGE_KEY, clients);
            populateClientSelect();
            displaySales();
        }
    };

    const deleteClient = (id) => {
        clients = clients.filter(client => client.id != id);
        saveToStorage(CLIENTS_STORAGE_KEY, clients);
        displayClients();
        populateClientSelect();
        displaySales();
    };

    // --- Funções de Manipulação de Dados de Vendas ---
    const fetchSales = () => {
        salesHistory = loadFromStorage(SALES_STORAGE_KEY);
        displaySales();
    };

    const displaySales = () => {
        salesHistoryContainer.innerHTML = '';
        let grandTotal = 0;
        let estimatedProfit = 0;

        salesHistory.sort((a, b) => b.id - a.id);

        if (salesHistory.length === 0) {
            salesHistoryContainer.innerHTML = '<p style="text-align: center; color: #777;">Nenhuma venda registrada ainda.</p>';
        }

        salesHistory.forEach(sale => {
            grandTotal += sale.totalValue;
            estimatedProfit += (sale.totalValue - sale.totalInternalCost);

            const itemsListHTML = sale.items.map(item => `
                <li>
                    ${escapeHTML(item.name)} (${item.quantity} un.) - V.Unit: R$ ${item.unitValue.toFixed(2)} - Total: <strong>R$ ${(item.quantity * item.unitValue).toFixed(2)}</strong>
                </li>
            `).join('');

            const saleDate = new Date(sale.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            let clientDisplayName = escapeHTML(sale.clientName);
            let clientPhone = '';
            let clientAddress = '';

            if (sale.clientId && sale.clientId !== 'cliente-sem-cadastro') {
                const clientInfo = clients.find(c => c.id == sale.clientId);
                if (clientInfo) {
                    clientDisplayName = escapeHTML(clientInfo.name);
                    clientPhone = clientInfo.phone ? `Tel: ${escapeHTML(clientInfo.phone)}` : '';
                    clientAddress = clientInfo.address ? `End: ${escapeHTML(clientInfo.address)}` : '';
                }
            }


            const saleCard = document.createElement('div');
            saleCard.className = 'sale-card';
            saleCard.innerHTML = `
                <div class="sale-card-header">
                    <div class="info-venda">
                        <span class="client-name">${clientDisplayName}</span>
                        <span class="sale-id">Venda #${sale.id}</span>
                        ${clientPhone ? `<span class="client-phone">${clientPhone}</span>` : ''}
                        ${clientAddress ? `<span class="client-address">${clientAddress}</span>` : ''}
                    </div>
                    <span class="sale-date"><i class="fas fa-calendar-alt"></i> ${saleDate}</span>
                </div>
                <div class="sale-card-body">
                    <p>Itens vendidos:</p>
                    <ul>${itemsListHTML}</ul>
                    <p>Método de Pagamento: <strong>${sale.paymentMethod || 'N/A'}</strong></p>
                    <p>Desconto Aplicado: <strong>R$ ${sale.discount ? sale.discount.toFixed(2) : '0.00'}</strong></p>
                </div>
                <div class="sale-card-footer">
                    <span>Total de Peças: ${sale.totalPieces}</span>
                    <strong>Valor Líquido da Venda: R$ ${sale.totalValue.toFixed(2)}</strong>
                </div>
            `;
            salesHistoryContainer.appendChild(saleCard);
        });

        grandTotalValueSpan.textContent = grandTotal.toFixed(2);
        estimatedProfitValueSpan.textContent = estimatedProfit.toFixed(2);
    };

    const addSale = (sale) => {
        salesHistory.push(sale);
        saveToStorage(SALES_STORAGE_KEY, salesHistory);
        displaySales();
    };

 const clearAllHistory = () => {
        const password = prompt('Para limpar SOMENTE o histórico de vendas, digite a senha de administrador:'); // Texto atualizado
        if (password === ADMIN_PASSWORD) {
            if (confirm('Tem certeza que deseja limpar SOMENTE o histórico de vendas? Esta ação NÃO PODE ser desfeita.')) { // Texto atualizado
                // Limpa apenas os dados de vendas no localStorage
                localStorage.removeItem(SALES_STORAGE_KEY);
                
                // Reseta apenas a array in-memory de vendas
                salesHistory = [];

                // Re-renderiza apenas os componentes afetados pelo histórico de vendas
                displaySales();
                
                // Reseta o resumo da venda para 0.00
                grandTotalValueSpan.textContent = '0.00';
                estimatedProfitValueSpan.textContent = '0.00';

                alert('Histórico de vendas limpo com sucesso!'); // Texto atualizado
            }
        } else if (password !== null) {
            alert('Senha incorreta. O histórico não foi limpo.');
        }
    };

    // --- Funções Auxiliares ---
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    const calculateSaleValues = () => {
        const saleItems = saleItemsContainer.querySelectorAll('.sale-item');
        let totalPieces = 0;
        let totalValueBeforeDiscount = 0;
        let totalInternalValueForSale = 0;

        saleItems.forEach(itemDiv => {
            const quantityInput = itemDiv.querySelector('.sale-item-quantity');
            const select = itemDiv.querySelector('.sale-item-select');
            
            const quantity = parseInt(quantityInput.value) || 0;
            const selectedOption = select.options[select.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.saleValue && selectedOption.dataset.internalValue) {
                const saleItemValue = parseFloat(selectedOption.dataset.saleValue);
                const internalItemValue = parseFloat(selectedOption.dataset.internalValue);
                
                totalPieces += quantity;
                totalValueBeforeDiscount += quantity * saleItemValue;
                totalInternalValueForSale += quantity * internalItemValue;
            }
        });

        const discount = parseFloat(saleDiscountInput.value) || 0;
        let finalValue = totalValueBeforeDiscount - discount;

        if (finalValue < totalInternalValueForSale) {
            const maxDiscountAllowed = totalValueBeforeDiscount - totalInternalValueForSale;
            if (maxDiscountAllowed < 0) {
                alert(`ATENÇÃO: O preço de venda dos itens é menor que o custo interno. Ajuste os valores dos itens ou reavalie a venda.`);
                saleDiscountInput.value = '0.00';
                finalValue = totalValueBeforeDiscount;
            } else {
                saleDiscountInput.value = maxDiscountAllowed.toFixed(2);
                finalValue = totalInternalValueForSale;
            }
        } else if (finalValue < 0) {
            finalValue = 0;
            saleDiscountInput.value = totalValueBeforeDiscount.toFixed(2);
        }

        totalPiecesSoldSpan.textContent = totalPieces;
        totalValueBeforeDiscountSpan.textContent = totalValueBeforeDiscount.toFixed(2);
        discountAppliedSpan.textContent = discount.toFixed(2);
        totalSaleValueSpan.textContent = finalValue.toFixed(2);

        return { totalPieces, totalValue: finalValue, totalInternalCost: totalInternalValueForSale };
    };

    const populateSaleItemSelect = (selectElement) => {
        let optionsHTML = '<option value="">Selecione um item...</option>';
        availableItems.forEach(item => {
            if (item.quantity > 0) {
                optionsHTML += `<option value="${item.id}" 
                                data-internal-value="${item.internalValue.toFixed(2)}" 
                                data-sale-value="${item.saleValue.toFixed(2)}"
                                data-available-quantity="${item.quantity}">
                                ${escapeHTML(item.name)} (Estoque: ${item.quantity})
                            </option>`;
            }
        });
        selectElement.innerHTML = optionsHTML;
    };

    const populateClientSelect = () => {
        let optionsHTML = '<option value="cliente-sem-cadastro">Cliente Sem Cadastro</option>';
        clients.forEach(client => {
            optionsHTML += `<option value="${client.id}">${escapeHTML(client.name)}</option>`;
        });
        saleClientSelect.innerHTML = optionsHTML;
    };

    const createSaleItemRow = () => {
        discountGroup.style.display = 'block';
        paymentMethodGroup.style.display = 'block';
        saleDiscountInput.required = true;
        paymentMethodSelect.required = true;

        const saleItemDiv = document.createElement('div');
        saleItemDiv.classList.add('sale-item');
        
        const select = document.createElement('select');
        select.classList.add('sale-item-select');
        select.required = true;
        populateSaleItemSelect(select);
        
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.placeholder = 'Qtd';
        quantityInput.className = 'sale-item-quantity';
        quantityInput.min = '1';
        quantityInput.required = true;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-sale-item-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i> Remover';

        saleItemDiv.append(select, quantityInput, removeBtn);
        saleItemsContainer.appendChild(saleItemDiv);
        calculateSaleValues();
    };

    const handleInitialAddItemInput = () => {
        const initialItemDiv = itemsToAddContainer.querySelector('.item-to-add');
        if (initialItemDiv) {
            const removeBtn = initialItemDiv.querySelector('.remove-add-item-btn');
            // Só mostra o botão de remover se houver mais de 1 item (já há 1 no HTML)
            if (itemsToAddContainer.children.length > 1 && removeBtn) {
                removeBtn.style.display = 'block';
            } else if (removeBtn) {
                removeBtn.style.display = 'none'; // Esconde se for o único item
            }

            const internalValueInput = initialItemDiv.querySelector('.item-internal-value');
            const saleValueInput = initialItemDiv.querySelector('.item-sale-value');
            if (internalValueInput && saleValueInput) {
                internalValueInput.removeEventListener('input', updateSaleValue); // Remove para evitar duplicidade
                internalValueInput.addEventListener('input', updateSaleValue);
            }
        }
    };

    const updateSaleValue = (e) => {
        const internalValueInput = e.target;
        const saleValueInput = internalValueInput.closest('.item-to-add').querySelector('.item-sale-value');
        const val = parseFloat(internalValueInput.value);
        if (!isNaN(val) && val > 0) {
            saleValueInput.value = (val * PERCENTUAL_VENDA_PADRAO).toFixed(2); // Usa a variável aqui
        } else {
            saleValueInput.value = '';
        }
    };
    
    // --- Funções de Exportação ---
    const exportToCsv = (filename, data) => {
        const csvRows = [];
        if (data.length === 0) {
            console.warn("Nenhum dado para exportar.");
            return;
        }

        const headers = Object.keys(data[0]);
        csvRows.push(headers.join(';'));

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(';'));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- EVENT LISTENERS ---

    // Cadastro de Itens
    addAnotherItemBtn.addEventListener('click', () => {
        const newItemDiv = document.createElement('div');
        newItemDiv.classList.add('item-to-add');
        newItemDiv.innerHTML = `
            <input type="text" placeholder="Nome do Item" class="item-name" required>
            <input type="number" placeholder="Qtd" class="item-quantity" min="1" required>
            <input type="number" placeholder="Valor Interno (R$)" class="item-internal-value" step="0.01" min="0.01" required>
            <input type="number" placeholder="Valor de Venda (R$)" class="item-sale-value" step="0.01" min="0.01" required>
            <button type="button" class="remove-add-item-btn"><i class="fas fa-times"></i></button>
        `;
        itemsToAddContainer.appendChild(newItemDiv);

        const internalValueInput = newItemDiv.querySelector('.item-internal-value');
        internalValueInput.addEventListener('input', updateSaleValue);

        handleInitialAddItemInput(); // Reavalia visibilidade do botão de remover
    });

    itemsToAddContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-add-item-btn') || e.target.closest('.remove-add-item-btn')) {
            const itemToRemove = e.target.closest('.item-to-add');
            if (itemsToAddContainer.children.length > 1) { // Só remove se não for o último item
                itemToRemove.remove();
            } else {
                alert('Você não pode remover o último item do formulário de cadastro. Limpe os campos ou adicione um novo.');
            }
            handleInitialAddItemInput(); // Reavalia visibilidade do botão de remover
        }
    });

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemDivs = itemsToAddContainer.querySelectorAll('.item-to-add');
        const itemsToSave = Array.from(itemDivs).map(div => {
            const name = div.querySelector('.item-name').value.trim();
            const quantity = parseInt(div.querySelector('.item-quantity').value);
            const internalValue = parseFloat(div.querySelector('.item-internal-value').value);
            const saleValue = parseFloat(div.querySelector('.item-sale-value').value);

            if (!name || isNaN(quantity) || quantity <= 0 || isNaN(internalValue) || internalValue <= 0 || isNaN(saleValue) || saleValue <= 0) {
                alert('Por favor, preencha todos os campos do item corretamente (quantidade e valores devem ser maiores que zero).');
                return null;
            }
            return { name, quantity, internalValue, saleValue };
        }).filter(Boolean);

        if (itemsToSave.length === 0) {
            alert('Nenhum item válido para salvar.');
            return;
        }

        addItem(itemsToSave);
        // Limpa e restaura o primeiro campo para o estado inicial
        itemsToAddContainer.innerHTML = `
            <div class="item-to-add">
                <input type="text" placeholder="Nome do Item" class="item-name" required>
                <input type="number" placeholder="Qtd" class="item-quantity" min="1" required>
                <input type="number" placeholder="Valor Interno (R$)" class="item-internal-value" step="0.01" min="0.01" required>
                <input type="number" placeholder="Valor de Venda (R$)" class="item-sale-value" step="0.01" min="0.01" required>
                <button type="button" class="remove-add-item-btn" style="display: none;"><i class="fas fa-times"></i></button>
            </div>`;
        handleInitialAddItemInput(); // Re-adiciona listener e esconde o botão de remover do primeiro item
        alert('Itens salvos com sucesso!');
    });

    // Edição e Exclusão de Itens na Tabela
    itemsTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.itemId;
            if (confirm('Tem certeza que deseja excluir este item? Esta ação é irreversível.')) {
                deleteItem(id);
                alert('Item excluído!');
            }
        }
    });

    itemsTableBody.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT') {
            const row = e.target.closest('tr');
            const id = row.dataset.itemId;
            const name = row.querySelector('.edit-name').value.trim();
            const quantity = parseInt(row.querySelector('.edit-quantity').value);
            const internalValue = parseFloat(row.querySelector('.edit-internal-value').value);
            const saleValue = parseFloat(row.querySelector('.edit-sale-value').value);

            if (!name || isNaN(quantity) || quantity < 0 || isNaN(internalValue) || internalValue < 0 || isNaN(saleValue) || saleValue < 0) {
                alert('Por favor, insira valores válidos para Nome, Quantidade e Valores (não podem ser negativos).');
                fetchItems();
                return;
            }
            updateItem(id, { name, quantity, internalValue, saleValue });
        }
    });

    // --- Cadastro de Clientes ---
    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = clientRegisterNameInput.value.trim();
        const phone = clientRegisterPhoneInput.value.trim();
        const address = clientRegisterAddressInput.value.trim();

        if (!name) {
            alert('O nome do cliente é obrigatório.');
            return;
        }

        const newClient = { name, phone, address };
        addClient(newClient);
        clientRegisterNameInput.value = '';
        clientRegisterPhoneInput.value = '';
        clientRegisterAddressInput.value = '';
        alert('Cliente cadastrado com sucesso!');
    });

    // Edição e Exclusão de Clientes na Tabela
    clientsTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.clientId;
            if (confirm('Tem certeza que deseja excluir este cliente?')) {
                deleteClient(id);
                alert('Cliente excluído!');
            }
        }
    });

    clientsTableBody.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT') {
            const row = e.target.closest('tr');
            const id = row.dataset.clientId;
            const name = row.querySelector('.edit-client-name').value.trim();
            const phone = row.querySelector('.edit-client-phone').value.trim();
            const address = row.querySelector('.edit-client-address').value.trim();

            if (!name) {
                alert('O nome do cliente não pode ser vazio.');
                fetchClients();
                return;
            }
            updateClient(id, { name, phone, address });
        }
    });


    // Nova Venda
    addItemToSaleBtn.addEventListener('click', () => {
        if (availableItems.length === 0) {
            alert('Não há itens cadastrados para adicionar a uma venda. Por favor, cadastre alguns itens primeiro.');
            return;
        }
        createSaleItemRow();
    });

    saleItemsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('sale-item-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const quantityInput = e.target.closest('.sale-item').querySelector('.sale-item-quantity');
            
            if (selectedOption.value) {
                quantityInput.max = selectedOption.dataset.availableQuantity;
                quantityInput.value = 1;
            } else {
                quantityInput.value = '';
                quantityInput.removeAttribute('max');
            }
        }
        calculateSaleValues();
    });

    saleItemsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('sale-item-quantity')) {
            const quantityInput = e.target;
            const selectedItemSelect = e.target.closest('.sale-item').querySelector('.sale-item-select');
            const selectedOption = selectedItemSelect.options[selectedItemSelect.selectedIndex];
            const availableQuantity = parseInt(selectedOption.dataset.availableQuantity);
            const requestedQuantity = parseInt(quantityInput.value);

            if (requestedQuantity > availableQuantity) {
                alert(`Quantidade solicitada (${requestedQuantity}) excede o estoque disponível (${availableQuantity}) para este item.`);
                quantityInput.value = availableQuantity;
            } else if (requestedQuantity < 1 && quantityInput.value !== '') {
                quantityInput.value = 1;
            }
        }
        calculateSaleValues();
    });

    saleItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-sale-item-btn') || e.target.closest('.remove-sale-item-btn')) {
            e.target.closest('.sale-item').remove();
            if (saleItemsContainer.children.length === 0) {
                discountGroup.style.display = 'none';
                paymentMethodGroup.style.display = 'none';
                saleDiscountInput.required = false;
                paymentMethodSelect.required = false;
                saleDiscountInput.value = '0.00';
                paymentMethodSelect.value = '';
            }
            calculateSaleValues();
        }
    });

    saleDiscountInput.addEventListener('input', calculateSaleValues);

    // Lógica para mostrar/esconder o input de nome de cliente anônimo
    saleClientSelect.addEventListener('change', () => {
        if (saleClientSelect.value === 'cliente-sem-cadastro') {
            saleClientNameInputAnonymous.style.display = 'block';
            saleClientNameInputAnonymous.required = false;
            saleClientNameInputAnonymous.value = '';
        } else {
            saleClientNameInputAnonymous.style.display = 'none';
            saleClientNameInputAnonymous.required = false;
            saleClientNameInputAnonymous.value = '';
        }
    });


    newSaleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedClientId = saleClientSelect.value;
        let clientName = 'Cliente Sem Cadastro';
        let clientId = null;

        if (selectedClientId === 'cliente-sem-cadastro') {
            clientName = saleClientNameInputAnonymous.value.trim() || 'Cliente Sem Cadastro';
        } else {
            const client = clients.find(c => c.id == selectedClientId);
            if (client) {
                clientName = client.name;
                clientId = client.id;
            }
        }

        const discount = parseFloat(saleDiscountInput.value) || 0;
        const paymentMethod = paymentMethodSelect.value;

        const saleItemDivs = saleItemsContainer.querySelectorAll('.sale-item');
        if (saleItemDivs.length === 0) {
            alert('Adicione pelo menos um item à venda.');
            return;
        }

        if (!paymentMethod) {
            alert('Por favor, selecione o método de pagamento.');
            return;
        }

        let totalInternalCostForSale = 0;
        const itemsForSale = Array.from(saleItemDivs).map(div => {
            const select = div.querySelector('.sale-item-select');
            const quantitySold = parseInt(div.querySelector('.sale-item-quantity').value);
            
            const selectedItemOption = select.options[select.selectedIndex];
            if (!selectedItemOption || !selectedItemOption.value) return null;

            const itemId = selectedItemOption.value;
            const selectedItem = availableItems.find(item => item.id == itemId);

            if (!selectedItem || isNaN(quantitySold) || quantitySold <= 0) {
                return null;
            }

            if (quantitySold > selectedItem.quantity) {
                alert(`Estoque insuficiente para o item "${selectedItem.name}". Disponível: ${selectedItem.quantity}, Solicitado: ${quantitySold}. Ajuste a quantidade.`);
                return null;
            }
            
            totalInternalCostForSale += quantitySold * selectedItem.internalValue;
            return {
                id: selectedItem.id,
                name: selectedItem.name,
                quantity: quantitySold,
                unitValue: selectedItem.saleValue,
                internalValue: selectedItem.internalValue
            };
        }).filter(Boolean);

        if (itemsForSale.length === 0 || itemsForSale.length !== saleItemDivs.length) {
            alert('Por favor, verifique os itens da venda. Certifique-se de que todos os itens estão selecionados e as quantidades são válidas.');
            return;
        }

        const { totalPieces, totalValue } = calculateSaleValues();

        const currentTotalValueBeforeDiscount = parseFloat(totalValueBeforeDiscountSpan.textContent);
        if ((currentTotalValueBeforeDiscount - discount) < totalInternalCostForSale) {
            const maxDiscountAllowed = currentTotalValueBeforeDiscount - totalInternalCostForSale;
            alert(`O desconto excede o limite! Desconto máximo permitido: R$ ${maxDiscountAllowed.toFixed(2)}. Ajuste o desconto.`);
            saleDiscountInput.value = maxDiscountAllowed.toFixed(2);
            calculateSaleValues();
            return;
        }

        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            clientName: clientName,
            clientId: clientId,
            items: itemsForSale,
            totalValue: totalValue,
            totalPieces: totalPieces,
            discount: discount,
            paymentMethod: paymentMethod,
            totalInternalCost: totalInternalCostForSale
        };

        addSale(newSale);

        itemsForSale.forEach(soldItem => {
            const itemInStock = availableItems.find(item => item.id === soldItem.id);
            if (itemInStock) {
                itemInStock.quantity -= soldItem.quantity;
                updateItem(itemInStock.id, { quantity: itemInStock.quantity });
            }
        });

        alert('Venda registrada e estoque atualizado com sucesso!');
        saleClientSelect.value = 'cliente-sem-cadastro';
        saleClientNameInputAnonymous.value = '';
        saleClientNameInputAnonymous.style.display = 'block';
        saleClientNameInputAnonymous.required = false;
        saleDiscountInput.value = '0.00';
        paymentMethodSelect.value = '';
        saleItemsContainer.innerHTML = '';
        discountGroup.style.display = 'none';
        paymentMethodGroup.style.display = 'none';
        saleDiscountInput.required = false;
        paymentMethodSelect.required = false;
        calculateSaleValues();
        fetchItems();
    });

    // Exportar CSV de Vendas
    exportSalesBtn.addEventListener('click', () => {
        if (salesHistory.length === 0) {
            alert('Não há dados de vendas para exportar.');
            return;
        }
        const salesData = salesHistory.map(sale => {
            const clientInfo = sale.clientId ? clients.find(c => c.id === sale.clientId) : null;
            return {
                ID_Venda: sale.id,
                Data: new Date(sale.date).toLocaleString('pt-BR'),
                Cliente_Nome: sale.clientName,
                Cliente_Telefone: clientInfo ? clientInfo.phone : 'N/A',
                Cliente_Endereco: clientInfo ? clientInfo.address : 'N/A',
                Itens_Vendidos: sale.items.map(item => `${item.name} (${item.quantity}un - R$${item.unitValue.toFixed(2)})`).join(' | '),
                Total_Pecas: sale.totalPieces,
                Desconto: sale.discount.toFixed(2),
                Metodo_Pagamento: sale.paymentMethod,
                Valor_Final_Venda: sale.totalValue.toFixed(2),
                Custo_Interno_Total: sale.totalInternalCost ? sale.totalInternalCost.toFixed(2) : '0.00',
                Lucro_Estimado_Venda: sale.totalInternalCost ? (sale.totalValue - sale.totalInternalCost).toFixed(2) : '0.00'
            };
        });
        exportToCsv('historico_vendas.csv', salesData);
        alert('Histórico de vendas exportado com sucesso!');
    });

    // --- Funcionalidade de Esconder/Mostrar Seções ---
    document.querySelectorAll('.toggle-section-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetSection = document.getElementById(targetId);
            
            // Encontra o contêiner de conteúdo dentro da seção
            const sectionContent = targetSection.querySelector('.section-content');

            if (sectionContent) { // Verifica se o contêiner de conteúdo existe
                sectionContent.classList.toggle('hidden'); // Alterna a classe 'hidden'
                
                if (sectionContent.classList.contains('hidden')) {
                    button.innerHTML = '<i class="fas fa-eye"></i> Mostrar';
                } else {
                    button.innerHTML = '<i class="fas fa-eye-slash"></i> Esconder';
                }
            }
        });
    });

    // Event listener para o botão Limpar Tudo
    clearHistoryBtn.addEventListener('click', clearAllHistory);


    // --- CARREGAMENTO INICIAL ---
    fetchItems();
    fetchClients();
    fetchSales();
    handleInitialAddItemInput(); // Chama para configurar o botão 'X' inicial
    // Esconde o input de cliente anônimo no carregamento inicial, caso não esteja já configurado
    if (saleClientSelect.value !== 'cliente-sem-cadastro') {
        saleClientNameInputAnonymous.style.display = 'block';
    }
    saleClientNameInputAnonymous.style.display = 'block';
});
