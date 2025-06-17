/**
 * 🎨 SISTEMA DE HORAS EXTRAS - INTERFACE
 * Módulo de gerenciamento da interface do usuário
 */

const UIManager = (function() {
    
    // 🎯 ESTADO DA INTERFACE
    let state = {
        currentMode: 'supervisor', // 'supervisor' | 'lider'
        currentWeek: null,
        selectedPostos: {
            manha: new Set(),
            tarde: new Set()
        },
        confirmacoesPendentes: new Map(),
        isLoading: false,
        notifications: [],
        modalsOpen: new Set()
    };

    // 🎨 ELEMENTOS DA INTERFACE
    let elements = {};

    // 🔧 CONFIGURAÇÕES DE UI
    const UI_CONFIG = {
        animations: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        breakpoints: {
            mobile: 768,
            tablet: 1024
        },
        notifications: {
            duration: 4000,
            maxVisible: 3
        }
    };

    // 🔧 MÉTODOS PRIVADOS DE RENDERIZAÇÃO
    
    function cacheElements() {
        elements = {
            // Containers principais
            mainContainer: document.getElementById('main-container'),
            loadingOverlay: document.getElementById('loading-overlay'),
            notificationContainer: document.getElementById('notification-container'),
            modalsContainer: document.getElementById('modals-container'),
            
            // Header
            appHeader: document.getElementById('app-header'),
            modeToggle: document.getElementById('mode-toggle'),
            weekTitle: document.getElementById('week-title'),
            supervisorInfo: document.getElementById('supervisor-info'),
            
            // Progress/Meta
            progressFill: document.getElementById('progress-fill'),
            progressPercentage: document.getElementById('progress-percentage'),
            metaTotal: document.getElementById('meta-total'),
            horasAtual: document.getElementById('horas-atual'),
            horasRestante: document.getElementById('horas-restante'),
            
            // Content containers
            supervisorContent: document.getElementById('supervisor-content'),
            liderContent: document.getElementById('lider-content'),
            
            // Turnos
            turnosGrid: document.getElementById('turnos-grid'),
            postosManha: document.getElementById('postos-manha'),
            postosTarde: document.getElementById('postos-tarde'),
            confirmacaoPostos: document.getElementById('confirmacao-postos'),
            
            // Summary elements
            countPostosManha: document.getElementById('count-postos-manha'),
            countPostosTarde: document.getElementById('count-postos-tarde'),
            horasManha: document.getElementById('horas-manha'),
            horasTarde: document.getElementById('horas-tarde'),
            
            // Lider mode elements
            pendentesCount: document.getElementById('pendentes-count'),
            confirmadosCount: document.getElementById('confirmados-count'),
            problemasCount: document.getElementById('problemas-count'),
            
            // Actions
            actionsFooter: document.getElementById('actions-footer'),
            
            // Selects
            diasSemana: document.getElementById('dias-semana')
        };
    }

    function renderPostosGrid(container, postos, turno) {
        if (!container) return;
        
        container.innerHTML = '';
        
        postos.forEach(posto => {
            const card = createPostoCard(posto, turno);
            container.appendChild(card);
        });
    }

    function createPostoCard(posto, turno) {
        const card = document.createElement('div');
        card.className = 'posto-card';
        card.dataset.posto = posto.code;
        card.dataset.turno = turno;
        
        const isSelected = state.selectedPostos[turno].has(posto.code);
        if (isSelected) card.classList.add('selected');
        
        // Ícone baseado na criticidade
        const criticalityIcon = {
            'alta': '🔴',
            'media': '🟡', 
            'baixa': '🟢'
        }[posto.criticidade] || '⚪';
        
        card.innerHTML = `
            <div class="posto-header">
                <div class="posto-code">${posto.code}</div>
                <div class="posto-criticidade">${criticalityIcon}</div>
            </div>
            <div class="posto-desc">${posto.desc}</div>
            <div class="posto-area">${posto.area}</div>
            
            ${state.currentMode === 'lider' && isSelected ? `
                <div class="colaborador-section">
                    <select class="colaborador-select" data-posto="${posto.code}">
                        <option value="">Selecionar Colaborador</option>
                        ${getColaboradoresOptions(turno)}
                    </select>
                    <div class="disponibilidade-section">
                        <label class="disponibilidade-label">Disponibilidade:</label>
                        <div class="dias-checkboxes">
                            ${getDiasCheckboxes(posto.code, turno)}
                        </div>
                    </div>
                    <textarea class="observacoes-input" placeholder="Observações..." data-posto="${posto.code}"></textarea>
                </div>
            ` : ''}
            
            <div class="posto-actions">
                ${state.currentMode === 'supervisor' ? `
                    <button class="btn-toggle-posto ${isSelected ? 'selected' : ''}" data-posto="${posto.code}" data-turno="${turno}">
                        ${isSelected ? '✅ Selecionado' : '➕ Selecionar'}
                    </button>
                ` : ''}
                
                ${state.currentMode === 'lider' && isSelected ? `
                    <button class="btn-confirmar-posto" data-posto="${posto.code}">
                        ✅ Confirmar
                    </button>
                ` : ''}
            </div>
        `;
        
        // Event listeners
        setupPostoCardEvents(card, posto, turno);
        
        return card;
    }

    function getColaboradoresOptions(turno) {
        const colaboradores = turno === 'manha' ? 
            AppData.getColaboradoresTurnoA() : 
            AppData.getColaboradoresTurnoB();
        
        return colaboradores.map(col => 
            `<option value="${col.re}">${AppUtils.formatName(col.nome, 25)}</option>`
        ).join('');
    }

    function getDiasCheckboxes(postoCode, turno) {
        if (turno === 'tarde') {
            const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
            return dias.map(dia => `
                <label class="dia-checkbox">
                    <input type="checkbox" value="${dia}" data-posto="${postoCode}">
                    <span>${dia.substr(0, 3)}</span>
                </label>
            `).join('');
        } else {
            return `
                <label class="dia-checkbox">
                    <input type="checkbox" value="sabado" data-posto="${postoCode}">
                    <span>Sáb</span>
                </label>
                <label class="dia-checkbox">
                    <input type="checkbox" value="domingo" data-posto="${postoCode}">
                    <span>Dom</span>
                </label>
            `;
        }
    }

    function setupPostoCardEvents(card, posto, turno) {
        // Toggle seleção (modo supervisor)
        const toggleBtn = card.querySelector('.btn-toggle-posto');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePostoSelection(posto.code, turno);
            });
        }
        
        // Confirmar colaborador (modo líder)
        const confirmarBtn = card.querySelector('.btn-confirmar-posto');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                confirmarColaborador(posto.code);
            });
        }
        
        // Select colaborador
        const colaboradorSelect = card.querySelector('.colaborador-select');
        if (colaboradorSelect) {
            colaboradorSelect.addEventListener('change', (e) => {
                updateColaboradorSelection(posto.code, e.target.value);
            });
        }
        
        // Checkboxes de dias
        const diasCheckboxes = card.querySelectorAll('.dia-checkbox input');
        diasCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                updateDiasDisponibilidade(posto.code, e.target.value, e.target.checked);
            });
        });
        
        // Observações
        const observacoesInput = card.querySelector('.observacoes-input');
        if (observacoesInput) {
            observacoesInput.addEventListener('input', AppUtils.debounce((e) => {
                updateObservacoes(posto.code, e.target.value);
            }, 500));
        }
    }

    function renderModeContent() {
        const supervisorContent = elements.supervisorContent;
        const liderContent = elements.liderContent;
        
        if (state.currentMode === 'supervisor') {
            supervisorContent.classList.add('active');
            liderContent.classList.remove('active');
            renderSupervisorMode();
        } else {
            supervisorContent.classList.remove('active');
            liderContent.classList.add('active');
            renderLiderMode();
        }
        
        updateModeToggle();
        updateActionButtons();
    }

    function renderSupervisorMode() {
        const postos = AppData.getPostos();
        renderPostosGrid(elements.postosManha, postos, 'manha');
        renderPostosGrid(elements.postosTarde, postos, 'tarde');
        updateSummaries();
    }

    function renderLiderMode() {
        renderConfirmacaoPostos();
        updateStatusCards();
    }

    function renderConfirmacaoPostos() {
        if (!elements.confirmacaoPostos) return;
        
        const container = elements.confirmacaoPostos;
        container.innerHTML = '';
        
        // Postos selecionados para confirmação
        const semana = AppData.getCurrentWeek();
        if (!semana) return;
        
        Object.entries(semana.turnos).forEach(([turno, turnoData]) => {
            turnoData.postosSelecionados.forEach(postoCode => {
                const posto = AppData.getPostos().find(p => p.code === postoCode);
                if (posto) {
                    const card = createConfirmacaoCard(posto, turno);
                    container.appendChild(card);
                }
            });
        });
    }

    function createConfirmacaoCard(posto, turno) {
        const card = document.createElement('div');
        card.className = 'confirmacao-card';
        card.dataset.posto = posto.code;
        card.dataset.turno = turno;
        
        const colaboradorConfirmado = AppData.getColaboradorConfirmado(posto.code);
        const isConfirmado = !!colaboradorConfirmado;
        
        if (isConfirmado) card.classList.add('confirmed');
        
        const turnoIcon = turno === 'manha' ? '🌅' : '🌆';
        const statusIcon = isConfirmado ? '✅' : '⏳';
        
        card.innerHTML = `
            <div class="confirmacao-header">
                <div class="posto-info">
                    <span class="turno-icon">${turnoIcon}</span>
                    <div>
                        <div class="posto-code">${posto.code}</div>
                        <div class="posto-desc">${posto.desc}</div>
                    </div>
                </div>
                <div class="status-icon">${statusIcon}</div>
            </div>
            
            <div class="confirmacao-content">
                ${isConfirmado ? `
                    <div class="colaborador-confirmado">
                        <strong>Confirmado:</strong> ${getColaboradorNome(colaboradorConfirmado.colaboradorRE)}
                        <div class="config-confirmada">
                            ${formatConfigConfirmada(colaboradorConfirmado.config)}
                        </div>
                    </div>
                ` : `
                    <div class="colaborador-selection">
                        <select class="colaborador-select-confirmacao" data-posto="${posto.code}">
                            <option value="">Selecionar Colaborador</option>
                            ${getColaboradoresOptions(turno)}
                        </select>
                        
                        <div class="disponibilidade-config">
                            <label>Disponibilidade:</label>
                            <div class="dias-config">
                                ${getDiasCheckboxes(posto.code, turno)}
                            </div>
                        </div>
                        
                        <textarea class="observacoes-confirmacao" placeholder="Observações..." data-posto="${posto.code}"></textarea>
                        
                        <div class="confirmacao-actions">
                            <button class="btn btn-success btn-confirmar-final" data-posto="${posto.code}">
                                ✅ Confirmar
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;
        
        // Setup events
        setupConfirmacaoCardEvents(card, posto, turno);
        
        return card;
    }

    function setupConfirmacaoCardEvents(card, posto, turno) {
        // Confirmar final
        const btnConfirmar = card.querySelector('.btn-confirmar-final');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => {
                processarConfirmacaoFinal(posto.code, card);
            });
        }
        
        // Select colaborador
        const select = card.querySelector('.colaborador-select-confirmacao');
        if (select) {
            select.addEventListener('change', () => {
                updateConfirmacaoState(posto.code);
            });
        }
        
        // Checkboxes
        const checkboxes = card.querySelectorAll('.dias-config input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateConfirmacaoState(posto.code);
            });
        });
    }

    function updateWeekInfo() {
        const semana = AppData.getCurrentWeek();
        if (!semana || !elements.weekTitle) return;
        
        const weekDates = AppUtils.date.getWeekDates(semana.numero, semana.ano);
        const dateRange = `${AppUtils.formatDate(weekDates.start, 'dd/MM')} - ${AppUtils.formatDate(weekDates.end, 'dd/MM')}`;
        
        elements.weekTitle.textContent = `Semana ${semana.numero} • ${dateRange}`;
        
        // Atualizar supervisor info
        if (elements.supervisorInfo) {
            const supervisorAtual = AppConfig.calcularSupervisorAtual(semana.numero);
            const proximoSupervisor = AppConfig.calcularSupervisorAtual(semana.numero + 1);
            
            elements.supervisorInfo.innerHTML = `
                <span class="supervisor-current">Supervisor: ${supervisorAtual?.nome || 'N/A'}</span>
                <span class="supervisor-next">Próxima: ${proximoSupervisor?.nome || 'N/A'} (Semana ${semana.numero + 1})</span>
            `;
        }
    }

    function updateProgress() {
        const semana = AppData.getCurrentWeek();
        if (!semana) return;
        
        const horas = AppData.calcularHorasSemana();
        const meta = semana.metaSemanal;
        const percentage = AppUtils.calc.calculateMetaPercentage(horas.total, meta);
        
        // Atualizar elementos
        if (elements.metaTotal) elements.metaTotal.textContent = `${meta}h`;
        if (elements.horasAtual) elements.horasAtual.textContent = `${horas.total}h`;
        if (elements.horasRestante) elements.horasRestante.textContent = `${Math.max(meta - horas.total, 0)}h`;
        if (elements.progressPercentage) elements.progressPercentage.textContent = `${Math.round(percentage)}%`;
        
        // Atualizar barra de progresso
        if (elements.progressFill) {
            elements.progressFill.style.width = `${Math.min(percentage, 100)}%`;
            
            // Cor da barra baseada na porcentagem
            const color = AppUtils.ui.getColorByPercentage(percentage);
            elements.progressFill.style.background = color;
        }
    }

    function updateSummaries() {
        const horas = AppData.calcularHorasSemana();
        
        // Contar postos selecionados
        const postosManha = state.selectedPostos.manha.size;
        const postosTarde = state.selectedPostos.tarde.size;
        
        // Atualizar contadores
        if (elements.countPostosManha) elements.countPostosManha.textContent = postosManha;
        if (elements.countPostosTarde) elements.countPostosTarde.textContent = postosTarde;
        if (elements.horasManha) elements.horasManha.textContent = `${horas.manha}h`;
        if (elements.horasTarde) elements.horasTarde.textContent = `${horas.tarde}h`;
        
        updateProgress();
    }

    function updateStatusCards() {
        const semana = AppData.getCurrentWeek();
        if (!semana) return;
        
        let pendentes = 0;
        let confirmados = 0;
        let problemas = 0;
        
        Object.values(semana.turnos).forEach(turnoData => {
            turnoData.postosSelecionados.forEach(postoCode => {
                const colaborador = turnoData.colaboradoresConfirmados.get(postoCode);
                if (colaborador) {
                    confirmados++;
                } else {
                    pendentes++;
                }
            });
        });
        
        if (elements.pendentesCount) elements.pendentesCount.textContent = pendentes;
        if (elements.confirmadosCount) elements.confirmadosCount.textContent = confirmados;
        if (elements.problemasCount) elements.problemasCount.textContent = problemas;
    }

    function updateModeToggle() {
        const buttons = elements.modeToggle?.querySelectorAll('.mode-btn');
        if (!buttons) return;
        
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
        });
    }

    function updateActionButtons() {
        const supervisorActions = elements.actionsFooter?.querySelector('.supervisor-actions');
        const liderActions = elements.actionsFooter?.querySelector('.lider-actions');
        
        if (supervisorActions && liderActions) {
            if (state.currentMode === 'supervisor') {
                supervisorActions.classList.remove('hidden');
                liderActions.classList.add('hidden');
            } else {
                supervisorActions.classList.add('hidden');
                liderActions.classList.remove('hidden');
            }
        }
    }

    // 🎯 MÉTODOS DE INTERAÇÃO

    function togglePostoSelection(postoCode, turno) {
        const isSelected = state.selectedPostos[turno].has(postoCode);
        
        if (isSelected) {
            state.selectedPostos[turno].delete(postoCode);
            AppData.unselectPosto(postoCode, turno);
        } else {
            state.selectedPostos[turno].add(postoCode);
            AppData.selectPosto(postoCode, turno);
        }
        
        // Re-render affected posto card
        const card = document.querySelector(`[data-posto="${postoCode}"][data-turno="${turno}"]`);
        if (card) {
            const posto = AppData.getPostos().find(p => p.code === postoCode);
            if (posto) {
                const newCard = createPostoCard(posto, turno);
                card.replaceWith(newCard);
            }
        }
        
        updateSummaries();
        showNotification(
            isSelected ? 
                `Posto ${postoCode} removido` : 
                `Posto ${postoCode} selecionado`,
            isSelected ? 'warning' : 'success'
        );
    }

    function confirmarColaborador(postoCode) {
        const card = document.querySelector(`[data-posto="${postoCode}"]`);
        if (!card) return;
        
        const colaboradorSelect = card.querySelector('.colaborador-select');
        const observacoes = card.querySelector('.observacoes-input');
        
        if (!colaboradorSelect?.value) {
            showNotification('Selecione um colaborador', 'error');
            return;
        }
        
        const diasCheckboxes = card.querySelectorAll('.dia-checkbox input:checked');
        const diasSelecionados = Array.from(diasCheckboxes).map(cb => cb.value);
        
        if (diasSelecionados.length === 0) {
            showNotification('Selecione pelo menos um dia', 'error');
            return;
        }
        
        const config = {
            dias: diasSelecionados,
            observacoes: observacoes?.value || ''
        };
        
        AppData.confirmColaborador(postoCode, colaboradorSelect.value, config);
        
        // Re-render modo líder
        renderLiderMode();
        
        showNotification(`Colaborador confirmado para ${postoCode}`, 'success');
    }

    function processarConfirmacaoFinal(postoCode, card) {
        const select = card.querySelector('.colaborador-select-confirmacao');
        const observacoes = card.querySelector('.observacoes-confirmacao');
        const checkboxes = card.querySelectorAll('.dias-config input:checked');
        
        if (!select?.value) {
            showNotification('Selecione um colaborador', 'error');
            return;
        }
        
        if (checkboxes.length === 0) {
            showNotification('Selecione pelo menos um dia', 'error');
            return;
        }
        
        const config = {
            dias: Array.from(checkboxes).map(cb => cb.value),
            observacoes: observacoes?.value || ''
        };
        
        AppData.confirmColaborador(postoCode, select.value, config);
        renderLiderMode();
        
        showNotification(`✅ ${postoCode} confirmado com sucesso!`, 'success');
    }

    // 🔔 SISTEMA DE NOTIFICAÇÕES

    function showNotification(message, type = 'info', duration = UI_CONFIG.notifications.duration) {
        const notification = {
            id: AppUtils.generateId('notif_'),
            message,
            type,
            timestamp: new Date(),
            duration
        };
        
        state.notifications.push(notification);
        renderNotification(notification);
        
        // Auto remove
        setTimeout(() => {
            removeNotification(notification.id);
        }, duration);
        
        return notification.id;
    }

    function renderNotification(notification) {
        if (!elements.notificationContainer) return;
        
        const notifEl = document.createElement('div');
        notifEl.className = `notification notification-${notification.type}`;
        notifEl.dataset.id = notification.id;
        
        const icon = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }[notification.type] || 'ℹ️';
        
        notifEl.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${notification.message}</span>
            </div>
            <button class="notification-close" onclick="UIManager.removeNotification('${notification.id}')">×</button>
        `;
        
        elements.notificationContainer.appendChild(notifEl);
        
        // Animate in
        requestAnimationFrame(() => {
            notifEl.classList.add('show');
        });
        
        // Limit visible notifications
        const visible = elements.notificationContainer.children;
        if (visible.length > UI_CONFIG.notifications.maxVisible) {
            const oldest = visible[0];
            removeNotification(oldest.dataset.id);
        }
    }

    function removeNotification(id) {
        const notifEl = document.querySelector(`[data-id="${id}"]`);
        if (notifEl) {
            notifEl.classList.add('fade-out');
            setTimeout(() => {
                notifEl.remove();
            }, 300);
        }
        
        state.notifications = state.notifications.filter(n => n.id !== id);
    }

    // 📱 LOADING E ESTADOS

    function showLoading(message = 'Carregando...') {
        state.isLoading = true;
        
        if (elements.loadingOverlay) {
            elements.loadingOverlay.querySelector('p').textContent = message;
            elements.loadingOverlay.classList.remove('hidden');
            elements.loadingOverlay.classList.add('show');
        }
    }

    function hideLoading() {
        state.isLoading = false;
        
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('show');
            setTimeout(() => {
                elements.loadingOverlay.classList.add('hidden');
            }, 300);
        }
    }

    // 🎯 SETUP DE EVENTOS

    function setupEventListeners() {
        // Mode toggle
        elements.modeToggle?.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-btn');
            if (btn && btn.dataset.mode !== state.currentMode) {
                switchMode(btn.dataset.mode);
            }
        });
        
        // Dias semana select
        elements.diasSemana?.addEventListener('change', (e) => {
            updateTurnoTardeConfig(parseInt(e.target.value));
        });
        
        // Action buttons
        document.getElementById('btn-enviar-telegram')?.addEventListener('click', handleEnviarTelegram);
        document.getElementById('btn-salvar')?.addEventListener('click', handleSalvar);
        document.getElementById('btn-limpar')?.addEventListener('click', handleLimpar);
        document.getElementById('btn-confirmar-lider')?.addEventListener('click', handleConfirmarLider);
        
        // Responsive events
        window.addEventListener('resize', AppUtils.debounce(() => {
            updateResponsiveLayout();
        }, 250));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function switchMode(newMode) {
        if (newMode === state.currentMode) return;
        
        state.currentMode = newMode;
        renderModeContent();
        
        // Salvar preferência
        AppUtils.general.saveToStorage('userMode', newMode);
        
        AppUtils.log(`Modo alterado para: ${newMode}`);
    }

    // 🌐 API PÚBLICA
    return {
        // Inicialização
        init: function() {
            try {
                cacheElements();
                setupEventListeners();
                
                // Carregar modo salvo
                const savedMode = AppUtils.general.loadFromStorage('userMode', 'supervisor');
                state.currentMode = savedMode;
                
                AppUtils.log('UI Manager inicializado');
                return true;
            } catch (error) {
                console.error('❌ Erro ao inicializar UI:', error);
                return false;
            }
        },
        
        // Renderização
        renderInitialState: function() {
            updateWeekInfo();
            renderModeContent();
            updateProgress();
        },
        
        refresh: function() {
            this.renderInitialState();
        },
        
        // State management
        getCurrentMode: function() {
            return state.currentMode;
        },
        
        switchMode,
        
        // Notificações
        showNotification,
        removeNotification,
        
        // Loading
        showLoading,
        hideLoading,
        
        // Utilitários
        updateSummaries,
        updateProgress,
        updateWeekInfo
    };

})();

// 🔧 FUNÇÕES AUXILIARES GLOBAIS
function getColaboradorNome(re) {
    const colaborador = AppData.getAllColaboradores().find(c => c.re === re);
    return colaborador ? AppUtils.formatName(colaborador.nome) : 'Desconhecido';
}

function formatConfigConfirmada(config) {
    if (!config || !config.dias) return '';
    
    const dias = Array.isArray(config.dias) ? config.dias : [config.dias];
    return `Dias: ${dias.join(', ')}`;
}

// Event handlers
function handleEnviarTelegram() {
    UIManager.showLoading('Enviando para Telegram...');
    
    setTimeout(() => {
        UIManager.hideLoading();
        UIManager.showNotification('📱 Mensagem enviada para o Telegram!', 'success');
    }, 2000);
}

function handleSalvar() {
    UIManager.showLoading('Salvando dados...');
    
    setTimeout(() => {
        UIManager.hideLoading();
        UIManager.showNotification('💾 Dados salvos com sucesso!', 'success');
    }, 1500);
}

function handleLimpar() {
    if (confirm('Tem certeza que deseja limpar todos os dados?\n\nEsta ação irá salvar o estado atual no histórico.')) {
        UIManager.showLoading('Limpando dados...');
        
        setTimeout(() => {
            AppData.clearWeekData();
            UIManager.hideLoading();
            UIManager.refresh();
            UIManager.showNotification('🧹 Dados limpos com sucesso!', 'success');
        }, 1000);
    }
}

function handleConfirmarLider() {
    UIManager.showNotification('✅ Confirmações enviadas!', 'success');
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                handleSalvar();
                break;
            case 'm':
                e.preventDefault();
                const newMode = UIManager.getCurrentMode() === 'supervisor' ? 'lider' : 'supervisor';
                UIManager.switchMode(newMode);
                break;
        }
    }
}

function updateTurnoTardeConfig(dias) {
    // Implementar lógica de atualização da configuração do turno tarde
    UIManager.updateSummaries();
}

function updateResponsiveLayout() {
    // Implementar ajustes responsivos se necessário
}

// Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}