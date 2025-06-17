/**
 * 🔔 SISTEMA DE HORAS EXTRAS - NOTIFICAÇÕES
 * Módulo para gerenciamento de notificações, alertas e feedback visual
 */

const NotificationSystem = (function() {
    
    // 🎯 ESTADO DAS NOTIFICAÇÕES
    let state = {
        notifications: new Map(),
        queue: [],
        container: null,
        config: {
            maxVisible: 3,
            defaultDuration: 4000,
            animationDuration: 300,
            stackSpacing: 10,
            position: 'top-right'
        },
        sounds: new Map(),
        initialized: false
    };

    // 🎨 TIPOS DE NOTIFICAÇÃO
    const NOTIFICATION_TYPES = {
        success: {
            icon: '✅',
            color: '#27ae60',
            sound: 'success',
            className: 'notification-success',
            defaultDuration: 3000
        },
        error: {
            icon: '❌',
            color: '#e74c3c',
            sound: 'error',
            className: 'notification-error',
            defaultDuration: 5000
        },
        warning: {
            icon: '⚠️',
            color: '#f39c12',
            sound: 'warning',
            className: 'notification-warning',
            defaultDuration: 4000
        },
        info: {
            icon: 'ℹ️',
            color: '#3498db',
            sound: 'info',
            className: 'notification-info',
            defaultDuration: 3000
        },
        loading: {
            icon: '⏳',
            color: '#95a5a6',
            sound: null,
            className: 'notification-loading',
            defaultDuration: null // Persiste até ser removida manualmente
        },
        telegram: {
            icon: '📱',
            color: '#0088cc',
            sound: 'telegram',
            className: 'notification-telegram',
            defaultDuration: 3000
        },
        supervisor: {
            icon: '👔',
            color: '#8e44ad',
            sound: 'notification',
            className: 'notification-supervisor',
            defaultDuration: 4000
        },
        colaborador: {
            icon: '👤',
            color: '#2ecc71',
            sound: 'notification',
            className: 'notification-colaborador',
            defaultDuration: 3000
        }
    };

    // 🔧 CONFIGURAÇÕES DE SOM
    const SOUND_CONFIG = {
        enabled: true,
        volume: 0.3,
        sounds: {
            success: { frequency: 800, duration: 200, type: 'sine' },
            error: { frequency: 300, duration: 400, type: 'square' },
            warning: { frequency: 600, duration: 300, type: 'triangle' },
            info: { frequency: 500, duration: 150, type: 'sine' },
            telegram: { frequency: 1000, duration: 100, type: 'sine', repeat: 2 },
            notification: { frequency: 700, duration: 200, type: 'sine' }
        }
    };

    // 🔧 TEMPLATES DE NOTIFICAÇÃO
    const NOTIFICATION_TEMPLATES = {
        postoSelecionado: (posto) => ({
            type: 'success',
            title: 'Posto Selecionado',
            message: `${posto} adicionado às horas extras`,
            actions: [
                { text: 'Desfazer', action: 'undo', data: { posto } }
            ]
        }),
        
        colaboradorConfirmado: (colaborador, posto) => ({
            type: 'colaborador',
            title: 'Colaborador Confirmado',
            message: `${colaborador} confirmado para ${posto}`,
            actions: [
                { text: 'Ver Detalhes', action: 'view', data: { colaborador, posto } }
            ]
        }),
        
        metaAtingida: (percentual) => ({
            type: 'warning',
            title: 'Meta Semanal',
            message: `${percentual}% da meta atingida`,
            persistent: true,
            actions: [
                { text: 'Ver Relatório', action: 'report' }
            ]
        }),
        
        telegramEnviado: (tipo) => ({
            type: 'telegram',
            title: 'Telegram',
            message: `${tipo} enviado com sucesso`,
            duration: 2000
        }),
        
        erroSistema: (erro) => ({
            type: 'error',
            title: 'Erro do Sistema',
            message: erro,
            persistent: true,
            actions: [
                { text: 'Tentar Novamente', action: 'retry' },
                { text: 'Reportar', action: 'report' }
            ]
        }),
        
        backupCriado: () => ({
            type: 'info',
            title: 'Backup',
            message: 'Backup automático criado',
            duration: 2000
        })
    };

    // 🔧 MÉTODOS PRIVADOS

    function createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-system-container';
        container.className = `notification-container position-${state.config.position}`;
        document.body.appendChild(container);
        return container;
    }

    function createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.className}`;
        element.setAttribute('data-id', notification.id);
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');

        // Estrutura da notificação
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon" style="color: ${notification.color}">${notification.icon}</span>
                    ${notification.title ? `<span class="notification-title">${notification.title}</span>` : ''}
                    <button class="notification-close" aria-label="Fechar notificação">×</button>
                </div>
                <div class="notification-body">
                    <span class="notification-message">${notification.message}</span>
                    ${notification.progress !== undefined ? `
                        <div class="notification-progress">
                            <div class="progress-bar" style="width: ${notification.progress}%"></div>
                        </div>
                    ` : ''}
                </div>
                ${notification.actions && notification.actions.length > 0 ? `
                    <div class="notification-actions">
                        ${notification.actions.map(action => `
                            <button class="notification-action" data-action="${action.action}" ${action.data ? `data-action-data='${JSON.stringify(action.data)}'` : ''}>
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            ${notification.type === 'loading' ? `
                <div class="notification-spinner">
                    <div class="spinner"></div>
                </div>
            ` : ''}
        `;

        // Event listeners
        setupNotificationEvents(element, notification);

        return element;
    }

    function setupNotificationEvents(element, notification) {
        // Botão fechar
        const closeBtn = element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                remove(notification.id);
            });
        }

        // Botões de ação
        const actionBtns = element.querySelectorAll('.notification-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const data = btn.getAttribute('data-action-data');
                
                handleNotificationAction(notification.id, action, data ? JSON.parse(data) : null);
            });
        });

        // Auto-close no hover (pausar timer)
        let autoCloseTimer = null;
        
        if (notification.duration && !notification.persistent) {
            const startAutoClose = () => {
                autoCloseTimer = setTimeout(() => {
                    remove(notification.id);
                }, notification.duration);
            };

            const pauseAutoClose = () => {
                if (autoCloseTimer) {
                    clearTimeout(autoCloseTimer);
                    autoCloseTimer = null;
                }
            };

            element.addEventListener('mouseenter', pauseAutoClose);
            element.addEventListener('mouseleave', startAutoClose);
            
            // Iniciar timer
            startAutoClose();
        }

        // Swipe to dismiss (mobile)
        if (AppUtils.isMobile()) {
            setupSwipeGesture(element, notification);
        }
    }

    function setupSwipeGesture(element, notification) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            element.style.transition = 'none';
        });

        element.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Só permite swipe para a direita
            if (deltaX > 0) {
                element.style.transform = `translateX(${deltaX}px)`;
                element.style.opacity = 1 - (deltaX / 200);
            }
        });

        element.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            isDragging = false;
            const deltaX = currentX - startX;
            
            element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            
            if (deltaX > 100) {
                // Swipe suficiente para remover
                element.style.transform = 'translateX(100%)';
                element.style.opacity = '0';
                setTimeout(() => remove(notification.id), 300);
            } else {
                // Voltar à posição original
                element.style.transform = 'translateX(0)';
                element.style.opacity = '1';
            }
        });
    }

    function handleNotificationAction(notificationId, action, data) {
        const notification = state.notifications.get(notificationId);
        if (!notification) return;

        // Eventos customizados para ações
        const event = new CustomEvent('notificationAction', {
            detail: { notificationId, action, data, notification }
        });
        document.dispatchEvent(event);

        // Ações padrão
        switch (action) {
            case 'undo':
                // Implementar lógica de desfazer
                break;
            case 'view':
                // Abrir detalhes
                break;
            case 'retry':
                // Tentar novamente
                break;
            case 'report':
                // Abrir relatório
                break;
        }

        // Remover notificação após ação (exceto se persistente)
        if (!notification.persistent) {
            remove(notificationId);
        }
    }

    function positionNotifications() {
        const notifications = Array.from(state.container.children);
        
        notifications.forEach((element, index) => {
            const offset = index * (element.offsetHeight + state.config.stackSpacing);
            element.style.transform = `translateY(${offset}px)`;
            element.style.zIndex = 1000 - index;
        });
    }

    function playSound(soundType) {
        if (!SOUND_CONFIG.enabled || !soundType) return;
        
        const soundConfig = SOUND_CONFIG.sounds[soundType];
        if (!soundConfig) return;

        try {
            // Usar Web Audio API para sons customizados
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(soundConfig.frequency, audioContext.currentTime);
            oscillator.type = soundConfig.type;

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(SOUND_CONFIG.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + soundConfig.duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + soundConfig.duration / 1000);

            // Sons com repetição
            if (soundConfig.repeat && soundConfig.repeat > 1) {
                for (let i = 1; i < soundConfig.repeat; i++) {
                    setTimeout(() => playSound(soundType), i * (soundConfig.duration + 100));
                }
            }
        } catch (error) {
            console.warn('Erro ao reproduzir som:', error);
        }
    }

    function processQueue() {
        if (state.queue.length === 0) return;
        
        const visibleCount = state.container.children.length;
        
        if (visibleCount < state.config.maxVisible) {
            const notification = state.queue.shift();
            showNotification(notification);
            
            // Processar próximo item da queue
            setTimeout(processQueue, 100);
        }
    }

    function showNotification(notification) {
        const element = createNotificationElement(notification);
        
        // Adicionar ao container
        state.container.appendChild(element);
        
        // Animar entrada
        requestAnimationFrame(() => {
            element.classList.add('notification-enter');
            positionNotifications();
        });

        // Reproduzir som
        const type = NOTIFICATION_TYPES[notification.type];
        if (type && type.sound) {
            playSound(type.sound);
        }

        // Registrar no histórico
        if (typeof HistoricoManager !== 'undefined' && HistoricoManager.isInitialized()) {
            HistoricoManager.registrar('NOTIFICACAO_EXIBIDA', {
                tipo: notification.type,
                titulo: notification.title,
                mensagem: notification.message
            });
        }
    }

    function remove(id) {
        const notification = state.notifications.get(id);
        if (!notification) return false;

        const element = state.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('notification-exit');
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                    positionNotifications();
                    
                    // Processar queue se houver itens pendentes
                    processQueue();
                }
            }, state.config.animationDuration);
        }

        state.notifications.delete(id);
        
        // Disparar evento
        document.dispatchEvent(new CustomEvent('notificationRemoved', {
            detail: { id, notification }
        }));

        return true;
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function(config = {}) {
            try {
                // Merge configurações
                state.config = { ...state.config, ...config };
                
                // Criar container
                state.container = createContainer();
                
                // Configurar sons baseado nas preferências do usuário
                const soundPreference = AppUtils.general.loadFromStorage('notificationSounds', true);
                SOUND_CONFIG.enabled = soundPreference;
                
                state.initialized = true;
                
                AppUtils.log('Sistema de Notificações inicializado');
                return true;
            } catch (error) {
                AppUtils.log(`Erro ao inicializar notificações: ${error.message}`, 'error');
                return false;
            }
        },

        // 📢 Mostrar Notificações
        show: function(options) {
            if (typeof options === 'string') {
                options = { message: options };
            }

            const notification = {
                id: AppUtils.generateId('notif_'),
                type: options.type || 'info',
                title: options.title || null,
                message: options.message || 'Notificação',
                duration: options.duration,
                persistent: options.persistent || false,
                actions: options.actions || [],
                progress: options.progress,
                data: options.data || {},
                timestamp: new Date().toISOString(),
                ...NOTIFICATION_TYPES[options.type || 'info']
            };

            // Usar duração padrão se não especificada
            if (notification.duration === undefined) {
                notification.duration = notification.defaultDuration;
            }

            // Adicionar ao estado
            state.notifications.set(notification.id, notification);

            // Verificar limite de notificações visíveis
            const visibleCount = state.container.children.length;
            
            if (visibleCount >= state.config.maxVisible) {
                // Adicionar à queue
                state.queue.push(notification);
            } else {
                // Mostrar imediatamente
                showNotification(notification);
            }

            return notification.id;
        },

        // 📢 Métodos de Conveniência
        success: function(message, options = {}) {
            return this.show({ ...options, type: 'success', message });
        },

        error: function(message, options = {}) {
            return this.show({ ...options, type: 'error', message });
        },

        warning: function(message, options = {}) {
            return this.show({ ...options, type: 'warning', message });
        },

        info: function(message, options = {}) {
            return this.show({ ...options, type: 'info', message });
        },

        loading: function(message, options = {}) {
            return this.show({ 
                ...options, 
                type: 'loading', 
                message: message || 'Carregando...',
                persistent: true 
            });
        },

        telegram: function(message, options = {}) {
            return this.show({ ...options, type: 'telegram', message });
        },

        // 📢 Templates Predefinidos
        fromTemplate: function(templateName, ...args) {
            const template = NOTIFICATION_TEMPLATES[templateName];
            if (!template) {
                throw new Error(`Template não encontrado: ${templateName}`);
            }

            const notificationOptions = template(...args);
            return this.show(notificationOptions);
        },

        // 🔄 Gerenciamento
        update: function(id, updates) {
            const notification = state.notifications.get(id);
            if (!notification) return false;

            // Atualizar objeto
            Object.assign(notification, updates);

            // Atualizar elemento visual
            const element = state.container.querySelector(`[data-id="${id}"]`);
            if (element) {
                if (updates.message) {
                    const messageEl = element.querySelector('.notification-message');
                    if (messageEl) messageEl.textContent = updates.message;
                }

                if (updates.progress !== undefined) {
                    const progressEl = element.querySelector('.progress-bar');
                    if (progressEl) progressEl.style.width = `${updates.progress}%`;
                }

                if (updates.title) {
                    const titleEl = element.querySelector('.notification-title');
                    if (titleEl) titleEl.textContent = updates.title;
                }
            }

            return true;
        },

        remove: remove,

        removeAll: function() {
            const ids = Array.from(state.notifications.keys());
            ids.forEach(id => this.remove(id));
            state.queue = [];
            return ids.length;
        },

        removeByType: function(type) {
            let removed = 0;
            state.notifications.forEach((notification, id) => {
                if (notification.type === type) {
                    this.remove(id);
                    removed++;
                }
            });
            return removed;
        },

        // ⚙️ Configurações
        setConfig: function(newConfig) {
            state.config = { ...state.config, ...newConfig };
            
            // Aplicar configurações
            if (newConfig.position && state.container) {
                state.container.className = `notification-container position-${newConfig.position}`;
            }
            
            return state.config;
        },

        setSoundEnabled: function(enabled) {
            SOUND_CONFIG.enabled = enabled;
            AppUtils.general.saveToStorage('notificationSounds', enabled);
        },

        getSoundEnabled: function() {
            return SOUND_CONFIG.enabled;
        },

        // 📊 Informações
        getActive: function() {
            return Array.from(state.notifications.values());
        },

        getQueue: function() {
            return [...state.queue];
        },

        getStats: function() {
            return {
                active: state.notifications.size,
                queued: state.queue.length,
                total: state.notifications.size + state.queue.length,
                maxVisible: state.config.maxVisible
            };
        },

        // 🔧 Utilitários
        isInitialized: function() {
            return state.initialized;
        },

        getTypes: function() {
            return Object.keys(NOTIFICATION_TYPES);
        },

        getTemplates: function() {
            return Object.keys(NOTIFICATION_TEMPLATES);
        },

        // 🧪 Testes (apenas desenvolvimento)
        test: function() {
            if (!AppConfig.isDevelopment()) return;

            console.log('🧪 Testando sistema de notificações...');
            
            // Testar todos os tipos
            Object.keys(NOTIFICATION_TYPES).forEach((type, index) => {
                setTimeout(() => {
                    this.show({
                        type,
                        title: `Teste ${type}`,
                        message: `Esta é uma notificação de teste do tipo ${type}`,
                        actions: type === 'error' ? [
                            { text: 'Tentar Novamente', action: 'retry' },
                            { text: 'Cancelar', action: 'cancel' }
                        ] : undefined
                    });
                }, index * 1000);
            });
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}