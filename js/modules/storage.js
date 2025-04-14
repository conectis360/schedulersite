/**
 * Módulo para gerenciar o armazenamento da extensão
 */

// Configuração padrão
const defaultConfig = {
    blockedDomains: [],
    exceptionUrls: [],
    siteNotes: []
};

// Variável para armazenar a configuração em memória
let cachedConfig = null;

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
                    .then(() => {
                        cachedConfig = { ...defaultConfig };
                        return cachedConfig;
                    });
            }
            cachedConfig = data.config;
            return cachedConfig;
        })
        .catch(error => {
            console.error("Erro ao carregar configuração:", error);
            cachedConfig = { ...defaultConfig };
            return cachedConfig;
        });
};

/**
 * Obtém a configuração atual (síncrono)
 * @returns {Object} Configuração atual
 */
const getConfig = () => {
    if (cachedConfig === null) {
        // Se a configuração ainda não foi carregada, retornar a padrão
        console.warn("Configuração não carregada, usando padrão");
        return { ...defaultConfig };
    }
    return cachedConfig;
};

/**
 * Salva a configuração no armazenamento local
 * @param {Object} config - Configuração a ser salva
 * @returns {Promise} Promessa que resolve quando a configuração for salva
 */
const saveConfiguration = (config) => {
    cachedConfig = { ...config };
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
    if (cachedConfig) {
        // Se temos a configuração em cache, atualizamos diretamente
        const newConfig = { ...cachedConfig };

        // Aplicar atualizações
        Object.keys(updates).forEach(key => {
            newConfig[key] = updates[key];
        });

        return saveConfiguration(newConfig);
    } else {
        // Caso contrário, carregamos primeiro
        return loadConfiguration()
            .then(config => {
                const newConfig = { ...config };

                // Aplicar atualizações
                Object.keys(updates).forEach(key => {
                    newConfig[key] = updates[key];
                });

                return saveConfiguration(newConfig);
            });
    }
};

export default {
    defaultConfig,
    loadConfiguration,
    saveConfiguration,
    updateConfiguration,
    getConfig
};