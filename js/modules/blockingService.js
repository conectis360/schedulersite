/**
 * Módulo para gerenciar a lógica de bloqueio de URLs
 */
import StorageModule from './storage.js';
import TimeUtils from './timeUtils.js';
import UrlUtils from './urlUtils.js';

const BlockingService = (() => {
    /**
     * Verifica se uma URL deve ser bloqueada
     * @param {string} url - URL a ser verificada
     * @returns {Object} Objeto com informações sobre o bloqueio
     */
    const shouldBlockUrl = (url) => {
        console.log("Verificando URL:", url);

        const domain = UrlUtils.extractDomain(url);
        const config = StorageModule.getConfig();

        // Verifica se o domínio está na lista de domínios bloqueados
        const blockedDomain = config.blockedDomains.find(bd =>
            typeof bd === 'string'
                ? UrlUtils.domainMatches(domain, bd)
                : UrlUtils.domainMatches(domain, bd.domain)
        );

        if (!blockedDomain) {
            console.log("Permitido (domínio não bloqueado):", url);
            return { blocked: false };
        }

        // Verifica se está dentro do horário de bloqueio para este domínio
        if (typeof blockedDomain !== 'string' && blockedDomain.timeWindows && blockedDomain.timeWindows.length > 0) {
            if (!TimeUtils.isWithinTimeWindow(blockedDomain.timeWindows)) {
                console.log("Permitido (fora do horário de bloqueio):", url);
                return { blocked: false };
            }
        }

        // Verifica se a URL está na lista de exceções
        const exception = config.exceptionUrls.find(ex => ex.url === url);

        if (!exception) {
            console.log("BLOQUEADO (domínio bloqueado):", url);
            return {
                blocked: true,
                reason: "domain",
                message: "Este domínio está bloqueado."
            };
        }

        // Verifica se está dentro do horário permitido para esta URL de exceção
        if (TimeUtils.isWithinTimeWindow(exception.timeWindows)) {
            console.log("Permitido (exceção dentro do horário permitido):", url);
            return { blocked: false };
        } else {
            console.log("BLOQUEADO (fora do horário permitido):", url);
            const allowedTimes = TimeUtils.formatTimeWindows(exception.timeWindows);
            return {
                blocked: true,
                reason: "time",
                message: "Esta URL só é permitida nos seguintes horários: " + allowedTimes
            };
        }
    };

    /**
     * Manipula requisições de navegação para bloquear URLs
     * @param {Object} requestDetails - Detalhes da requisição
     * @returns {Object} Objeto com ação a ser tomada
     */
    const blockRequest = (requestDetails) => {
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
    };

    // API pública do módulo
    return {
        shouldBlockUrl,
        blockRequest
    };
})();

export default BlockingService;