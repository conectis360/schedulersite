/**
 * Arquivo principal da extensão (background script)
 */
import StorageModule from './js/modules/storage.js';
import BlockingService from './js/modules/blockingService.js';
import TabManager from './js/modules/tabManager.js';
import MessageHandler from './js/modules/messageHandler.js';
import NotificationService from './js/modules/notificationService.js';

// Configuração padrão
const defaultConfig = {
    blockedDomains: [],
    exceptionUrls: [],
    siteNotes: [] // Adicionar array para notas
};

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

// Funções auxiliares para gerenciar configurações
function getConfig() {
    return browser.storage.local.get().then(data => {
        return data.config || defaultConfig;
    });
}

function updateConfig(updates) {
    return getConfig().then(config => {
        const newConfig = { ...config, ...updates };
        return browser.storage.local.set({ config: newConfig }).then(() => {
            return { success: true };
        });
    });
}

// Adicionar handlers para mensagens relacionadas às notas
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Obter notas para um domínio
    if (message.action === "getSiteNotes") {
        getConfig().then(config => {
            const domain = message.domain;
            const siteNotes = config.siteNotes || [];
            const domainNotes = siteNotes.find(site => site.domain === domain);

            sendResponse({
                notes: domainNotes ? domainNotes.notes : []
            });
        });
        return true; // Indica que a resposta será assíncrona
    }

    // Adicionar uma nova nota
    if (message.action === "addSiteNote") {
        getConfig().then(config => {
            const domain = message.domain;
            const note = message.note;
            let siteNotes = config.siteNotes || [];

            // Verificar se já existe entrada para este domínio
            let domainEntry = siteNotes.find(site => site.domain === domain);

            if (!domainEntry) {
                domainEntry = {
                    domain: domain,
                    notes: []
                };
                siteNotes.push(domainEntry);
            }

            // Adicionar a nota
            domainEntry.notes.push(note);

            // Atualizar configuração
            return updateConfig({ siteNotes: siteNotes });
        })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Erro ao adicionar nota:", error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true;
    }

    // Atualizar uma nota existente
    if (message.action === "updateSiteNote") {
        getConfig().then(config => {
            const domain = message.domain;
            const noteId = message.noteId;
            const updates = message.updates;
            let siteNotes = config.siteNotes || [];

            // Encontrar o domínio
            const domainEntry = siteNotes.find(site => site.domain === domain);
            if (!domainEntry) {
                throw new Error("Domínio não encontrado");
            }

            // Encontrar a nota
            const noteIndex = domainEntry.notes.findIndex(note => note.id === noteId);
            if (noteIndex === -1) {
                throw new Error("Nota não encontrada");
            }

            // Atualizar a nota
            domainEntry.notes[noteIndex] = {
                ...domainEntry.notes[noteIndex],
                ...updates
            };

            // Atualizar configuração
            return updateConfig({ siteNotes: siteNotes });
        })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Erro ao atualizar nota:", error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true;
    }

    // Excluir uma nota
    if (message.action === "deleteSiteNote") {
        getConfig().then(config => {
            const domain = message.domain;
            const noteId = message.noteId;
            let siteNotes = config.siteNotes || [];

            // Encontrar o domínio
            const domainEntry = siteNotes.find(site => site.domain === domain);
            if (!domainEntry) {
                throw new Error("Domínio não encontrado");
            }

            // Filtrar a nota a ser excluída
            domainEntry.notes = domainEntry.notes.filter(note => note.id !== noteId);

            // Se não houver mais notas, remover o domínio
            if (domainEntry.notes.length === 0) {
                siteNotes = siteNotes.filter(site => site.domain !== domain);
            }

            // Atualizar configuração
            return updateConfig({ siteNotes: siteNotes });
        })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Erro ao excluir nota:", error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true;
    }

    // Excluir todas as notas de um domínio
    if (message.action === "deleteSiteNotes") {
        getConfig().then(config => {
            const domain = message.domain;
            let siteNotes = config.siteNotes || [];

            // Filtrar o domínio a ser excluído
            siteNotes = siteNotes.filter(site => site.domain !== domain);

            // Atualizar configuração
            return updateConfig({ siteNotes: siteNotes });
        })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Erro ao excluir notas:", error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true;
    }
});