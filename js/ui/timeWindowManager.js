/**
 * Módulo para gerenciar janelas de tempo na interface
 */
import TimeUtils from '../modules/timeUtils.js';

const TimeWindowManager = (() => {
    /**
     * Adiciona uma nova janela de tempo ao formulário
     * @param {HTMLElement} container - Container onde a janela será adicionada
     * @param {Object} timeWindow - Janela de tempo existente (opcional)
     */
    const addTimeWindow = (container, timeWindow = null) => {
        const windowItem = document.createElement('div');
        windowItem.className = 'time-window-item';

        // Checkboxes para os dias da semana
        const daysDiv = document.createElement('div');
        daysDiv.className = 'days-selection';

        TimeUtils.dayNames.forEach((dayName, dayIndex) => {
            const dayLabel = document.createElement('label');
            dayLabel.className = 'day-checkbox';

            const dayCheckbox = document.createElement('input');
            dayCheckbox.type = 'checkbox';
            dayCheckbox.name = `day-${dayIndex}`;
            dayCheckbox.value = dayIndex;

            // Marcar checkbox se este dia estiver na janela de tempo
            if (timeWindow && timeWindow.days.includes(dayIndex)) {
                dayCheckbox.checked = true;
            }

            dayLabel.appendChild(dayCheckbox);
            dayLabel.appendChild(document.createTextNode(` ${dayName}`));

            daysDiv.appendChild(dayLabel);
        });

        windowItem.appendChild(daysDiv);

        // Inputs para horário de início e fim
        const timeInputsDiv = document.createElement('div');
        timeInputsDiv.className = 'time-inputs';

        const startLabel = document.createElement('label');
        startLabel.textContent = 'Das:';

        const startInput = document.createElement('input');
        startInput.type = 'number';
        startInput.min = '0';
        startInput.max = '23.99';
        startInput.step = '0.01';
        startInput.name = 'startHour';
        startInput.value = timeWindow ? timeWindow.startHour : '8';

        const endLabel = document.createElement('label');
        endLabel.textContent = 'Às:';

        const endInput = document.createElement('input');
        endInput.type = 'number';
        endInput.min = '0';
        endInput.max = '23.99';
        endInput.step = '0.01';
        endInput.name = 'endHour';
        endInput.value = timeWindow ? timeWindow.endHour : '17';

        timeInputsDiv.appendChild(startLabel);
        timeInputsDiv.appendChild(startInput);
        timeInputsDiv.appendChild(endLabel);
        timeInputsDiv.appendChild(endInput);

        windowItem.appendChild(timeInputsDiv);

        // Botão para remover esta janela de tempo
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Remover';
        removeButton.className = 'delete';
        removeButton.onclick = () => {
            windowItem.remove();
        };

        windowItem.appendChild(removeButton);

        container.appendChild(windowItem);
    };

    /**
     * Coleta as janelas de tempo de um container
     * @param {HTMLElement} container - Container com as janelas de tempo
     * @returns {Array} Lista de janelas de tempo
     * @throws {Error} Erro se alguma janela de tempo for inválida
     */
    const collectTimeWindows = (container) => {
        const timeWindows = [];
        const timeWindowItems = container.querySelectorAll('.time-window-item');

        for (const item of timeWindowItems) {
            const days = [];
            const dayCheckboxes = item.querySelectorAll('input[type="checkbox"]:checked');

            dayCheckboxes.forEach(checkbox => {
                days.push(parseInt(checkbox.value));
            });

            if (days.length === 0) {
                throw new Error("Cada janela de tempo deve ter pelo menos um dia selecionado.");
            }

            const startHour = parseFloat(item.querySelector('input[name="startHour"]').value);
            const endHour = parseFloat(item.querySelector('input[name="endHour"]').value);

            if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
                throw new Error("Horários inválidos. O horário de início deve ser menor que o horário de fim.");
            }

            timeWindows.push({
                days,
                startHour,
                endHour
            });
        }

        return timeWindows;
    };

    // API pública do módulo
    return {
        addTimeWindow,
        collectTimeWindows
    };
})();

export default TimeWindowManager;