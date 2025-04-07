// Sistema de Toast para notificações
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');

    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Conteúdo do toast
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // Botão de fechar
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        removeToast(toast);
    });
    toast.appendChild(closeButton);

    // Adicionar ao container
    toastContainer.appendChild(toast);

    // Mostrar o toast (com delay para permitir a animação)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Configurar remoção automática
    setTimeout(() => {
        removeToast(toast);
    }, duration);

    return toast;
}

function removeToast(toast) {
    // Remover classe show para iniciar animação de saída
    toast.classList.remove('show');

    // Remover elemento após a animação
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Funções de conveniência para diferentes tipos de toast
function showSuccessToast(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function showErrorToast(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

function showInfoToast(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// Elementos da interface
const addBlockedDomainButton = document.getElementById('addBlockedDomain');
const addExceptionButton = document.getElementById('addException');
const exportConfigButton = document.getElementById('exportConfig');
const importConfigButton = document.getElementById('importConfig');
const importFileInput = document.getElementById('importFile');
const checkAllTabsButton = document.getElementById('checkAllTabs');

// Elementos dos modais de domínio
const domainModal = document.getElementById('domainModal');
const domainModalTitle = document.getElementById('domainModalTitle');
const domainForm = document.getElementById('domainForm');
const domainIndexInput = document.getElementById('domainIndex');
const domainNameInput = document.getElementById('domainName');
const domainTimeWindowsList = document.getElementById('domainTimeWindowsList');
const addDomainTimeWindowButton = document.getElementById('addDomainTimeWindow');
const saveDomainButton = document.getElementById('saveDomain');
const cancelDomainButton = document.getElementById('cancelDomain');

// Elementos dos modais de exceção
const exceptionModal = document.getElementById('exceptionModal');
const exceptionModalTitle = document.getElementById('exceptionModalTitle');
const exceptionForm = document.getElementById('exceptionForm');
const exceptionIndexInput = document.getElementById('exceptionIndex');
const exceptionUrlInput = document.getElementById('exceptionUrl');
const exceptionTimeWindowsList = document.getElementById('exceptionTimeWindowsList');
const addExceptionTimeWindowButton = document.getElementById('addExceptionTimeWindow');
const saveExceptionButton = document.getElementById('saveException');
const cancelExceptionButton = document.getElementById('cancelException');

// Elementos do modal de exclusão
const deleteModal = document.getElementById('deleteModal');
const deleteItemDisplay = document.getElementById('deleteItemDisplay');
const confirmDeleteButton = document.getElementById('confirmDelete');
const cancelDeleteButton = document.getElementById('cancelDelete');

// Variáveis para armazenar as instâncias do DataTable
let blockedDomainsTable;
let exceptionsTable;

// Variável para armazenar o tipo de item sendo excluído
let deleteItemType = '';

// Fechar modais ao clicar no X
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        domainModal.style.display = 'none';
        exceptionModal.style.display = 'none';
        deleteModal.style.display = 'none';
    });
});

