/**
 * Módulo para gerenciar mensagens entre os scripts da extensão
 */
import StorageModule from './storage.js';
import TabManager from './tabManager.js';

/**
 * Configura o listener para mensagens
 */
const setupMessageListener = () => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Obter configuração atual
        if (message.action === "getConfig") {
            return StorageModule.loadConfiguration();
        }

        // Atualizar configuração
        if (message.action === "updateConfig") {
            const updates = { ...message };
            delete updates.action;

            return StorageModule.updateConfiguration(updates);
        }

        // Verificar todas as abas abertas
        if (message.action === "checkAllTabs") {
            TabManager.checkAllOpenTabs();
            return Promise.resolve({ success: true });
        }

        // Obter notas para um domínio
        if (message.action === "getSiteNotes") {
            return StorageModule.loadConfiguration()
                .then(config => {
                    const domain = message.domain;
                    const siteNotes = config.siteNotes || [];
                    const domainNotes = siteNotes.find(site => site.domain === domain);

                    return {
                        notes: domainNotes ? domainNotes.notes : []
                    };
                });
        }

        // Adicionar uma nova nota
        if (message.action === "addSiteNote") {
            return StorageModule.loadConfiguration()
                .then(config => {
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
                    return StorageModule.updateConfiguration({ siteNotes: siteNotes });
                });
        }

        // Atualizar uma nota existente
        if (message.action === "updateSiteNote") {
            return StorageModule.loadConfiguration()
                .then(config => {
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
                    return StorageModule.updateConfiguration({ siteNotes: siteNotes });
                });
        }

        // Excluir uma nota
        if (message.action === "deleteSiteNote") {
            return StorageModule.loadConfiguration()
                .then(config => {
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
                    return StorageModule.updateConfiguration({ siteNotes: siteNotes });
                });
        }

        // Excluir todas as notas de um domínio
        if (message.action === "deleteSiteNotes") {
            return StorageModule.loadConfiguration()
                .then(config => {
                    const domain = message.domain;
                    let siteNotes = config.siteNotes || [];

                    // Filtrar o domínio a ser excluído
                    siteNotes = siteNotes.filter(site => site.domain !== domain);

                    // Atualizar configuração
                    return StorageModule.updateConfiguration({ siteNotes: siteNotes });
                });
        }

        return false; // Indica que não tratamos esta mensagem
    });
};

export default {
    setupMessageListener
};