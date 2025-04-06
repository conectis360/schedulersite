// Elementos da interface
const blockedDomainsTextarea = document.getElementById('blockedDomains');
const saveBlockedDomainsButton = document.getElementById('saveBlockedDomains');
const exceptionsListDiv = document.getElementById('exceptionsList');
const addExceptionButton = document.getElementById('addException');
const exportConfigButton = document.getElementById('exportConfig');
const importConfigButton = document.getElementById('importConfig');
const importFileInput = document.getElementById('importFile');

// Elementos dos modais
const exceptionModal = document.getElementById('exceptionModal');
const modalTitle = document.getElementById('modalTitle');
const exceptionForm = document.getElementById('exceptionForm');
const exceptionIndexInput = document.getElementById('exceptionIndex');
const exceptionUrlInput = document.getElementById('exceptionUrl');
const timeWindowsList = document.getElementById('timeWindowsList');
const addTimeWindowButton = document.getElementById('addTimeWindow');
const saveExceptionButton = document.getElementById('saveException');
const cancelExceptionButton = document.getElementById('cancelException');

const deleteModal = document.getElementById('deleteModal');
const deleteUrlDisplay = document.getElementById('deleteUrlDisplay');
const confirmDeleteButton = document.getElementById('confirmDelete');
const cancelDeleteButton = document.getElementById('cancelDelete');

// Fechar modais ao clicar no X
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        exceptionModal.style.display = 'none';
        deleteModal.style.display = 'none';
    });
});

// Fechar modais ao clicar fora deles
window.addEventListener('click', (event) => {
    if (event.target === exceptionModal) {
        exceptionModal.style.display = 'none';
    }
    if (event.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
});

function loadCurrentConfig() {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            // Preencher domínios bloqueados  
            blockedDomainsTextarea.value = config.blockedDomains.join('\n');

            // Preencher exceções  
            renderExceptionsList(config.exceptionUrls);
        })
        .catch(error => {
            console.error("Erro ao carregar configurações:", error);
            showErrorToast("Erro ao carregar configurações: " + error);
        });
}

// Renderizar lista de exceções
function renderExceptionsList(exceptions) {
    exceptionsListDiv.innerHTML = '';

    if (exceptions.length === 0) {
        exceptionsListDiv.innerHTML = '<p>Nenhuma exceção configurada.</p>';
        return;
    }

    exceptions.forEach((exception, index) => {
        const exceptionDiv = document.createElement('div');
        exceptionDiv.className = 'exception-item';

        // URL da exceção
        const urlDiv = document.createElement('div');
        urlDiv.innerHTML = `<strong>URL:</strong> ${exception.url}`;
        exceptionDiv.appendChild(urlDiv);

        // Janelas de tempo
        const timeWindowsDiv = document.createElement('div');
        timeWindowsDiv.innerHTML = '<strong>Horários permitidos:</strong>';
        exceptionDiv.appendChild(timeWindowsDiv);

        exception.timeWindows.forEach((window, windowIndex) => {
            const windowDiv = document.createElement('div');
            windowDiv.className = 'time-window';

            const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
            const days = window.days.map(d => dayNames[d]).join(", ");

            windowDiv.textContent = `${days} das ${window.startHour}h às ${window.endHour}h`;
            timeWindowsDiv.appendChild(windowDiv);
        });

        // Botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';

        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.onclick = () => openEditExceptionModal(index);
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.className = 'delete';
        deleteButton.onclick = () => openDeleteModal(index);
        actionsDiv.appendChild(deleteButton);

        exceptionDiv.appendChild(actionsDiv);
        exceptionsListDiv.appendChild(exceptionDiv);
    });
}

