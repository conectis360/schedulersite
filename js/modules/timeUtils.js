/**
 * Módulo para funções relacionadas a tempo e janelas de tempo
 */
const TimeUtils = (() => {
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    /**
     * Verifica se o horário atual está dentro de uma janela de tempo
     * @param {Array} timeWindows - Lista de janelas de tempo
     * @returns {boolean} Verdadeiro se estiver dentro de alguma janela de tempo
     */
    const isWithinTimeWindow = (timeWindows) => {
        if (!timeWindows || timeWindows.length === 0) {
            return true; // Se não houver janelas de tempo, está sempre bloqueado
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0-6 (domingo-sábado)
        const currentHour = now.getHours() + (now.getMinutes() / 60); // Hora atual com fração

        return timeWindows.some(window => {
            return window.days.includes(currentDay) &&
                currentHour >= window.startHour &&
                currentHour < window.endHour;
        });
    };

    /**
     * Formata janelas de tempo para exibição ao usuário
     * @param {Array} timeWindows - Lista de janelas de tempo
     * @returns {string} String formatada com as janelas de tempo
     */
    const formatTimeWindows = (timeWindows) => {
        if (!timeWindows || timeWindows.length === 0) {
            return "Sempre bloqueado";
        }

        return timeWindows.map(window => {
            const days = window.days.map(d => dayNames[d]).join(", ");
            const start = Math.floor(window.startHour) + ":" +
                (window.startHour % 1 ? Math.round((window.startHour % 1) * 60).toString().padStart(2, '0') : "00");
            const end = Math.floor(window.endHour) + ":" +
                (window.endHour % 1 ? Math.round((window.endHour % 1) * 60).toString().padStart(2, '0') : "00");

            return `${days} das ${start} às ${end}`;
        }).join("<br>");
    };

    /**
     * Valida uma janela de tempo
     * @param {Object} timeWindow - Janela de tempo a ser validada
     * @returns {boolean} Verdadeiro se a janela de tempo for válida
     */
    const validateTimeWindow = (timeWindow) => {
        if (!timeWindow.days || !Array.isArray(timeWindow.days) || timeWindow.days.length === 0) {
            return false;
        }

        if (isNaN(timeWindow.startHour) || isNaN(timeWindow.endHour) ||
            timeWindow.startHour < 0 || timeWindow.startHour >= 24 ||
            timeWindow.endHour <= 0 || timeWindow.endHour > 24 ||
            timeWindow.startHour >= timeWindow.endHour) {
            return false;
        }

        return true;
    };

    // API pública do módulo
    return {
        isWithinTimeWindow,
        formatTimeWindows,
        validateTimeWindow,
        dayNames
    };
})();

export default TimeUtils;