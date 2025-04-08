/**
 * Arquivo principal da página de opções
 */
import ToastModule from './ui/toast.js';
import ModalModule from './ui/modal.js';
import TimeWindowManager from './ui/timeWindowManager.js';
import DomainTableModule from './ui/domainTable.js';
import ExceptionTableModule from './ui/exceptionTable.js';
import ImportExportModule from './ui/importExport.js';

// Quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const addBlockedDomainButton = document.getElementById('addBlockedDomain');
    const addExceptionButton = document.getElementById('addException');
    const exportConfigButton = document.getElementById('exportConfig');
    const importConfigButton = document.getElementById('importConfig');
    const importFileInput = document.getElementById('importFile');
    const checkAllTabsButton = document.getElementById('checkAllTabs');

    // Elementos dos modais de domínio
    const domainModal = document.getElementById('domainModal');
    const domainModalTitle = document.getElementById('domainModalTitle');
    const domainForm = document.getElementById('domainForm');
    const domainIndexInput = document.getElementById('domainIndex');
    const domainNameInput = document.getElementById('domainName');
    const domainTimeWindowsList = document.getElementById('domainTimeWindowsList');
    const addDomainTimeWindowButton = document.getElementById('addDomainTimeWindow');
    const saveDomainButton = document.getElementById('saveDomain');
    const cancelDomainButton = document.getElementById('cancelDomain');

    // Elementos dos modais de exceção
    const exceptionModal = document.getElementById('exceptionModal');
    const exceptionModalTitle = document.getElementById('exceptionModalTitle');
    const exceptionForm = document.getElementById('exceptionForm');
    const exceptionIndexInput = document.getElementById('exceptionIndex');
    const exceptionUrlInput = document.getElementById('exceptionUrl');
    const exceptionTimeWindowsList = document.getElementById('exceptionTimeWindowsList');
    const addExceptionTimeWindowButton = document.getElementById('addExceptionTimeWindow');
    const saveExceptionButton = document.getElementById('saveException');
    const cancelExceptionButton = document.getElementById('cancelException');

    // Elementos do modal de exclusão
    const deleteModal = document.getElementById('deleteModal');
    const deleteItemDisplay = document.getElementById('deleteItemDisplay');
    const confirmDeleteButton = document.getElementById('confirmDelete');
    const cancelDeleteButton = document.getElementById('cancelDelete');

    // Variável para armazenar o tipo de item sendo excluído
    let deleteItemType = '';

    // Inicializar módulos
    DomainTableModule.init({
        domainModal,
        domainModalTitle,
        domainIndexInput,
        domainNameInput,
        domainTimeWindowsList
    });

    ExceptionTableModule.init({
        exceptionModal,
        exceptionModalTitle,
        exceptionIndexInput,
        exceptionUrlInput,
        exceptionTimeWindowsList
    });

    // Configurar modais
    ModalModule.setupModalClosers([domainModal, exceptionModal, deleteModal]);

    // Carregar configurações atuais
    function loadCurrentConfig() {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                // Converter domínios simples para o novo formato se necessário
                const formattedDomains = config.blockedDomains.map(domain => {
                    if (typeof domain === 'string') {
                        return { domain: domain };
                    }
                    return domain;
                });

                // Inicializar DataTables
                DomainTableModule.initTable(formattedDomains);
                ExceptionTableModule.initTable(config.exceptionUrls || []);

                // Configurar listeners para os botões de ação nas tabelas
                DomainTableModule.setupTableListeners(
                    DomainTableModule.openEditDomainModal,
                    openDeleteDomainModal
                );

                ExceptionTableModule.setupTableListeners(
                    ExceptionTableModule.openEditExceptionModal,
                    openDeleteExceptionModal
                );
            })
            .catch(error => {
                console.error("Erro ao carregar configurações:", error);
                ToastModule.showErrorToast("Erro ao carregar configurações: " + error);
            });
    }

    // Abrir modal para excluir domínio bloqueado
    function openDeleteDomainModal(index) {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const domain = config.blockedDomains[index];
                deleteItemDisplay.textContent = domain.domain;

                // Armazenar o índice e tipo no botão de confirmação
                confirmDeleteButton.dataset.index = index;
                deleteItemType = 'domain';

                ModalModule.openModal(deleteModal);
            })
            .catch(error => {
                console.error("Erro ao carregar domínio para exclusão:", error);
                ToastModule.showErrorToast("Erro ao carregar domínio para exclusão: " + error);
            });
    }

    // Abrir modal de confirmação para excluir exceção
    function openDeleteExceptionModal(index) {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const exception = config.exceptionUrls[index];
                deleteItemDisplay.textContent = exception.url;

                // Armazenar o índice e tipo no botão de confirmação
                confirmDeleteButton.dataset.index = index;
                deleteItemType = 'exception';

                ModalModule.openModal(deleteModal);
            })
            .catch(error => {
                console.error("Erro ao carregar exceção para exclusão:", error);
                ToastModule.showErrorToast("Erro ao carregar exceção para exclusão: " + error);
            });
    }

    // Event Listeners

    // Adicionar novo domínio bloqueado
    addBlockedDomainButton.addEventListener('click', DomainTableModule.openAddDomainModal);

    // Adicionar nova exceção
    addExceptionButton.addEventListener('click', ExceptionTableModule.openAddExceptionModal);

    // Adicionar nova janela de tempo ao clicar nos botões
    addDomainTimeWindowButton.addEventListener('click', () => {
        TimeWindowManager.addTimeWindow(domainTimeWindowsList);
    });

    addExceptionTimeWindowButton.addEventListener('click', () => {
        TimeWindowManager.addTimeWindow(exceptionTimeWindowsList);
    });

    // Cancelar adição/edição de domínio
    cancelDomainButton.addEventListener('click', () => {
        ModalModule.closeModal(domainModal);
    });

    // Salvar domínio bloqueado
    saveDomainButton.addEventListener('click', DomainTableModule.saveDomain);

    // Cancelar adição/edição de exceção
    cancelExceptionButton.addEventListener('click', () => {
        ModalModule.closeModal(exceptionModal);
    });

    // Salvar exceção
    saveExceptionButton.addEventListener('click', ExceptionTableModule.saveException);

    // Cancelar exclusão
    cancelDeleteButton.addEventListener('click', () => {
        ModalModule.closeModal(deleteModal);
    });

    // Confirmar exclusão
    confirmDeleteButton.addEventListener('click', () => {
        const index = parseInt(confirmDeleteButton.dataset.index);

        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                if (deleteItemType === 'domain') {
                    const domains = config.blockedDomains || [];
                    domains.splice(index, 1);

                    return browser.runtime.sendMessage({
                        action: "updateConfig",
                        blockedDomains: domains
                    });
                } else if (deleteItemType === 'exception') {
                    const exceptions = config.exceptionUrls || [];
                    exceptions.splice(index, 1);

                    return browser.runtime.sendMessage({
                        action: "updateConfig",
                        exceptionUrls: exceptions
                    });
                }
            })
            .then(response => {
                if (response.success) {
                    ModalModule.closeModal(deleteModal);
                    loadCurrentConfig();
                    ToastModule.showSuccessToast(deleteItemType === 'domain' ?
                        "Domínio excluído com sucesso!" :
                        "Exceção excluída com sucesso!");
                } else {
                    ToastModule.showErrorToast("Erro ao excluir item: " + response.error);
                }
            })
            .catch(error => {
                console.error("Erro ao excluir item:", error);
                ToastModule.showErrorToast("Erro ao excluir item: " + error);
            });
    });

    // Exportar configurações
    exportConfigButton.addEventListener('click', ImportExportModule.exportConfig);

    // Importar configurações
    importConfigButton.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        ImportExportModule.importConfig(event.target.files[0]);
    });

    // Verificar todas as abas abertas
    checkAllTabsButton.addEventListener('click', ImportExportModule.checkAllTabs);

    // Carregar configurações ao abrir a página
    loadCurrentConfig();
});