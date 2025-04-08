/**
 * Módulo para gerenciar a tabela de exceções
 */
import TimeUtils from '../modules/timeUtils.js';
import ModalModule from './modal.js';
import TimeWindowManager from './timeWindowManager.js';
import ToastModule from './toast.js';

const ExceptionTableModule = (() => {
    // Variável para armazenar a instância do DataTable
    let exceptionsTable;

    // Elementos do DOM
    let exceptionModal;
    let exceptionModalTitle;
    let exceptionIndexInput;
    let exceptionUrlInput;
    let exceptionTimeWindowsList;

    /**
     * Inicializa o módulo
     * @param {Object} elements - Elementos do DOM necessários
     */
    const init = (elements) => {
        exceptionModal = elements.exceptionModal;
        exceptionModalTitle = elements.exceptionModalTitle;
        exceptionIndexInput = elements.exceptionIndexInput;
        exceptionUrlInput = elements.exceptionUrlInput;
        exceptionTimeWindowsList = elements.exceptionTimeWindowsList;
    };

    /**
     * Inicializa a tabela de exceções
     * @param {Array} exceptions - Lista de exceções
     */
    const initTable = (exceptions) => {
        // Destruir tabela existente se houver
        if (exceptionsTable) {
            exceptionsTable.destroy();
        }

        // Preparar dados para a tabela
        const tableData = exceptions.map((exception, index) => {
            return [
                exception.url,
                TimeUtils.formatTimeWindows(exception.timeWindows),
                `<div class="action-buttons">
                    <button class="edit-exception-btn" data-index="${index}">Editar</button>
                    <button class="delete-exception-btn delete" data-index="${index}">Excluir</button>
                </div>`
            ];
        });

        // Inicializar DataTable
        exceptionsTable = jQuery('#exceptionsTable').DataTable({
            data: tableData,
            columns: [
                { title: "URL" },
                { title: "Horários Permitidos" },
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
            order: [[0, 'asc']], // Ordenar por URL
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
        jQuery('#exceptionsTable').on('click', '.edit-exception-btn', function () {
            const index = jQuery(this).data('index');
            onEdit(index);
        });

        jQuery('#exceptionsTable').on('click', '.delete-exception-btn', function () {
            const index = jQuery(this).data('index');
            onDelete(index);
        });
    };

    /**
     * Abre o modal para adicionar uma nova exceção
     */
    const openAddExceptionModal = () => {
        exceptionModalTitle.textContent = 'Adicionar Exceção';
        exceptionIndexInput.value = -1;
        exceptionUrlInput.value = '';
        exceptionTimeWindowsList.innerHTML = '';
        TimeWindowManager.addTimeWindow(exceptionTimeWindowsList); // Adiciona uma janela de tempo vazia

        ModalModule.openModal(exceptionModal);
    };

    /**
     * Abre o modal para editar uma exceção existente
     * @param {number} index - Índice da exceção a ser editada
     */
    const openEditExceptionModal = (index) => {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const exception = config.exceptionUrls[index];

                exceptionModalTitle.textContent = 'Editar Exceção';
                exceptionIndexInput.value = index;
                exceptionUrlInput.value = exception.url;

                exceptionTimeWindowsList.innerHTML = '';

                // Adicionar janelas de tempo existentes
                exception.timeWindows.forEach(window => {
                    TimeWindowManager.addTimeWindow(exceptionTimeWindowsList, window);
                });

                ModalModule.openModal(exceptionModal);
            })
            .catch(error => {
                console.error("Erro ao carregar exceção para edição:", error);
                ToastModule.showErrorToast("Erro ao carregar exceção para edição: " + error);
            });
    };

    /**
     * Salva uma exceção (nova ou editada)
     */
    const saveException = () => {
        const url = exceptionUrlInput.value.trim();

        if (!url) {
            ToastModule.showErrorToast("Por favor, informe a URL da exceção.");
            return;
        }

        // Coletar janelas de tempo
        let timeWindows = [];
        try {
            timeWindows = TimeWindowManager.collectTimeWindows(exceptionTimeWindowsList);

            if (timeWindows.length === 0) {
                ToastModule.showErrorToast("Adicione pelo menos uma janela de tempo.");
                return;
            }
        } catch (error) {
            ToastModule.showErrorToast(error.message);
            return;
        }

        // Obter o índice da exceção que está sendo editada
        const currentIndex = parseInt(exceptionIndexInput.value);

        // Obter configuração atual
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const exceptions = config.exceptionUrls || [];

                const newException = {
                    url,
                    timeWindows
                };

                if (currentIndex >= 0) {
                    // Editar exceção existente
                    exceptions[currentIndex] = newException;
                } else {
                    // Adicionar nova exceção
                    exceptions.push(newException);
                }

                return browser.runtime.sendMessage({
                    action: "updateConfig",
                    exceptionUrls: exceptions
                });
            })
            .then(response => {
                if (response.success) {
                    ModalModule.closeModal(exceptionModal);
                    ToastModule.showSuccessToast(currentIndex >= 0 ?
                        "Exceção atualizada com sucesso!" :
                        "Exceção adicionada com sucesso!");

                    // Recarregar a tabela
                    browser.runtime.sendMessage({ action: "getConfig" })
                        .then(config => {
                            initTable(config.exceptionUrls);
                        });
                } else {
                    ToastModule.showErrorToast("Erro ao salvar exceção: " + response.error);
                }
            })
            .catch(error => {
                console.error("Erro ao salvar exceção:", error);
                ToastModule.showErrorToast("Erro ao salvar exceção: " + error);
            });
    };

    // API pública do módulo
    return {
        init,
        initTable,
        setupTableListeners,
        openAddExceptionModal,
        openEditExceptionModal,
        saveException
    };
})();

export default ExceptionTableModule;