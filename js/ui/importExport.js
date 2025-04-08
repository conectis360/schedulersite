/**
 * Módulo para gerenciar importação e exportação de configurações
 */
import ToastModule from './toast.js';

const ImportExportModule = (() => {
    /**
     * Exporta as configurações para um arquivo JSON
     */
    const exportConfig = () => {
        browser.runtime.sendMessage({ action: "exportConfig" })
            .then(response => {
                const jsonData = response.jsonData;
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'bloqueio-config.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
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
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = e.target.result;

            browser.runtime.sendMessage({
                action: "importConfig",
                jsonData: jsonData
            })
                .then(response => {
                    if (response.success) {
                        ToastModule.showSuccessToast("Configurações importadas com sucesso!");

                        // Recarregar a página para atualizar as tabelas
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        ToastModule.showErrorToast("Erro ao importar configurações: " + response.error);
                    }
                })
                .catch(error => {
                    console.error("Erro ao importar configurações:", error);
                    ToastModule.showErrorToast("Erro ao importar configurações: " + error);
                });
        };
        reader.readAsText(file);
    };

    /**
     * Verifica todas as abas abertas
     */
    const checkAllTabs = () => {
        browser.runtime.sendMessage({ action: "checkAllTabs" })
            .then(response => {
                if (response.success) {
                    ToastModule.showInfoToast("Verificação de abas concluída");
                }
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