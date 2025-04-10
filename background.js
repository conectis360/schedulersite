/**
 * Arquivo principal da extensão (background script)
 */
import StorageModule from './js/modules/storage.js';
import BlockingService from './js/modules/blockingService.js';
import TabManager from './js/modules/tabManager.js';
import MessageHandler from './js/modules/messageHandler.js';
import NotificationService from './ui/notificationService.js';

// Inicialização
function init() {
    StorageModule.loadConfiguration().then(() => {
        // Configurar listeners para requisições web
        browser.webRequest.onBeforeRequest.addListener(
            BlockingService.blockRequest,
            {
                urls: ["<all_urls>"],
                types: ["main_frame"]
            },
            ["blocking"]
        );
        console.log("Listener de bloqueio configurado");

        // Configurar listener para mudanças de URL em abas
        TabManager.setupTabUpdateListener();

        // Configurar listener para mensagens
        MessageHandler.setupMessageListener();

        // Verificar todas as abas abertas na inicialização
        TabManager.checkAllOpenTabs();


        console.log("Extensão de Controle de Acesso Granular Ativa!");
    });
}

// Adicionar listener para quando a extensão é instalada ou atualizada
browser.runtime.onInstalled.addListener(() => {
    console.log("Extensão instalada ou atualizada");
    NotificationService.init();
    init();
});

// Iniciar a extensão
init();