// Fechar modais ao clicar fora deles
window.addEventListener('click', (event) => {
    if (event.target === domainModal) {
        domainModal.style.display = 'none';
    }
    if (event.target === exceptionModal) {
        exceptionModal.style.display = 'none';
    }
    if (event.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
});

// Formatar janelas de tempo para exibição
function formatTimeWindows(timeWindows) {
    if (!timeWindows || timeWindows.length === 0) {
        return "Sempre bloqueado";
    }

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    return timeWindows.map(window => {
        const days = window.days.map(d => dayNames[d]).join(", ");
        const start = Math.floor(window.startHour) + ":" +
            (window.startHour % 1 ? Math.round((window.startHour % 1) * 60).toString().padStart(2, '0') : "00");
        const end = Math.floor(window.endHour) + ":" +
            (window.endHour % 1 ? Math.round((window.endHour % 1) * 60).toString().padStart(2, '0') : "00");

        return `${days} das ${start} às ${end}`;
    }).join("<br>");
}

// Inicializar DataTable para domínios bloqueados
function initBlockedDomainsTable(domains) {
    // Destruir tabela existente se houver
    if (blockedDomainsTable) {
        blockedDomainsTable.destroy();
    }

    // Preparar dados para a tabela
    const tableData = domains.map((domain, index) => {
        return [
            domain.domain,
            formatTimeWindows(domain.timeWindows),
            `<div class="action-buttons">
                <button class="edit-domain-btn" data-index="${index}">Editar</button>
                <button class="delete-domain-btn delete" data-index="${index}">Excluir</button>
            </div>`
        ];
    });

    // Inicializar DataTable
    blockedDomainsTable = jQuery('#blockedDomainsTable').DataTable({
        data: tableData,
        columns: [
            { title: "Domínio" },
            { title: "Horários de Bloqueio" },
            { title: "Ações", width: "120px" }
        ],
        language: {
            "sEmptyTable": "Nenhum registro encontrado",
            "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
            "sInfoFiltered": "(Filtrados de _MAX_ registros)",
            "sInfoPostFix": "",
            "sInfoThousands": ".",
            "sLengthMenu": "_MENU_ resultados por página",
            "sLoadingRecords": "Carregando...",
            "sProcessing": "Processando...",
            "sZeroRecords": "Nenhum registro encontrado",
            "sSearch": "Pesquisar",
            "oPaginate": {
                "sNext": "Próximo",
                "sPrevious": "Anterior",
                "sFirst": "Primeiro",
                "sLast": "Último"
            },
            "oAria": {
                "sSortAscending": ": Ordenar colunas de forma ascendente",
                "sSortDescending": ": Ordenar colunas de forma descendente"
            }
        },
        responsive: true,
        order: [[0, 'asc']], // Ordenar por domínio
        columnDefs: [
            { targets: 1, orderable: false }, // Desabilitar ordenação na coluna de horários
            { targets: 2, orderable: false } // Desabilitar ordenação na coluna de ações
        ]
    });

    // Adicionar event listeners para os botões de ação
    jQuery('#blockedDomainsTable').on('click', '.edit-domain-btn', function () {
        const index = jQuery(this).data('index');
        openEditDomainModal(index);
    });

    jQuery('#blockedDomainsTable').on('click', '.delete-domain-btn', function () {
        const index = jQuery(this).data('index');
        openDeleteDomainModal(index);
    });
}

// Inicializar DataTable para exceções
function initExceptionsTable(exceptions) {
    // Destruir tabela existente se houver
    if (exceptionsTable) {
        exceptionsTable.destroy();
    }

    // Preparar dados para a tabela
    const tableData = exceptions.map((exception, index) => {
        return [
            exception.url,
            formatTimeWindows(exception.timeWindows),
            `<div class="action-buttons">
                <button class="edit-exception-btn" data-index="${index}">Editar</button>
                <button class="delete-exception-btn delete" data-index="${index}">Excluir</button>
            </div>`
        ];
    });

    // Inicializar DataTable
    exceptionsTable = jQuery('#exceptionsTable').DataTable({
        data: tableData,
        columns: [
            { title: "URL" },
            { title: "Horários Permitidos" },
            { title: "Ações", width: "120px" }
        ],
        language: {
            "sEmptyTable": "Nenhum registro encontrado",
            "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
            "sInfoFiltered": "(Filtrados de _MAX_ registros)",
            "sInfoPostFix": "",
            "sInfoThousands": ".",
            "sLengthMenu": "_MENU_ resultados por página",
            "sLoadingRecords": "Carregando...",
            "sProcessing": "Processando...",
            "sZeroRecords": "Nenhum registro encontrado",
            "sSearch": "Pesquisar",
            "oPaginate": {
                "sNext": "Próximo",
                "sPrevious": "Anterior",
                "sFirst": "Primeiro",
                "sLast": "Último"
            },
            "oAria": {
                "sSortAscending": ": Ordenar colunas de forma ascendente",
                "sSortDescending": ": Ordenar colunas de forma descendente"
            }
        },
        responsive: true,
        order: [[0, 'asc']], // Ordenar por URL
        columnDefs: [
            { targets: 1, orderable: false }, // Desabilitar ordenação na coluna de horários
            { targets: 2, orderable: false } // Desabilitar ordenação na coluna de ações
        ]
    });

    // Adicionar event listeners para os botões de ação
    jQuery('#exceptionsTable').on('click', '.edit-exception-btn', function () {
        const index = jQuery(this).data('index');
        openEditExceptionModal(index);
    });

    jQuery('#exceptionsTable').on('click', '.delete-exception-btn', function () {
        const index = jQuery(this).data('index');
        openDeleteExceptionModal(index);
    });
}

// Carregar configurações atuais
function loadCurrentConfig() {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            // Converter domínios simples para o novo formato se necessário
            const formattedDomains = config.blockedDomains.map(domain => {
                if (typeof domain === 'string') {
                    return { domain: domain };
                }
                return domain;
            });

            // Inicializar DataTables
            initBlockedDomainsTable(formattedDomains);
            initExceptionsTable(config.exceptionUrls || []);
        })
        .catch(error => {
            console.error("Erro ao carregar configurações:", error);
            showErrorToast("Erro ao carregar configurações: " + error);
        });
}

