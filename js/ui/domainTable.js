/**
 * Módulo para gerenciar a tabela de domínios bloqueados
 */
import TimeUtils from '../modules/timeUtils.js';
import ModalModule from './modal.js';
import TimeWindowManager from './timeWindowManager.js';
import ToastModule from './toast.js';

const DomainTableModule = (() => {
    // Variável para armazenar a instância do DataTable
    let blockedDomainsTable;

    // Elementos do DOM
    let domainModal;
    let domainModalTitle;
    let domainIndexInput;
    let domainNameInput;
    let domainTimeWindowsList;

    /**
     * Inicializa o módulo
     * @param {Object} elements - Elementos do DOM necessários
     */
    const init = (elements) => {
        domainModal = elements.domainModal;
        domainModalTitle = elements.domainModalTitle;
        domainIndexInput = elements.domainIndexInput;
        domainNameInput = elements.domainNameInput;
        domainTimeWindowsList = elements.domainTimeWindowsList;
    };

    /**
     * Inicializa a tabela de domínios bloqueados
     * @param {Array} domains - Lista de domínios bloqueados
     */
    const initTable = (domains) => {
        // Destruir tabela existente se houver
        if (blockedDomainsTable) {
            blockedDomainsTable.destroy();
        }

        // Preparar dados para a tabela
        const tableData = domains.map((domain, index) => {
            return [
                domain.domain,
                domain.title || domain.domain, // Mostrar título ou domínio se não houver título  
                TimeUtils.formatTimeWindows(domain.timeWindows),
                `<div class="action-buttons">  
                    <button class="edit-domain-btn" data-index="${index}">Editar</button>  
                    <button class="delete-domain-btn delete" data-index="${index}">Excluir</button>  
                </div>`
            ];
        });

        // Inicializar DataTable
        blockedDomainsTable = jQuery('#blockedDomainsTable').DataTable({
            data: tableData,
            columns: [
                { title: "Domínio" },
                { title: "Título" }, // Nova coluna  
                { title: "Horários de Bloqueio" },
                { title: "Ações", width: "120px" }
            ],
            language: {
                "sEmptyTable": "Nenhum registro encontrado",
                "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
                "sInfoFiltered": "(Filtrados de _MAX_ registros)",
                "sInfoPostFix": "",
                "sInfoThousands": ".",
                "sLengthMenu": "_MENU_ resultados por página",
                "sLoadingRecords": "Carregando...",
                "sProcessing": "Processando...",
                "sZeroRecords": "Nenhum registro encontrado",
                "sSearch": "Pesquisar",
                "oPaginate": {
                    "sNext": "Próximo",
                    "sPrevious": "Anterior",
                    "sFirst": "Primeiro",
                    "sLast": "Último"
                },
                "oAria": {
                    "sSortAscending": ": Ordenar colunas de forma ascendente",
                    "sSortDescending": ": Ordenar colunas de forma descendente"
                }
            },
            responsive: true,
            order: [[0, 'asc']], // Ordenar por domínio
            columnDefs: [
                { targets: 1, orderable: false }, // Desabilitar ordenação na coluna de horários
                { targets: 2, orderable: false } // Desabilitar ordenação na coluna de ações
            ]
        });
    };

    /**
     * Configura os listeners para os botões de ação na tabela
     * @param {Function} onEdit - Função a ser chamada quando o botão de editar for clicado
     * @param {Function} onDelete - Função a ser chamada quando o botão de excluir for clicado
     */
    const setupTableListeners = (onEdit, onDelete) => {
        jQuery('#blockedDomainsTable').on('click', '.edit-domain-btn', function () {
            const index = jQuery(this).data('index');
            onEdit(index);
        });

        jQuery('#blockedDomainsTable').on('click', '.delete-domain-btn', function () {
            const index = jQuery(this).data('index');
            onDelete(index);
        });
    };

    /**
     * Abre o modal para adicionar um novo domínio
     */
    const openAddDomainModal = () => {
        domainModalTitle.textContent = 'Adicionar Domínio Bloqueado';
        domainIndexInput.value = -1;
        domainNameInput.value = '';
        domainTitleInput.value = ''; // Novo campo para título  
        domainTimeWindowsList.innerHTML = '';

        ModalModule.openModal(domainModal);
    };

    /**
     * Abre o modal para editar um domínio existente
     * @param {number} index - Índice do domínio a ser editado
     */
    const openEditDomainModal = (index) => {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const domain = config.blockedDomains[index];

                domainModalTitle.textContent = 'Editar Domínio Bloqueado';
                domainIndexInput.value = index;
                domainNameInput.value = domain.domain;
                domainTitleInput.value = domain.title || ''; // Carregar título existente

                domainTimeWindowsList.innerHTML = '';

                // Adicionar janelas de tempo existentes
                if (domain.timeWindows && domain.timeWindows.length > 0) {
                    domain.timeWindows.forEach(window => {
                        TimeWindowManager.addTimeWindow(domainTimeWindowsList, window);
                    });
                }

                ModalModule.openModal(domainModal);
            })
            .catch(error => {
                console.error("Erro ao carregar domínio para edição:", error);
                ToastModule.showErrorToast("Erro ao carregar domínio para edição: " + error);
            });
    };

    /**
     * Salva um domínio (novo ou editado)
     */
    const saveDomain = () => {
        const domain = domainNameInput.value.trim();
        const title = domainTitleInput.value.trim(); // Obter título

        if (!domain) {
            ToastModule.showErrorToast("Por favor, informe o domínio a ser bloqueado.");
            return;
        }

        // Coletar janelas de tempo (se houver)
        let timeWindows = [];
        try {
            if (domainTimeWindowsList.querySelectorAll('.time-window-item').length > 0) {
                timeWindows = TimeWindowManager.collectTimeWindows(domainTimeWindowsList);
            }
        } catch (error) {
            ToastModule.showErrorToast(error.message);
            return;
        }

        // Obter o índice do domínio que está sendo editado
        const currentIndex = parseInt(domainIndexInput.value);

        // Obter configuração atual
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const domains = config.blockedDomains || [];

                const newDomain = {
                    domain,
                    title,
                    timeWindows
                };

                if (currentIndex >= 0) {
                    // Editar domínio existente
                    domains[currentIndex] = newDomain;
                } else {
                    // Adicionar novo domínio
                    domains.push(newDomain);
                }

                return browser.runtime.sendMessage({
                    action: "updateConfig",
                    blockedDomains: domains
                });
            })
            .then(response => {
                if (response.success) {
                    ModalModule.closeModal(domainModal);
                    ToastModule.showSuccessToast(currentIndex >= 0 ?
                        "Domínio atualizado com sucesso!" :
                        "Domínio adicionado com sucesso!");

                    // Recarregar a tabela
                    browser.runtime.sendMessage({ action: "getConfig" })
                        .then(config => {
                            initTable(config.blockedDomains);
                        });
                } else {
                    ToastModule.showErrorToast("Erro ao salvar domínio: " + response.error);
                }
            })
            .catch(error => {
                console.error("Erro ao salvar domínio:", error);
                ToastModule.showErrorToast("Erro ao salvar domínio: " + error);
            });
    };

    // API pública do módulo
    return {
        init,
        initTable,
        setupTableListeners,
        openAddDomainModal,
        openEditDomainModal,
        saveDomain
    };
})();

export default DomainTableModule;