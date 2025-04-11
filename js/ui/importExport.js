/**
 * Módulo para importar e exportar configurações
 */
import ToastModule from './ToastModule.js';

const ImportExportModule = (() => {
    /**
     * Exporta as configurações atuais para um arquivo JSON
     */
    const exportConfig = () => {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                // Criar um objeto Blob com o conteúdo JSON
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });

                // Criar URL para o Blob
                const url = URL.createObjectURL(blob);

                // Criar elemento de link para download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'scheduler_config.json';

                // Adicionar ao documento, clicar e remover
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Liberar a URL
                URL.revokeObjectURL(url);

                ToastModule.showSuccessToast("Configurações exportadas com sucesso!");
            })
            .catch(error => {
                console.error("Erro ao exportar configurações:", error);
                ToastModule.showErrorToast("Erro ao exportar configurações: " + error);
            });
    };

    /**
     * Importa configurações de um arquivo JSON
     * @param {File} file - Arquivo JSON a ser importado
     */
    const importConfig = (file) => {
        if (!file) {
            ToastModule.showErrorToast("Nenhum arquivo selecionado.");
            return;
        }

        if (file.type !== 'application/json') {
            ToastModule.showErrorToast("Por favor, selecione um arquivo JSON válido.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);

                // Validar configuração básica
                if (!config.blockedDomains || !Array.isArray(config.blockedDomains)) {
                    throw new Error("Formato de configuração inválido: blockedDomains ausente ou inválido");
                }

                // Atualizar configuração
                browser.runtime.sendMessage({
                    action: "updateConfig",
                    ...config
                })
                    .then(response => {
                        if (response.success) {
                            ToastModule.showSuccessToast("Configurações importadas com sucesso!");
                            // Recarregar a página para atualizar as tabelas
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        } else {
                            ToastModule.showErrorToast("Erro ao importar configurações: " + response.error);
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao importar configurações:", error);
                        ToastModule.showErrorToast("Erro ao importar configurações: " + error);
                    });
            } catch (error) {
                console.error("Erro ao processar arquivo JSON:", error);
                ToastModule.showErrorToast("Erro ao processar arquivo JSON: " + error);
            }
        };

        reader.onerror = () => {
            ToastModule.showErrorToast("Erro ao ler o arquivo.");
        };

        reader.readAsText(file);
    };

    /**
     * Verifica todas as abas abertas
     */
    const checkAllTabs = () => {
        browser.runtime.sendMessage({ action: "checkAllTabs" })
            .then(() => {
                ToastModule.showSuccessToast("Verificação de abas iniciada!");
            })
            .catch(error => {
                console.error("Erro ao verificar abas:", error);
                ToastModule.showErrorToast("Erro ao verificar abas: " + error);
            });
    };

    // API pública do módulo
    return {
        exportConfig,
        importConfig,
        checkAllTabs
    };
})();

export default ImportExportModule;