// Abrir modal para adicionar novo domínio bloqueado
addBlockedDomainButton.addEventListener('click', () => {
    domainModalTitle.textContent = 'Adicionar Domínio Bloqueado';
    domainIndexInput.value = -1;
    domainNameInput.value = '';
    domainTimeWindowsList.innerHTML = '';

    domainModal.style.display = 'block';
});

// Abrir modal para editar domínio bloqueado
function openEditDomainModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const domain = config.blockedDomains[index];

            domainModalTitle.textContent = 'Editar Domínio Bloqueado';
            domainIndexInput.value = index;
            domainNameInput.value = domain.domain;

            domainTimeWindowsList.innerHTML = '';

            // Adicionar janelas de tempo existentes
            if (domain.timeWindows && domain.timeWindows.length > 0) {
                domain.timeWindows.forEach(window => {
                    addTimeWindow(domainTimeWindowsList, window);
                });
            }

            domainModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar domínio para edição:", error);
            showErrorToast("Erro ao carregar domínio para edição: " + error);
        });
}

// Abrir modal para excluir domínio bloqueado
function openDeleteDomainModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const domain = config.blockedDomains[index];
            deleteItemDisplay.textContent = domain.domain;

            // Armazenar o índice e tipo no botão de confirmação
            confirmDeleteButton.dataset.index = index;
            deleteItemType = 'domain';

            deleteModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar domínio para exclusão:", error);
            showErrorToast("Erro ao carregar domínio para exclusão: " + error);
        });
}

// Abrir modal para adicionar nova exceção
addExceptionButton.addEventListener('click', () => {
    exceptionModalTitle.textContent = 'Adicionar Exceção';
    exceptionIndexInput.value = -1;
    exceptionUrlInput.value = '';
    exceptionTimeWindowsList.innerHTML = '';
    addTimeWindow(exceptionTimeWindowsList); // Adiciona uma janela de tempo vazia

    exceptionModal.style.display = 'block';
});

// Abrir modal para editar exceção
function openEditExceptionModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exception = config.exceptionUrls[index];

            exceptionModalTitle.textContent = 'Editar Exceção';
            exceptionIndexInput.value = index;
            exceptionUrlInput.value = exception.url;

            exceptionTimeWindowsList.innerHTML = '';

            // Adicionar janelas de tempo existentes
            exception.timeWindows.forEach(window => {
                addTimeWindow(exceptionTimeWindowsList, window);
            });

            exceptionModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar exceção para edição:", error);
            showErrorToast("Erro ao carregar exceção para edição: " + error);
        });
}

// Abrir modal de confirmação para excluir exceção
function openDeleteExceptionModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exception = config.exceptionUrls[index];
            deleteItemDisplay.textContent = exception.url;

            // Armazenar o índice e tipo no botão de confirmação
            confirmDeleteButton.dataset.index = index;
            deleteItemType = 'exception';

            deleteModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar exceção para exclusão:", error);
            showErrorToast("Erro ao carregar exceção para exclusão: " + error);
        });
}

