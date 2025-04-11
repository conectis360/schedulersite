/**
 * Módulo para gerenciar a tabela de notas na página de opções
 */
import ToastModule from './ToastModule.js';
import ModalModule from './ModalModule.js';

const SiteNotesTableModule = (() => {
    // Variável para armazenar a instância do DataTable
    let siteNotesTable;

    /**
     * Inicializa o módulo
     */
    const init = () => {
        // Verificar se a tabela existe no DOM
        if (!document.getElementById('siteNotesTable')) {
            console.log("Elemento siteNotesTable não encontrado, criando seção de notas");
            createNotesSection();
        }

        loadSiteNotes();
    };

    /**
     * Cria a seção de notas no DOM se não existir
     */
    const createNotesSection = () => {
        const notesSection = document.createElement('div');
        notesSection.className = 'section';
        notesSection.innerHTML = `
            <h2>Notas de Sites</h2>
            <p>Gerencie suas notas adesivas para diferentes sites.</p>
            
            <table id="siteNotesTable" class="display" style="width: 100%">
                <thead>
                    <tr>
                        <th>Domínio</th>
                        <th>Número de Notas</th>
                        <th>Última Atualização</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Dados serão preenchidos via JavaScript -->
                </tbody>
            </table>
        `;

        // Inserir antes da seção de importação/exportação
        const importExportSection = document.getElementById('importExport');
        if (importExportSection) {
            importExportSection.parentNode.insertBefore(notesSection, importExportSection);
        } else {
            document.body.appendChild(notesSection);
        }
    };

    /**
     * Carrega as notas de todos os sites
     */
    const loadSiteNotes = () => {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const siteNotes = config.siteNotes || [];
                initTable(siteNotes);
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
                ToastModule.showErrorToast("Erro ao carregar notas: " + error);
            });
    };

    /**
     * Inicializa a tabela de notas
     * @param {Array} siteNotes - Lista de notas por site
     */
    const initTable = (siteNotes) => {
        // Verificar se a tabela existe
        const tableElement = document.getElementById('siteNotesTable');
        if (!tableElement) {
            console.error("Elemento siteNotesTable não encontrado");
            return;
        }

        // Destruir tabela existente se houver
        if (siteNotesTable) {
            siteNotesTable.destroy();
        }

        // Preparar dados para a tabela
        const tableData = siteNotes.map((site, index) => {
            // Encontrar a nota mais recente
            const latestNote = site.notes.reduce((latest, note) => {
                return new Date(note.updatedAt) > new Date(latest.updatedAt) ? note : latest;
            }, { updatedAt: '1970-01-01T00:00:00Z' });

            // Formatar data
            const lastUpdated = new Date(latestNote.updatedAt).toLocaleString();

            return [
                site.domain,
                site.notes.length,
                lastUpdated,
                `<div class="action-buttons">
                    <button class="view-notes-btn" data-domain="${site.domain}">Ver Notas</button>
                    <button class="delete-notes-btn delete" data-domain="${site.domain}">Excluir Todas</button>
                </div>`
            ];
        });

        // Inicializar DataTable
        siteNotesTable = jQuery('#siteNotesTable').DataTable({
            data: tableData,
            columns: [
                { title: "Domínio" },
                { title: "Número de Notas" },
                { title: "Última Atualização" },
                { title: "Ações", width: "150px" }
            ],
            language: {
                "sEmptyTable": "Nenhuma nota encontrada",
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
                { targets: 3, orderable: false } // Desabilitar ordenação na coluna de ações
            ]
        });
    };

    /**
     * Configura os listeners para os botões de ação na tabela
     */
    const setupTableListeners = () => {
        jQuery('#siteNotesTable').on('click', '.view-notes-btn', function () {
            const domain = jQuery(this).data('domain');
            openViewNotesModal(domain);
        });

        jQuery('#siteNotesTable').on('click', '.delete-notes-btn', function () {
            const domain = jQuery(this).data('domain');
            openDeleteNotesModal(domain);
        });
    };

    /**
     * Abre um modal para visualizar as notas de um domínio
     * @param {string} domain - Domínio para visualizar as notas
     */
    const openViewNotesModal = (domain) => {
        browser.runtime.sendMessage({
            action: "getSiteNotes",
            domain: domain
        })
            .then(response => {
                // Implementar modal para visualizar notas
                // Este é um exemplo simplificado
                alert(`Notas para ${domain}:\n\n${response.notes.map(note => note.text).join('\n\n')
                    }`);
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
                ToastModule.showErrorToast("Erro ao carregar notas: " + error);
            });
    };

    /**
     * Abre um modal para confirmar a exclusão de todas as notas de um domínio
     * @param {string} domain - Domínio para excluir as notas
     */
    const openDeleteNotesModal = (domain) => {
        if (confirm(`Tem certeza que deseja excluir todas as notas para ${domain}?`)) {
            browser.runtime.sendMessage({
                action: "deleteSiteNotes",
                domain: domain
            })
                .then(response => {
                    if (response.success) {
                        ToastModule.showSuccessToast(`Notas para ${domain} excluídas com sucesso!`);
                        loadSiteNotes(); // Recarregar a tabela
                    } else {
                        ToastModule.showErrorToast("Erro ao excluir notas: " + response.error);
                    }
                })
                .catch(error => {
                    console.error("Erro ao excluir notas:", error);
                    ToastModule.showErrorToast("Erro ao excluir notas: " + error);
                });
        }
    };

    // API pública do módulo
    return {
        init,
        loadSiteNotes,
        setupTableListeners
    };
})();

export default SiteNotesTableModule;