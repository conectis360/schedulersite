/**
 * Módulo para gerenciar o armazenamento da extensão
 */

// Configuração padrão
const defaultConfig = {
    blockedDomains: [],
    exceptionUrls: [],
    siteNotes: []
};

/**
 * Carrega a configuração do armazenamento local
 * @returns {Promise} Promessa que resolve para a configuração
 */
const loadConfiguration = () => {
    return browser.storage.local.get('config')
        .then(data => {
            if (!data.config) {
                // Se não houver configuração, inicializar com valores padrão
                return browser.storage.local.set({ config: defaultConfig })
                    .then(() => defaultConfig);
            }
            return data.config;
        })
        .catch(error => {
            console.error("Erro ao carregar configuração:", error);
            return defaultConfig;
        });
};

/**
 * Salva a configuração no armazenamento local
 * @param {Object} config - Configuração a ser salva
 * @returns {Promise} Promessa que resolve quando a configuração for salva
 */
const saveConfiguration = (config) => {
    return browser.storage.local.set({ config })
        .then(() => ({ success: true }))
        .catch(error => {
            console.error("Erro ao salvar configuração:", error);
            return { success: false, error: error.toString() };
        });
};

/**
 * Atualiza parcialmente a configuração
 * @param {Object} updates - Atualizações a serem aplicadas
 * @returns {Promise} Promessa que resolve quando a configuração for atualizada
 */
const updateConfiguration = (updates) => {
    return loadConfiguration()
        .then(config => {
            const newConfig = { ...config };

            // Aplicar atualizações
            Object.keys(updates).forEach(key => {
                newConfig[key] = updates[key];
            });

            return saveConfiguration(newConfig);
        });
};

export default {
    defaultConfig,
    loadConfiguration,
    saveConfiguration,
    updateConfiguration
};