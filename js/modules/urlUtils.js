/**
 * Módulo para funções relacionadas a URLs e domínios
 */
const UrlUtils = (() => {
    /**
     * Extrai o domínio de uma URL
     * @param {string} url - URL a ser processada
     * @returns {string} Domínio extraído da URL
     */
    const extractDomain = (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            console.error("URL inválida:", url);
            return url;
        }
    };

    /**
     * Verifica se um domínio corresponde a um padrão de domínio bloqueado
     * @param {string} domain - Domínio a ser verificado
     * @param {string} blockedDomain - Padrão de domínio bloqueado
     * @returns {boolean} Verdadeiro se o domínio corresponder ao padrão
     */
    const domainMatches = (domain, blockedDomain) => {
        return domain === blockedDomain || domain.endsWith("." + blockedDomain);
    };

    /**
     * Verifica se uma URL é interna do navegador
     * @param {string} url - URL a ser verificada
     * @returns {boolean} Verdadeiro se a URL for interna
     */
    const isInternalUrl = (url) => {
        return !url ||
            url.startsWith("about:") ||
            url.startsWith("moz-extension:") ||
            url.startsWith("chrome-extension:");
    };

    // API pública do módulo
    return {
        extractDomain,
        domainMatches,
        isInternalUrl
    };
})();

export default UrlUtils;