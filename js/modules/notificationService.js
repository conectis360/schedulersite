/**
 * Módulo para gerenciar notificações
 */
const NotificationService = (() => {
    // Armazenar os timers de notificação
    let notificationTimers = [];

    /**
     * Inicializa o serviço de notificações
     */
    const init = () => {
        // Limpar timers existentes
        clearAllTimers();

        // Verificar permissões de notificação
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // Configurar verificação periódica
        scheduleNotificationChecks();
    };

    /**
     * Limpa todos os timers de notificação
     */
    const clearAllTimers = () => {
        notificationTimers.forEach(timer => clearTimeout(timer));
        notificationTimers = [];
    };

    /**
     * Agenda verificações periódicas para notificações
     */
    const scheduleNotificationChecks = () => {
        // Verificar imediatamente
        checkForUpcomingFreeTime();

        // Verificar a cada 15 minutos
        const checkInterval = 15 * 60 * 1000; // 15 minutos em milissegundos
        setInterval(checkForUpcomingFreeTime, checkInterval);
    };

    /**
     * Verifica se há horários livres próximos
     */
    const checkForUpcomingFreeTime = () => {
        browser.runtime.sendMessage({ action: "getConfig" })
            .then(config => {
                const now = new Date();
                const currentDay = now.getDay();
                const currentHour = now.getHours() + (now.getMinutes() / 60);

                // Verificar cada domínio bloqueado
                config.blockedDomains.forEach(domain => {
                    if (!domain.timeWindows || domain.timeWindows.length === 0) {
                        // Sempre bloqueado, não precisa notificar
                        return;
                    }

                    // Verificar cada janela de tempo
                    domain.timeWindows.forEach(window => {
                        if (window.days.includes(currentDay)) {
                            // Se estamos dentro de uma janela de bloqueio
                            if (currentHour >= window.startHour && currentHour < window.endHour) {
                                // Calcular quanto tempo falta para o fim do bloqueio
                                const minutesUntilFree = Math.round((window.endHour - currentHour) * 60);

                                // Se falta menos de 30 minutos, agendar notificação
                                if (minutesUntilFree <= 30 && minutesUntilFree > 0) {
                                    scheduleNotification(
                                        domain.title || domain.domain,
                                        minutesUntilFree
                                    );
                                }
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao verificar horários livres:", error);
            });
    };

    /**
     * Agenda uma notificação para um domínio específico
     * @param {string} domainTitle - Título ou nome do domínio
     * @param {number} minutesUntilFree - Minutos até ficar livre
     */
    const scheduleNotification = (domainTitle, minutesUntilFree) => {
        // Criar um ID único para esta notificação
        const notificationId = `${domainTitle}-${minutesUntilFree}`;

        // Verificar se já temos uma notificação agendada para este domínio
        if (notificationTimers[notificationId]) {
            return;
        }

        // Agendar notificação para 1 minuto antes do fim do bloqueio
        const timeToNotify = (minutesUntilFree - 1) * 60 * 1000;

        if (timeToNotify <= 0) {
            return;
        }

        notificationTimers[notificationId] = setTimeout(() => {
            showNotification(
                "Acesso liberado em breve",
                `${domainTitle} estará disponível em 1 minuto!`
            );
            delete notificationTimers[notificationId];
        }, timeToNotify);
    };

    /**
     * Exibe uma notificação
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     */
    const showNotification = (title, message) => {
        // Verificar permissão
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
            return;
        }

        // Criar e exibir notificação
        const notification = new Notification(title, {
            body: message,
            icon: '/images/icon48.png'
        });

        // Fechar automaticamente após 10 segundos
        setTimeout(() => notification.close(), 10000);

        // Evento de clique na notificação
        notification.onclick = () => {
            notification.close();
        };
    };

    // API pública do módulo
    return {
        init,
        showNotification
    };
})();

export default NotificationService;