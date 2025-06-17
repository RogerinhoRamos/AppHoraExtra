/**
 * 📊 SISTEMA DE HORAS EXTRAS - INTEGRAÇÃO GOOGLE SHEETS
 * Módulo para sincronização com Google Sheets usando Apps Script
 */

const SheetsIntegration = (function() {
    
    // 🎯 ESTADO DA INTEGRAÇÃO
    let state = {
        spreadsheetId: '',
        scriptUrl: '',
        isConfigured: false,
        lastSync: null,
        syncInProgress: false,
        syncQueue: [],
        connectionStatus: 'disconnected',
        rateLimitInfo: {
            requestsPerMinute: 0,
            lastReset: Date.now(),
            maxRequestsPerMinute: 100
        },
        initialized: false
    };

    // 📋 MAPEAMENTO DE RANGES
    const SHEET_RANGES = {
        turnoA: 'L.H.E Turno A!A:M',
        turnoB: 'L.H.E Turno B!A:M', 
        historico: 'Histórico Hora Extra!A:N',
        postos: 'Postos!A:B',
        colaboradoresA: 'Colaboradores A!A:B',
        colaboradoresB: 'Colaboradores B!A:B',
        relatorio: 'Relatório!A:Z',
        configuracao: 'Config!A:Z'
    };

    // ⚙️ CONFIGURAÇÕES DE SINCRONIZAÇÃO
    const SYNC_CONFIG = {
        autoSync: true,
        syncInterval: 300000, // 5 minutos
        batchSize: 100,
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
    };

    // 📊 ESTRUTURA DE DADOS PARA SINCRONIZAÇÃO
    const DATA_MAPPERS = {
        turnoData: (semana, turno) => {
            const turnoData = semana.turnos[turno];
            const colaboradores = turno === 'manha' ? 
                AppData.getColaboradoresTurnoA() : 
                AppData.getColaboradoresTurnoB();
            
            const rows = [];
            
            // Cabeçalho (se necessário)
            const header = [
                'Selecione Posto',
                'Descrição Posto', 
                'Selecione Colaborador',
                'RE',
                'H.E. Noturno?',
                'H.E. Sábado?',
                'H. E. Domingo?',
                'H.E Feriado?',
                'T.otal Horas',
                'Data',
                'Semana'
            ];

            // Dados dos postos
            AppData.getPostos().forEach((posto, index) => {
                const isSelecionado = turnoData.postosSelecionados.has(posto.code);
                const colaboradorInfo = turnoData.colaboradoresConfirmados.get(posto.code);
                
                const row = [
                    isSelecionado ? posto.code : '',
                    posto.desc,
                    colaboradorInfo ? getColaboradorNome(colaboradorInfo.colaboradorRE) : '',
                    colaboradorInfo ? colaboradorInfo.colaboradorRE : '',
                    // Configurações específicas baseadas no turno
                    turno === 'tarde' && colaboradorInfo ? 'Sim' : 'Não', // H.E. Noturno
                    turno === 'manha' && semana.turnos.manha.configuracoes.sabado.ativo ? 'Sim' : 'Não',
                    turno === 'manha' && semana.turnos.manha.configuracoes.domingo.ativo ? 'Sim' : 'Não',
                    'Não', // H.E Feriado (implementar depois)
                    colaboradorInfo ? calcularHorasColaborador(colaboradorInfo, turno, semana) : '',
                    colaboradorInfo ? formatDateForSheets(new Date()) : '',
                    semana.numero
                ];
                
                rows.push(row);
            });

            return rows;
        },

        historicoData: (registros) => {
            return registros.map(registro => [
                formatDateForSheets(new Date(registro.timestamp)),
                registro.detalhes.posto || '',
                registro.detalhes.descricao || '',
                registro.detalhes.colaborador || '',
                registro.detalhes.re || '',
                registro.detalhes.heNoturno ? 'Sim' : 'Não',
                registro.detalhes.heSabado ? 'Sim' : 'Não',
                registro.detalhes.heDomingo ? 'Sim' : 'Não',
                registro.detalhes.heFeriado ? 'Sim' : 'Não',
                registro.detalhes.totalHoras || '',
                formatDateForSheets(new Date(registro.detalhes.data || registro.timestamp)),
                `Semana ${registro.semana}`,
                registro.tipo
            ]);
        },

        relatorioData: (stats) => {
            const semana = AppData.getCurrentWeek();
            const horas = TurnosManager.calcularHorasSemana();
            
            return [
                ['Relatório de Horas Extras'],
                [`Semana ${semana.numero}`, formatDateForSheets(new Date())],
                [''],
                ['Resumo Geral'],
                ['Total de Horas', horas.total],
                ['Horas Manhã', horas.manha], 
                ['Horas Tarde', horas.tarde],
                ['Meta Semanal', semana.metaSemanal],
                ['Utilização (%)', Math.round((horas.total / semana.metaSemanal) * 100)],
                [''],
                ['Detalhes por Turno'],
                ['Turno', 'Supervisor', 'Postos', 'Horas'],
                ['Manhã', stats.turnos.manha.supervisor, stats.turnos.manha.postos, stats.turnos.manha.horas],
                ['Tarde', stats.turnos.tarde.supervisor, stats.turnos.tarde.postos, stats.turnos.tarde.horas]
            ];
        }
    };

    // 🔧 MÉTODOS PRIVADOS

    function getColaboradorNome(re) {
        const colaborador = AppData.getAllColaboradores().find(c => c.re === re);
        return colaborador ? colaborador.nome : '';
    }

    function calcularHorasColaborador(colaboradorInfo, turno, semana) {
        // Lógica simplificada - expandir conforme necessário
        if (turno === 'manha') {
            let total = 0;
            if (semana.turnos.manha.configuracoes.sabado.ativo) {
                total += 3;
            }
            if (semana.turnos.manha.configuracoes.domingo.ativo) {
                total += 7;
            }
            return total;
        } else {
            const dias = colaboradorInfo.config?.dias?.length || 0;
            return dias * 2.5;
        }
    }

    function formatDateForSheets(date) {
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    }

    function checkRateLimit() {
        const now = Date.now();
        
        if (now - state.rateLimitInfo.lastReset > 60000) {
            state.rateLimitInfo.requestsPerMinute = 0;
            state.rateLimitInfo.lastReset = now;
        }
        
        return state.rateLimitInfo.requestsPerMinute < state.rateLimitInfo.maxRequestsPerMinute;
    }

    function incrementRateLimit() {
        state.rateLimitInfo.requestsPerMinute++;
    }

    async function makeScriptRequest(action, params = {}, retryCount = 0) {
        if (!state.isConfigured) {
            throw new Error('Google Sheets não configurado');
        }

        if (!checkRateLimit()) {
            throw new Error('Rate limit excedido');
        }

        try {
            state.connectionStatus = 'connecting';
            
            const requestData = {
                action: action,
                ...params
            };

            const response = await fetch(state.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                mode: 'cors'
            });

            incrementRateLimit();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(`Apps Script Error: ${data.error}`);
            }

            state.connectionStatus = 'connected';
            state.lastSync = new Date().toISOString();
            
            return data.result;

        } catch (error) {
            state.connectionStatus = 'error';
            
            if (retryCount < SYNC_CONFIG.retryAttempts) {
                const delay = SYNC_CONFIG.retryDelay * Math.pow(2, retryCount);
                AppUtils.log(`Tentativa ${retryCount + 1} falhou. Retry em ${delay}ms...`, 'warn');
                
                await AppUtils.general.sleep(delay);
                return makeScriptRequest(action, params, retryCount + 1);
            }
            
            throw error;
        }
    }

    async function syncTurnoData(turno) {
        const semana = AppData.getCurrentWeek();
        if (!semana) {
            throw new Error('Nenhuma semana ativa');
        }

        const data = DATA_MAPPERS.turnoData(semana, turno);
        const range = turno === 'manha' ? SHEET_RANGES.turnoA : SHEET_RANGES.turnoB;
        
        return makeScriptRequest('updateRange', {
            range: range,
            values: data
        });
    }

    async function syncHistoricoData() {
        const historico = HistoricoManager.obterRecentes(100);
        const data = DATA_MAPPERS.historicoData(historico.registros);
        
        return makeScriptRequest('appendToRange', {
            range: SHEET_RANGES.historico,
            values: data
        });
    }

    async function processSync() {
        if (state.syncInProgress || state.syncQueue.length === 0) return;
        
        state.syncInProgress = true;
        
        try {
            const operation = state.syncQueue.shift();
            
            switch (operation.type) {
                case 'turno':
                    await syncTurnoData(operation.turno);
                    break;
                case 'historico':
                    await syncHistoricoData();
                    break;
                case 'relatorio':
                    await syncRelatorio();
                    break;
                case 'full':
                    await fullSync();
                    break;
            }
            
            AppUtils.log(`Sincronização ${operation.type} concluída`);
            
            // Registrar no histórico
            if (typeof HistoricoManager !== 'undefined') {
                HistoricoManager.registrar('SHEETS_SINCRONIZADO', {
                    tipo: operation.type,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            AppUtils.log(`Erro na sincronização: ${error.message}`, 'error');
            
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.error(`Erro na sincronização: ${error.message}`);
            }
        } finally {
            state.syncInProgress = false;
            
            // Processar próximo item da queue
            setTimeout(processSync, 1000);
        }
    }

    async function fullSync() {
        AppUtils.log('Iniciando sincronização completa...');
        
        const operations = [
            { type: 'turno', turno: 'manha' },
            { type: 'turno', turno: 'tarde' },
            { type: 'historico' },
            { type: 'relatorio' }
        ];

        for (const operation of operations) {
            try {
                switch (operation.type) {
                    case 'turno':
                        await syncTurnoData(operation.turno);
                        break;
                    case 'historico':
                        await syncHistoricoData();
                        break;
                    case 'relatorio':
                        await syncRelatorio();
                        break;
                }
                
                // Delay entre operações
                await AppUtils.general.sleep(500);
                
            } catch (error) {
                AppUtils.log(`Erro na sincronização ${operation.type}: ${error.message}`, 'error');
            }
        }
        
        AppUtils.log('Sincronização completa finalizada');
    }

    async function syncRelatorio() {
        const stats = TurnosManager.getEstatisticasTurnos();
        const data = DATA_MAPPERS.relatorioData(stats);
        
        return makeScriptRequest('updateRange', {
            range: SHEET_RANGES.relatorio,
            values: data
        });
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function(config = {}) {
            try {
                // Configurar URLs se fornecidas
                if (config.spreadsheetId) {
                    state.spreadsheetId = config.spreadsheetId;
                }
                
                if (config.scriptUrl) {
                    state.scriptUrl = config.scriptUrl;
                    state.isConfigured = true;
                }

                // Tentar carregar configuração salva
                const savedConfig = AppUtils.general.loadFromStorage('sheets_config');
                if (savedConfig) {
                    if (savedConfig.spreadsheetId) {
                        state.spreadsheetId = savedConfig.spreadsheetId;
                    }
                    if (savedConfig.scriptUrl) {
                        state.scriptUrl = savedConfig.scriptUrl;
                        state.isConfigured = true;
                    }
                }

                state.initialized = true;
                
                // Configurar listeners
                this.setupEventListeners();
                
                // Configurar sincronização automática
                if (SYNC_CONFIG.autoSync && state.isConfigured) {
                    this.startAutoSync();
                }
                
                AppUtils.log('Integração Google Sheets inicializada');
                
                // Testar conexão se configurado
                if (state.isConfigured) {
                    this.testConnection();
                }
                
                return true;
            } catch (error) {
                AppUtils.log(`Erro ao inicializar Google Sheets: ${error.message}`, 'error');
                return false;
            }
        },

        // ⚙️ Configuração
        configure: function(spreadsheetId, scriptUrl) {
            if (!spreadsheetId || !scriptUrl) {
                throw new Error('SpreadsheetId e ScriptUrl são obrigatórios');
            }

            state.spreadsheetId = spreadsheetId;
            state.scriptUrl = scriptUrl;
            state.isConfigured = true;
            
            // Salvar configuração
            const config = { spreadsheetId, scriptUrl };
            AppUtils.general.saveToStorage('sheets_config', config);
            
            // Testar conexão
            return this.testConnection();
        },

        // 🔗 Teste de Conexão
        testConnection: async function() {
            if (!state.isConfigured) {
                throw new Error('Google Sheets não configurado');
            }

            try {
                const result = await makeScriptRequest('test');
                
                AppUtils.log('Conexão com Google Sheets bem-sucedida');
                
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.success('Conectado ao Google Sheets');
                }
                
                return {
                    success: true,
                    result: result
                };
                
            } catch (error) {
                AppUtils.log(`Erro ao testar conexão Google Sheets: ${error.message}`, 'error');
                
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.error('Erro na conexão com Google Sheets');
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        // 📤 Sincronização Manual
        syncTurno: function(turno) {
            state.syncQueue.push({ type: 'turno', turno: turno });
            setTimeout(processSync, 100);
        },

        syncHistorico: function() {
            state.syncQueue.push({ type: 'historico' });
            setTimeout(processSync, 100);
        },

        syncRelatorio: function() {
            state.syncQueue.push({ type: 'relatorio' });
            setTimeout(processSync, 100);
        },

        syncAll: function() {
            state.syncQueue.push({ type: 'full' });
            setTimeout(processSync, 100);
        },

        // 📥 Leitura de Dados
        readRange: async function(range) {
            return makeScriptRequest('readRange', { range });
        },

        readTurnoData: async function(turno) {
            const range = turno === 'manha' ? SHEET_RANGES.turnoA : SHEET_RANGES.turnoB;
            return this.readRange(range);
        },

        readHistorico: async function() {
            return this.readRange(SHEET_RANGES.historico);
        },

        // 📝 Escrita de Dados
        writeRange: async function(range, values) {
            return makeScriptRequest('updateRange', { range, values });
        },

        appendToHistorico: async function(data) {
            return makeScriptRequest('appendToRange', {
                range: SHEET_RANGES.historico,
                values: [data]
            });
        },

        // 🔄 Sincronização Automática
        startAutoSync: function() {
            if (this.autoSyncInterval) {
                clearInterval(this.autoSyncInterval);
            }
            
            this.autoSyncInterval = setInterval(() => {
                if (state.isConfigured && !state.syncInProgress) {
                    this.syncAll();
                }
            }, SYNC_CONFIG.syncInterval);
            
            AppUtils.log('Sincronização automática iniciada');
        },

        stopAutoSync: function() {
            if (this.autoSyncInterval) {
                clearInterval(this.autoSyncInterval);
                this.autoSyncInterval = null;
                AppUtils.log('Sincronização automática parada');
            }
        },

        // 📊 Backup e Restore
        createBackup: async function() {
            try {
                const backup = {
                    timestamp: new Date().toISOString(),
                    semana: AppData.getCurrentWeek(),
                    historico: HistoricoManager.obterRecentes(1000),
                    configuracao: TurnosManager.exportarConfiguracao()
                };
                
                const result = await makeScriptRequest('createBackup', { data: backup });
                
                AppUtils.log('Backup criado com sucesso');
                return result;
                
            } catch (error) {
                AppUtils.log(`Erro ao criar backup: ${error.message}`, 'error');
                throw error;
            }
        },

        restoreBackup: async function(backupId) {
            try {
                const backup = await makeScriptRequest('restoreBackup', { backupId });
                
                // Restaurar dados locais
                if (backup.semana) {
                    AppData.importWeekData(backup.semana);
                }
                
                if (backup.configuracao) {
                    TurnosManager.importarConfiguracao(backup.configuracao);
                }
                
                AppUtils.log('Backup restaurado com sucesso');
                return backup;
                
            } catch (error) {
                AppUtils.log(`Erro ao restaurar backup: ${error.message}`, 'error');
                throw error;
            }
        },

        // 🎯 Event Listeners
        setupEventListeners: function() {
            // Sincronizar quando dados importantes mudam
            document.addEventListener('postoSelecionado', () => {
                if (SYNC_CONFIG.autoSync) {
                    // Debounce para evitar muitas chamadas
                    clearTimeout(this.syncDebounceTimer);
                    this.syncDebounceTimer = setTimeout(() => {
                        this.syncAll();
                    }, 2000);
                }
            });

            document.addEventListener('colaboradorConfirmado', () => {
                if (SYNC_CONFIG.autoSync) {
                    clearTimeout(this.syncDebounceTimer);
                    this.syncDebounceTimer = setTimeout(() => {
                        this.syncAll();
                    }, 2000);
                }
            });

            document.addEventListener('turnoConfigurado', () => {
                if (SYNC_CONFIG.autoSync) {
                    this.syncAll();
                }
            });

            document.addEventListener('dadosLimpos', () => {
                if (SYNC_CONFIG.autoSync) {
                    this.syncAll();
                }
            });

            // Sincronização antes de fechar a página
            window.addEventListener('beforeunload', () => {
                if (state.isConfigured) {
                    // Sincronização síncrona rápida
                    navigator.sendBeacon(state.scriptUrl, JSON.stringify({
                        action: 'quickSync',
                        data: AppData.exportWeekData()
                    }));
                }
            });
        },

        // 📊 Relatórios Avançados
        generateWeeklyReport: async function() {
            const stats = TurnosManager.getEstatisticasTurnos();
            const semana = AppData.getCurrentWeek();
            const historico = HistoricoManager.obterPorSemana(semana.numero, 100);
            
            const reportData = {
                cabecalho: {
                    titulo: `Relatório Semanal - Semana ${semana.numero}`,
                    periodo: `${AppUtils.formatDate(semana.dataInicio)} - ${AppUtils.formatDate(semana.dataFim)}`,
                    geradoEm: formatDateForSheets(new Date()),
                    supervisor: stats.supervisor.nome
                },
                resumo: stats,
                detalhes: {
                    historico: historico.registros.length,
                    eventos: historico.registros.map(r => [
                        formatDateForSheets(new Date(r.timestamp)),
                        r.tipo,
                        r.usuario,
                        r.descricao
                    ])
                }
            };
            
            return makeScriptRequest('generateReport', { data: reportData });
        },

        // 📊 Informações
        getStatus: function() {
            return {
                configured: state.isConfigured,
                connectionStatus: state.connectionStatus,
                lastSync: state.lastSync,
                syncInProgress: state.syncInProgress,
                queueSize: state.syncQueue.length,
                autoSyncEnabled: !!this.autoSyncInterval,
                rateLimitInfo: {
                    requestsThisMinute: state.rateLimitInfo.requestsPerMinute,
                    maxRequestsPerMinute: state.rateLimitInfo.maxRequestsPerMinute
                }
            };
        },

        getConfig: function() {
            return {
                spreadsheetId: state.spreadsheetId,
                hasScriptUrl: !!state.scriptUrl,
                ranges: SHEET_RANGES,
                syncConfig: SYNC_CONFIG
            };
        },

        // 🔧 Utilitários
        isConfigured: function() {
            return state.isConfigured;
        },

        isInitialized: function() {
            return state.initialized;
        },

        clearQueue: function() {
            const clearedCount = state.syncQueue.length;
            state.syncQueue = [];
            return clearedCount;
        },

        getRanges: function() {
            return { ...SHEET_RANGES };
        },

        // 🧪 Teste (apenas desenvolvimento)
        test: async function() {
            if (!AppConfig.isDevelopment()) return;
            
            console.log('🧪 Testando integração Google Sheets...');
            
            try {
                // Testar conexão
                const testResult = await this.testConnection();
                console.log('✅ Teste de conexão:', testResult);
                
                // Testar leitura
                const readResult = await this.readRange('A1:B2');
                console.log('✅ Teste de leitura:', readResult);
                
                // Testar escrita
                const testData = [['Teste', new Date().toISOString()]];
                const writeResult = await this.writeRange('Z1:AA1', testData);
                console.log('✅ Teste de escrita:', writeResult);
                
            } catch (error) {
                console.error('❌ Erro no teste:', error);
            }
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SheetsIntegration;
}