// Adicionar uma nova janela de tempo ao formulário
function addTimeWindow(container, timeWindow = null) {
    const windowItem = document.createElement('div');
    windowItem.className = 'time-window-item';

    // Checkboxes para os dias da semana
    const daysDiv = document.createElement('div');
    daysDiv.className = 'days-selection';

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    dayNames.forEach((dayName, dayIndex) => {
        const dayLabel = document.createElement('label');
        dayLabel.className = 'day-checkbox';

        const dayCheckbox = document.createElement('input');
        dayCheckbox.type = 'checkbox';
        dayCheckbox.name = `day-${dayIndex}`;
        dayCheckbox.value = dayIndex;

        // Marcar checkbox se este dia estiver na janela de tempo
        if (timeWindow && timeWindow.days.includes(dayIndex)) {
            dayCheckbox.checked = true;
        }

        dayLabel.appendChild(dayCheckbox);
        dayLabel.appendChild(document.createTextNode(` ${dayName}`));

        daysDiv.appendChild(dayLabel);
    });

    windowItem.appendChild(daysDiv);

    // Inputs para horário de início e fim
    const timeInputsDiv = document.createElement('div');
    timeInputsDiv.className = 'time-inputs';

    const startLabel = document.createElement('label');
    startLabel.textContent = 'Das:';

    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.min = '0';
    startInput.max = '23.99';
    startInput.step = '0.01';
    startInput.name = 'startHour';
    startInput.value = timeWindow ? timeWindow.startHour : '8';

    const endLabel = document.createElement('label');
    endLabel.textContent = 'Às:';

    const endInput = document.createElement('input');
    endInput.type = 'number';
    endInput.min = '0';
    endInput.max = '23.99';
    endInput.step = '0.01';
    endInput.name = 'endHour';
    endInput.value = timeWindow ? timeWindow.endHour : '17';

    timeInputsDiv.appendChild(startLabel);
    timeInputsDiv.appendChild(startInput);
    timeInputsDiv.appendChild(endLabel);
    timeInputsDiv.appendChild(endInput);

    windowItem.appendChild(timeInputsDiv);

    // Botão para remover esta janela de tempo
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remover';
    removeButton.className = 'delete';
    removeButton.onclick = () => {
        windowItem.remove();
    };

    windowItem.appendChild(removeButton);

    container.appendChild(windowItem);
}

// Coletar janelas de tempo de um container
function collectTimeWindows(container) {
    const timeWindows = [];
    const timeWindowItems = container.querySelectorAll('.time-window-item');

    for (const item of timeWindowItems) {
        const days = [];
        const dayCheckboxes = item.querySelectorAll('input[type="checkbox"]:checked');

        dayCheckboxes.forEach(checkbox => {
            days.push(parseInt(checkbox.value));
        });

        if (days.length === 0) {
            throw new Error("Cada janela de tempo deve ter pelo menos um dia selecionado.");
        }

        const startHour = parseFloat(item.querySelector('input[name="startHour"]').value);
        const endHour = parseFloat(item.querySelector('input[name="endHour"]').value);

        if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
            throw new Error("Horários inválidos. O horário de início deve ser menor que o horário de fim.");
        }

        timeWindows.push({
            days,
            startHour,
            endHour
        });
    }

    return timeWindows;
}

// Adicionar nova janela de tempo ao clicar nos botões
addDomainTimeWindowButton.addEventListener('click', () => {
    addTimeWindow(domainTimeWindowsList);
});

addExceptionTimeWindowButton.addEventListener('click', () => {
    addTimeWindow(exceptionTimeWindowsList);
});

// Cancelar adição/edição de domínio
cancelDomainButton.addEventListener('click', () => {
    domainModal.style.display = 'none';
});

// Salvar domínio bloqueado
saveDomainButton.addEventListener('click', () => {
    const domain = domainNameInput.value.trim();

    if (!domain) {
        showErrorToast("Por favor, informe o domínio a ser bloqueado.");
        return;
    }

    // Coletar janelas de tempo (se houver)
    let timeWindows = [];
    try {
        if (domainTimeWindowsList.querySelectorAll('.time-window-item').length > 0) {
            timeWindows = collectTimeWindows(domainTimeWindowsList);
        }
    } catch (error) {
        showErrorToast(error.message);
        return;
    }

    // Obter o índice do domínio que está sendo editado
    const currentIndex = parseInt(domainIndexInput.value);

    // Obter configuração atual
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const domains = config.blockedDomains || [];

            const newDomain = {
                domain,
                timeWindows
            };

            if (currentIndex >= 0) {
                // Editar domínio existente
                domains[currentIndex] = newDomain;
            } else {
                // Adicionar novo domínio
                domains.push(newDomain);
            }

            return browser.runtime.sendMessage({
                action: "updateConfig",
                blockedDomains: domains
            });
        })
        .then(response => {
            if (response.success) {
                domainModal.style.display = 'none';
                loadCurrentConfig();
                showSuccessToast(currentIndex >= 0 ? "Domínio atualizado com sucesso!" : "Domínio adicionado com sucesso!");
            } else {
                showErrorToast("Erro ao salvar domínio: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao salvar domínio:", error);
            showErrorToast("Erro ao salvar domínio: " + error);
        });
});

