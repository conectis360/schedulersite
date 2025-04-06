// Elementos da interface
const blockedDomainsTextarea = document.getElementById('blockedDomains');
const saveBlockedDomainsButton = document.getElementById('saveBlockedDomains');
const exceptionsListDiv = document.getElementById('exceptionsList');
const addExceptionButton = document.getElementById('addException');
const exportConfigButton = document.getElementById('exportConfig');
const importConfigButton = document.getElementById('importConfig');
const importFileInput = document.getElementById('importFile');

// Carregar configurações atuais
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
            alert("Erro ao carregar configurações: " + error);
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
        editButton.onclick = () => editException(index);
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.onclick = () => deleteException(index);
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
                alert("Domínios bloqueados salvos com sucesso!");
            } else {
                alert("Erro ao salvar domínios: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao salvar domínios:", error);
            alert("Erro ao salvar domínios: " + error);
        });
});

// Adicionar nova exceção
addExceptionButton.addEventListener('click', () => {
    const url = prompt("Digite a URL completa da exceção:");
    if (!url) return;

    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exceptions = config.exceptionUrls || [];
            exceptions.push({
                url: url,
                timeWindows: [
                    { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 }
                ]
            });

            return browser.runtime.sendMessage({
                action: "updateConfig",
                exceptionUrls: exceptions
            });
        })
        .then(response => {
            if (response.success) {
                loadCurrentConfig();
                alert("Exceção adicionada com sucesso!");
            } else {
                alert("Erro ao adicionar exceção: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao adicionar exceção:", error);
            alert("Erro ao adicionar exceção: " + error);
        });
});

// Editar exceção (simplificado - em uma implementação real, você criaria um modal ou formulário)
function editException(index) {
    browser.runtime.sendMessage({ action: "getConfig" })
        .then(config => {
            const exceptions = config.exceptionUrls || [];
            const exception = exceptions[index];

            const newUrl = prompt("URL da exceção:", exception.url);
            if (!newUrl) return;

            exception.url = newUrl;

            return browser.runtime.sendMessage({
                action: "updateConfig",
                exceptionUrls: exceptions
            });
        })
        .then(response => {
            if (response && response.success) {
                loadCurrentConfig();
                alert("Exceção atualizada com sucesso!");
            } else if (response) {
                alert("Erro ao atualizar exceção: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao editar exceção:", error);
            alert("Erro ao editar exceção: " + error);
        });
}

// Excluir exceção
function deleteException(index) {
    if (!confirm("Tem certeza que deseja excluir esta exceção?")) return;

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
                loadCurrentConfig();
                alert("Exceção excluída com sucesso!");
            } else {
                alert("Erro ao excluir exceção: " + response.error);
            }
        })
        .catch(error => {
            console.error("Erro ao excluir exceção:", error);
            alert("Erro ao excluir exceção: " + error);
        });
}

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
                    alert("Configurações importadas com sucesso!");
                } else {
                    alert("Erro ao importar configurações: " + response.error);
                }
            })
            .catch(error => {
                console.error("Erro ao importar configurações:", error);
                alert("Erro ao importar configurações: " + error);
            });
    };
    reader.readAsText(file);
});

// Carregar configurações ao abrir a página
document.addEventListener('DOMContentLoaded', loadCurrentConfig);