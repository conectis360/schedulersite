// Lista de sites (ou partes de URLs) a serem bloqueados
// Use formatos que a função includes() possa detectar.
// Ex: "exemplo.com" bloqueará exemplo.com, www.exemplo.com, sub.exemplo.com
const blockedSites = [
    "exemploruim.com",
    "siteproibido.org",
    "distracao.net"
    // Adicione mais sites/padrões aqui
];

// Função que será chamada antes de cada requisição de navegação
function blockRequest(requestDetails) {
    console.log("Interceptando:", requestDetails.url); // Log para debug

    // Verifica se a URL da requisição contém algum dos sites bloqueados
    const isBlocked = blockedSites.some(site => requestDetails.url.includes(site));

    if (isBlocked) {
        console.log("BLOQUEADO:", requestDetails.url);
        // Retorna um objeto indicando que a requisição deve ser cancelada
        return { cancel: true };
    }

    // Se não estiver na lista, permite a requisição continuar (não retorna nada)
    console.log("Permitido:", requestDetails.url);
}

// Adiciona o listener para o evento onBeforeRequest
browser.webRequest.onBeforeRequest.addListener(
    blockRequest, // A função a ser executada
    {
        urls: ["<all_urls>"], // Aplicar a todas as URLs
        types: ["main_frame"] // Aplicar apenas à navegação principal da aba (não a imagens, scripts, etc.)
    },
    ["blocking"] // Indica que a função pode bloquear (cancelar) a requisição
);

console.log("Extensão Bloqueadora Ativa!");