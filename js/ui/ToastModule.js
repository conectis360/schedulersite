/**
 * Módulo para gerenciar notificações toast
 */
const ToastModule = (() => {
    /**
     * Exibe uma notificação toast
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de toast (info, success, error)
     * @param {number} duration - Duração em milissegundos
     * @returns {HTMLElement} Elemento do toast criado
     */
    const showToast = (message, type = 'info', duration = 3000) => {
        const toastContainer = document.getElementById('toastContainer');

        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Conteúdo do toast
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);

        // Botão de fechar
        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            removeToast(toast);
        });
        toast.appendChild(closeButton);

        // Adicionar ao container
        toastContainer.appendChild(toast);

        // Mostrar o toast (com delay para permitir a animação)
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Configurar remoção automática
        setTimeout(() => {
            removeToast(toast);
        }, duration);

        return toast;
    };

    /**
     * Remove um toast com animação
     * @param {HTMLElement} toast - Elemento do toast a ser removido
     */
    const removeToast = (toast) => {
        // Remover classe show para iniciar animação de saída
        toast.classList.remove('show');

        // Remover elemento após a animação
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    /**
     * Exibe um toast de sucesso
     * @param {string} message - Mensagem a ser exibida
     * @param {number} duration - Duração em milissegundos
     * @returns {HTMLElement} Elemento do toast criado
     */
    const showSuccessToast = (message, duration = 3000) => {
        return showToast(message, 'success', duration);
    };

    /**
     * Exibe um toast de erro
     * @param {string} message - Mensagem a ser exibida
     * @param {number} duration - Duração em milissegundos
     * @returns {HTMLElement} Elemento do toast criado
     */
    const showErrorToast = (message, duration = 4000) => {
        return showToast(message, 'error', duration);
    };

    /**
     * Exibe um toast informativo
     * @param {string} message - Mensagem a ser exibida
     * @param {number} duration - Duração em milissegundos
     * @returns {HTMLElement} Elemento do toast criado
     */
    const showInfoToast = (message, duration = 3000) => {
        return showToast(message, 'info', duration);
    };

    // API pública do módulo
    return {
        showToast,
        showSuccessToast,
        showErrorToast,
        showInfoToast
    };
})();

export default ToastModule;