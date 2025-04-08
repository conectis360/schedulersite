/**
 * Módulo para gerenciar modais
 */
const ModalModule = (() => {
    /**
     * Abre um modal
     * @param {HTMLElement} modal - Elemento do modal a ser aberto
     */
    const openModal = (modal) => {
        modal.style.display = 'block';
    };

    /**
     * Fecha um modal
     * @param {HTMLElement} modal - Elemento do modal a ser fechado
     */
    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    /**
     * Configura os listeners para fechar modais
     * @param {Array} modals - Lista de elementos de modais
     */
    const setupModalClosers = (modals) => {
        // Fechar modais ao clicar no X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                modals.forEach(modal => {
                    closeModal(modal);
                });
            });
        });

        // Fechar modais ao clicar fora deles
        window.addEventListener('click', (event) => {
            modals.forEach(modal => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });
    };

    // API pública do módulo
    return {
        openModal,
        closeModal,
        setupModalClosers
    };
})();

export default ModalModule;