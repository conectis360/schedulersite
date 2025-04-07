// Variáveis para armazenar as configurações
let blockedDomains = [];
let exceptionUrls = [];

// Função para carregar as configurações do armazenamento
function loadConfiguration() {
    return browser.storage.local.get(['blockedDomains', 'exceptionUrls'])
        .then(result => {
            blockedDomains = result.blockedDomains || [];
            exceptionUrls = result.exceptionUrls || [];
            console.log("Configuração carregada:", { blockedDomains, exceptionUrls });
        })
        .catch(error => {
            console.error("Erro ao carregar configurações:", error);
        });
}

// Função para salvar as configurações no armazenamento
function saveConfiguration() {
    return browser.storage.local.set({
        blockedDomains,
        exceptionUrls
    }).then(() => {
        console.log("Configuração salva com sucesso");
        // Verificar todas as abas abertas após salvar configurações
        checkAllOpenTabs();
    }).catch(error => {
        console.error("Erro ao salvar configurações:", error);
    });
}

// Função para importar configurações de um arquivo JSON
function importConfigFromJson(jsonData) {
    try {
        const config = JSON.parse(jsonData);

        if (config.blockedDomains) {
            blockedDomains = config.blockedDomains;
        }

        if (config.exceptionUrls) {
            exceptionUrls = config.exceptionUrls;
        }

        return saveConfiguration();
    } catch (error) {
        console.error("Erro ao importar configuração:", error);
        return Promise.reject(error);
    }
}

// Função para exportar configurações para JSON
function exportConfigToJson() {
    const config = {
        blockedDomains,
        exceptionUrls
    };

    return JSON.stringify(config, null, 2);
}

// Função para extrair o domínio de uma URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        console.error("URL inválida:", url);
        return url;
    }
}

// Função para verificar se o horário atual está dentro de uma janela de tempo
function isWithinTimeWindow(timeWindows) {
    if (!timeWindows || timeWindows.length === 0) {
        return true; // Se não houver janelas de tempo, está sempre bloqueado
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (domingo-sábado)
    const currentHour = now.getHours() + (now.getMinutes() / 60); // Hora atual com fração

    return timeWindows.some(window => {
        return window.days.includes(currentDay) &&
            currentHour >= window.startHour &&
            currentHour < window.endHour;
    });
}

// Função para formatar as janelas de tempo para exibição ao usuário
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

// Função para verificar se uma URL deve ser bloqueada
function shouldBlockUrl(url) {
    console.log("Verificando URL:", url);

    const domain = extractDomain(url);

    // Verifica se o domínio está na lista de domínios bloqueados
    const blockedDomain = blockedDomains.find(bd =>
        domain === bd.domain || domain.endsWith("." + bd.domain));

    if (!blockedDomain) {
        console.log("Permitido (domínio não bloqueado):", url);
        return { blocked: false };
    }

    // Verifica se está dentro do horário de bloqueio para este domínio
    if (blockedDomain.timeWindows && blockedDomain.timeWindows.length > 0) {
        if (!isWithinTimeWindow(blockedDomain.timeWindows)) {
            console.log("Permitido (fora do horário de bloqueio):", url);
            return { blocked: false };
        }
    }

    // Verifica se a URL está na lista de exceções
    const exception = exceptionUrls.find(ex => ex.url === url);

    if (!exception) {
        console.log("BLOQUEADO (domínio bloqueado):", url);
        return {
            blocked: true,
            reason: "domain",
            message: "Este domínio está bloqueado."
        };
    }

    // Verifica se está dentro do horário permitido para esta URL de exceção
    if (isWithinTimeWindow(exception.timeWindows)) {
        console.log("Permitido (exceção dentro do horário permitido):", url);
        return { blocked: false };
    } else {
        console.log("BLOQUEADO (fora do horário permitido):", url);
        const allowedTimes = formatTimeWindows(exception.timeWindows);
        return {
            blocked: true,
            reason: "time",
            message: "Esta URL só é permitida nos seguintes horários: " + allowedTimes
        };
    }
}

// Função que será chamada antes de cada requisição de navegação
function blockRequest(requestDetails) {
    const result = shouldBlockUrl(requestDetails.url);

    if (result.blocked) {
        // Redireciona para página de bloqueio com mensagem
        return {
            redirectUrl: browser.runtime.getURL("blocked.html") +
                "?message=" + encodeURIComponent(result.message) +
                "&url=" + encodeURIComponent(requestDetails.url)
        };
    }

    // Se não estiver bloqueado, permite a requisição continuar
    return {};
}

// Função para verificar e bloquear uma aba específica
function checkAndBlockTab(tab) {
    if (!tab.url || tab.url.startsWith("about:") || tab.url.startsWith("moz-extension:") || tab.url.startsWith("chrome-extension:")) {
        return; // Ignora abas internas do navegador
    }

    const result = shouldBlockUrl(tab.url);

    if (result.blocked) {
        // Redireciona a aba para a página de bloqueio
        const blockPageUrl = browser.runtime.getURL("blocked.html") +
            "?message=" + encodeURIComponent(result.message) +
            "&url=" + encodeURIComponent(tab.url);

        browser.tabs.update(tab.id, { url: blockPageUrl });
    }
}

// Função para verificar todas as abas abertas
function checkAllOpenTabs() {
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            checkAndBlockTab(tab);
        });
    });
}

// Adiciona o listener para o evento onBeforeRequest
function setupWebRequestListener() {
    browser.webRequest.onBeforeRequest.addListener(
        blockRequest,
        {
            urls: ["<all_urls>"],
            types: ["main_frame"]
        },
        ["blocking"]
    );
    console.log("Listener de bloqueio configurado");
}

// Adiciona listener para mudanças de URL em abas (para SPAs)
function setupTabUpdateListener() {
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        // Verifica se a URL da aba mudou
        if (changeInfo.url) {
            checkAndBlockTab(tab);
        }
    });
    console.log("Listener de atualização de abas configurado");
}

// Configurar mensagens para comunicação com a interface do usuário
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getConfig") {
        sendResponse({
            blockedDomains,
            exceptionUrls
        });
    }
    else if (message.action === "updateConfig") {
        if (message.blockedDomains) {
            blockedDomains = message.blockedDomains;
        }
        if (message.exceptionUrls) {
            exceptionUrls = message.exceptionUrls;
        }
        saveConfiguration().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.toString() });
        });
        return true; // Indica que a resposta será enviada de forma assíncrona
    }
    else if (message.action === "importConfig") {
        importConfigFromJson(message.jsonData).then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.toString() });
        });
        return true; // Indica que a resposta será enviada de forma assíncrona
    }
    else if (message.action === "exportConfig") {
        sendResponse({ jsonData: exportConfigToJson() });
    }
    else if (message.action === "checkAllTabs") {
        checkAllOpenTabs();
        sendResponse({ success: true });
    }
    else if (message.action === "checkUrl") {
        const result = shouldBlockUrl(message.url);
        sendResponse(result);
    }
});

// Inicialização
function init() {
    loadConfiguration().then(() => {
        setupWebRequestListener();
        setupTabUpdateListener();

        // Verificar todas as abas abertas na inicialização
        checkAllOpenTabs();

        console.log("Extensão de Controle de Acesso Granular Ativa!");
    });
}

// Adicionar listener para quando a extensão é instalada ou atualizada
browser.runtime.onInstalled.addListener(() => {
    console.log("Extensão instalada ou atualizada");
    init();
});

// Iniciar a extensão
init();