// Cancelar adição/edição de exceção
cancelExceptionButton.addEventListener('click', () => {
    exceptionModal.style.display = 'none';
});

// Salvar exceção
saveExceptionButton.addEventListener('click', () => {
    const url = exceptionUrlInput.value.trim();

    if (!url) {
        showErrorToast("Por favor, informe a URL da exceção.");
        return;
    }

    // Coletar janelas de tempo
    let timeWindows = [];
    try {
        timeWindows = collectTimeWindows(exceptionTimeWindowsList);

        if (timeWindows.length === 0) {
            showErrorToast("Adicione pelo menos uma janela de tempo.");
            return;
        }
    } catch (error) {
        showErrorToast(error.message);
        return;
    }

    // Obter o índice da exceção que está sendo editada
    const currentIndex = parseInt(exceptionIndexInput.value);

    // Obter configuração atual
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exceptions = config.exceptionUrls || [];

            const newException = {
                url,
                timeWindows
            };

            if (currentIndex >= 0) {
                // Editar exceção existente
                exceptions[currentIndex] = newException;
            } else {
                // Adicionar nova exceção
                exceptions.push(newException);
            }

            return browser.runtime.sendMessage({
                action: "updateConfig",
                exceptionUrls: exceptions
            });
        })
        .then(response => {
            if (response.success) {
                exceptionModal.style.display = 'none';
                loadCurrentConfig();
                showSuccessToast(currentIndex >= 0 ? "Exceção atualizada com sucesso!" : "Exceção adicionada com sucesso!");
            } else {
                showErrorToast("Erro ao salvar exceção: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao salvar exceção:", error);
            showErrorToast("Erro ao salvar exceção: " + error);
        });
});

// Cancelar exclusão
cancelDeleteButton.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

// Confirmar exclusão
confirmDeleteButton.addEventListener('click', () => {
    const index = parseInt(confirmDeleteButton.dataset.index);

    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            if (deleteItemType === 'domain') {
                const domains = config.blockedDomains || [];
                domains.splice(index, 1);

                return browser.runtime.sendMessage({
                    action: "updateConfig",
                    blockedDomains: domains
                });
            } else if (deleteItemType === 'exception') {
                const exceptions = config.exceptionUrls || [];
                exceptions.splice(index, 1);

                return browser.runtime.sendMessage({
                    action: "updateConfig",
                    exceptionUrls: exceptions
                });
            }
        })
        .then(response => {
            if (response.success) {
                deleteModal.style.display = 'none';
                loadCurrentConfig();
                showSuccessToast(deleteItemType === 'domain' ?
                    "Domínio excluído com sucesso!" :
                    "Exceção excluída com sucesso!");
            } else {
                showErrorToast("Erro ao excluir item: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao excluir item:", error);
            showErrorToast("Erro ao excluir item: " + error);
        });
});

// Exportar configurações
exportConfigButton.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: "exportConfig" })
        .then(response => {
            const jsonData = response.jsonData;
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'bloqueio-config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error("Erro ao exportar configurações:", error);
            showErrorToast("Erro ao exportar configurações: " + error);
        });
});

// Importar configurações
importConfigButton.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const jsonData = e.target.result;

        browser.runtime.sendMessage({
            action: "importConfig",
            jsonData: jsonData
        })
            .then(response => {
                if (response.success) {
                    loadCurrentConfig();
                    showSuccessToast("Configurações importadas com sucesso!");
                } else {
                    showErrorToast("Erro ao importar configurações: " + response.error);
                }
            })
            .catch(error => {
                console.error("Erro ao importar configurações:", error);
                showErrorToast("Erro ao importar configurações: " + error);
            });
    };
    reader.readAsText(file);
});

// Verificar todas as abas abertas
checkAllTabsButton.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: "checkAllTabs" })
        .then(response => {
            if (response.success) {
                showInfoToast("Verificação de abas concluída");
            }
        })
        .catch(error => {
            console.error("Erro ao verificar abas:", error);
            showErrorToast("Erro ao verificar abas: " + error);
        });
});

// Carregar configurações ao abrir a página
document.addEventListener('DOMContentLoaded', loadCurrentConfig);