// Salvar domínios bloqueados  
saveBlockedDomainsButton.addEventListener('click', () => {
    const domains = blockedDomainsTextarea.value
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

    browser.runtime.sendMessage({
        action: "updateConfig",
        blockedDomains: domains
    })
        .then(response => {
            if (response.success) {
                showSuccessToast("Domínios bloqueados salvos com sucesso!");
            } else {
                showErrorToast("Erro ao salvar domínios: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao salvar domínios:", error);
            showErrorToast("Erro ao salvar domínios: " + error);
        });
});

// Abrir modal para adicionar nova exceção
addExceptionButton.addEventListener('click', () => {
    modalTitle.textContent = 'Adicionar Exceção';
    exceptionIndexInput.value = -1;
    exceptionUrlInput.value = '';
    timeWindowsList.innerHTML = '';
    addTimeWindow(); // Adiciona uma janela de tempo vazia

    exceptionModal.style.display = 'block';
});

// Abrir modal para editar exceção
function openEditExceptionModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exception = config.exceptionUrls[index];

            modalTitle.textContent = 'Editar Exceção';
            exceptionIndexInput.value = index;
            exceptionUrlInput.value = exception.url;

            timeWindowsList.innerHTML = '';

            // Adicionar janelas de tempo existentes
            exception.timeWindows.forEach(window => {
                addTimeWindow(window);
            });

            exceptionModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar exceção para edição:", error);
            alert("Erro ao carregar exceção para edição: " + error);
        });
}

// Abrir modal de confirmação para excluir exceção
function openDeleteModal(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exception = config.exceptionUrls[index];
            deleteUrlDisplay.textContent = exception.url;

            // Armazenar o índice no botão de confirmação
            confirmDeleteButton.dataset.index = index;

            deleteModal.style.display = 'block';
        })
        .catch(error => {
            console.error("Erro ao carregar exceção para exclusão:", error);
            alert("Erro ao carregar exceção para exclusão: " + error);
        });
}

// Adicionar uma nova janela de tempo ao formulário
function addTimeWindow(timeWindow = null) {
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

    timeWindowsList.appendChild(windowItem);
}

// Adicionar nova janela de tempo ao clicar no botão
addTimeWindowButton.addEventListener('click', () => {
    addTimeWindow();
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
    const timeWindows = [];
    const timeWindowItems = timeWindowsList.querySelectorAll('.time-window-item');

    for (const item of timeWindowItems) {
        const days = [];
        const dayCheckboxes = item.querySelectorAll('input[type="checkbox"]:checked');

        dayCheckboxes.forEach(checkbox => {
            days.push(parseInt(checkbox.value));
        });

        if (days.length === 0) {
            showErrorToast("Cada janela de tempo deve ter pelo menos um dia selecionado.");
            return;
        }

        const startHour = parseFloat(item.querySelector('input[name="startHour"]').value);
        const endHour = parseFloat(item.querySelector('input[name="endHour"]').value);

        if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
            showErrorToast("Horários inválidos. O horário de início deve ser menor que o horário de fim.");
            return;
        }

        timeWindows.push({
            days,
            startHour,
            endHour
        });
    }

    if (timeWindows.length === 0) {
        showErrorToast("Adicione pelo menos uma janela de tempo.");
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
            const exceptions = config.exceptionUrls || [];
            exceptions.splice(index, 1);

            return browser.runtime.sendMessage({
                action: "updateConfig",
                exceptionUrls: exceptions
            });
        })
        .then(response => {
            if (response.success) {
                deleteModal.style.display = 'none';
                loadCurrentConfig();
                showSuccessToast("Exceção excluída com sucesso!");
            } else {
                showErrorToast("Erro ao excluir exceção: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao excluir exceção:", error);
            showErrorToast("Erro ao excluir exceção: " + error);
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
            alert("Erro ao exportar configurações: " + error);
        });
});

// Importar configurações
importConfigButton.addEventListener('click', () => {
    importFileInput.click();
});

// Importar configurações  
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

// Carregar configurações ao abrir a página
document.addEventListener('DOMContentLoaded', loadCurrentConfig);