/**
 * Módulo para gerenciar o armazenamento de configurações
 */
const StorageModule = (() => {
    // Estado interno
    let blockedDomains = [];
    let exceptionUrls = [];

    /**
     * Carrega as configurações do armazenamento local
     * @returns {Promise} Promise que resolve quando as configurações são carregadas
     */
    const loadConfiguration = () => {
        return browser.storage.local.get(['blockedDomains', 'exceptionUrls'])
            .then(result => {
                blockedDomains = result.blockedDomains || [];
                exceptionUrls = result.exceptionUrls || [];
                console.log("Configuração carregada:", { blockedDomains, exceptionUrls });
                return { blockedDomains, exceptionUrls };
            })
            .catch(error => {
                console.error("Erro ao carregar configurações:", error);
                throw error;
            });
    };

    /**
     * Salva as configurações no armazenamento local
     * @returns {Promise} Promise que resolve quando as configurações são salvas
     */
    const saveConfiguration = () => {
        return browser.storage.local.set({
            blockedDomains,
            exceptionUrls
        }).then(() => {
            console.log("Configuração salva com sucesso");
            return { success: true };
        }).catch(error => {
            console.error("Erro ao salvar configurações:", error);
            throw error;
        });
    };

    /**
     * Importa configurações de um arquivo JSON
     * @param {string} jsonData - String JSON com as configurações
     * @returns {Promise} Promise que resolve quando as configurações são importadas
     */
    const importConfigFromJson = (jsonData) => {
        try {
            const config = JSON.parse(jsonData);

            if (config.blockedDomains) {
                blockedDomains = config.blockedDomains;
            }

            if (config.exceptionUrls) {
                exceptionUrls = config.exceptionUrls;
            }

            return saveConfiguration();
        } catch (error) {
            console.error("Erro ao importar configuração:", error);
            return Promise.reject(error);
        }
    };

    /**
     * Exporta configurações para JSON
     * @returns {string} String JSON com as configurações
     */
    const exportConfigToJson = () => {
        const config = {
            blockedDomains,
            exceptionUrls
        };

        return JSON.stringify(config, null, 2);
    };

    /**
     * Atualiza os domínios bloqueados
     * @param {Array} domains - Nova lista de domínios bloqueados
     */
    const updateBlockedDomains = (domains) => {
        blockedDomains = domains;
    };

    /**
     * Atualiza as URLs de exceção
     * @param {Array} exceptions - Nova lista de URLs de exceção
     */
    const updateExceptionUrls = (exceptions) => {
        exceptionUrls = exceptions;
    };

    /**
     * Obtém as configurações atuais
     * @returns {Object} Objeto com as configurações atuais
     */
    const getConfig = () => {
        return {
            blockedDomains,
            exceptionUrls
        };
    };

    // API pública do módulo
    return {
        loadConfiguration,
        saveConfiguration,
        importConfigFromJson,
        exportConfigToJson,
        updateBlockedDomains,
        updateExceptionUrls,
        getConfig
    };
})();

export default StorageModule;