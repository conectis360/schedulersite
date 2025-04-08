/**
 * Módulo para gerenciar mensagens entre background e páginas
 */
import StorageModule from './storage.js';
import TabManager from './tabManager.js';
import BlockingService from './blockingService.js';

const MessageHandler = (() => {
    /**
     * Configura o listener para mensagens
     */
    const setupMessageListener = () => {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "getConfig") {
                sendResponse(StorageModule.getConfig());
            }
            else if (message.action === "updateConfig") {
                if (message.blockedDomains) {
                    StorageModule.updateBlockedDomains(message.blockedDomains);
                }
                if (message.exceptionUrls) {
                    StorageModule.updateExceptionUrls(message.exceptionUrls);
                }
                StorageModule.saveConfiguration().then(() => {
                    TabManager.checkAllOpenTabs();
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.toString() });
                });
                return true; // Indica que a resposta será enviada de forma assíncrona
            }
            else if (message.action === "importConfig") {
                StorageModule.importConfigFromJson(message.jsonData).then(() => {
                    TabManager.checkAllOpenTabs();
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.toString() });
                });
                return true; // Indica que a resposta será enviada de forma assíncrona
            }
            else if (message.action === "exportConfig") {
                sendResponse({ jsonData: StorageModule.exportConfigToJson() });
            }
            else if (message.action === "checkAllTabs") {
                TabManager.checkAllOpenTabs().then(() => {
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.toString() });
                });
                return true; // Indica que a resposta será enviada de forma assíncrona
            }
            else if (message.action === "checkUrl") {
                const result = BlockingService.shouldBlockUrl(message.url);
                sendResponse(result);
            }
        });

        console.log("Listener de mensagens configurado");
    };

    // API pública do módulo
    return {
        setupMessageListener
    };
})();

export default MessageHandler;