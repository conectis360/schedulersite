// Lista de domínios a serem bloqueados
const blockedDomains = [
    "exemploruim.com",
    "siteproibido.org",
    "distracao.net",
    "youtube.com"
    // Adicione mais domínios aqui
];

// Estrutura para URLs de exceção com janelas de tempo permitidas
// Formato: { url: string, timeWindows: Array<{days: number[], startHour: number, endHour: number}> }
// days: 0 = domingo, 1 = segunda, ..., 6 = sábado
const exceptionUrls = [
    {
        url: "https://www.youtube.com/watch?v=frIxIZyko80",
        timeWindows: [
            { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 }, // Dias úteis, 8h às 17h
            { days: [0, 6], startHour: 10, endHour: 18 }          // Fins de semana, 10h às 14h
        ]
    },
    {
        url: "https://siteproibido.org/conteudo-educacional",
        timeWindows: [
            { days: [1, 3, 5], startHour: 13, endHour: 18 }       // Segunda, quarta e sexta, 13h às 18h
        ]
    }
    // Adicione mais exceções aqui
];

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

// Função para verificar se o horário atual está dentro de uma janela de tempo permitida
function isWithinAllowedTime(timeWindows) {
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
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    return timeWindows.map(window => {
        const days = window.days.map(d => dayNames[d]).join(", ");
        const start = Math.floor(window.startHour) + ":" +
            (window.startHour % 1 ? (window.startHour % 1) * 60 : "00");
        const end = Math.floor(window.endHour) + ":" +
            (window.endHour % 1 ? (window.endHour % 1) * 60 : "00");

        return `${days} das ${start} às ${end}`;
    }).join("; ");
}

// Função que será chamada antes de cada requisição de navegação
function blockRequest(requestDetails) {
    console.log("Interceptando:", requestDetails.url);

    const url = requestDetails.url;
    const domain = extractDomain(url);

    // Verifica se o domínio está na lista de domínios bloqueados
    const isDomainBlocked = blockedDomains.some(blockedDomain =>
        domain === blockedDomain || domain.endsWith("." + blockedDomain));

    if (!isDomainBlocked) {
        console.log("Permitido (domínio não bloqueado):", url);
        return; // Permite acesso
    }

    // Verifica se a URL está na lista de exceções
    const exception = exceptionUrls.find(ex => ex.url === url);

    if (!exception) {
        console.log("BLOQUEADO (domínio bloqueado):", url);
        // Redireciona para página de bloqueio com mensagem
        return {
            redirectUrl: browser.runtime.getURL("blocked.html") +
                "?message=" + encodeURIComponent("Este domínio está bloqueado.")
        };
    }

    // Verifica se está dentro do horário permitido para esta URL de exceção
    if (isWithinAllowedTime(exception.timeWindows)) {
        console.log("Permitido (exceção dentro do horário permitido):", url);
        return; // Permite acesso
    } else {
        console.log("BLOQUEADO (fora do horário permitido):", url);
        // Redireciona para página de bloqueio com informações sobre horários permitidos
        const allowedTimes = formatTimeWindows(exception.timeWindows);
        return {
            redirectUrl: browser.runtime.getURL("blocked.html") +
                "?message=" + encodeURIComponent(
                    "Esta URL só é permitida nos seguintes horários: " + allowedTimes
                )
        };
    }
}

// Adiciona o listener para o evento onBeforeRequest
browser.webRequest.onBeforeRequest.addListener(
    blockRequest,
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]
    },
    ["blocking"]
);

console.log("Extensão de Controle de Acesso Granular Ativa!");