/**
 * Módulo para gerenciar abas do navegador
 */
import BlockingService from './blockingService.js';
import UrlUtils from './urlUtils.js';

const TabManager = (() => {
    /**
     * Verifica e bloqueia uma aba específica se necessário
     * @param {Object} tab - Objeto da aba a ser verificada
     */
    const checkAndBlockTab = (tab) => {
        if (UrlUtils.isInternalUrl(tab.url)) {
            return; // Ignora abas internas do navegador
        }

        const result = BlockingService.shouldBlockUrl(tab.url);

        if (result.blocked) {
            // Redireciona a aba para a página de bloqueio
            const blockPageUrl = browser.runtime.getURL("blocked.html") +
                "?message=" + encodeURIComponent(result.message) +
                "&url=" + encodeURIComponent(tab.url);

            browser.tabs.update(tab.id, { url: blockPageUrl });
        }
    };

    /**
     * Verifica todas as abas abertas
     * @returns {Promise} Promise que resolve quando todas as abas são verificadas
     */
    const checkAllOpenTabs = () => {
        return browser.tabs.query({}).then(tabs => {
            tabs.forEach(tab => {
                checkAndBlockTab(tab);
            });
            return { success: true };
        });
    };

    /**
     * Configura o listener para mudanças de URL em abas
     */
    const setupTabUpdateListener = () => {
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // Verifica se a URL da aba mudou
            if (changeInfo.url) {
                checkAndBlockTab(tab);
            }
        });
        console.log("Listener de atualização de abas configurado");
    };

    // API pública do módulo
    return {
        checkAndBlockTab,
        checkAllOpenTabs,
        setupTabUpdateListener
    };
})();

export default TabManager;