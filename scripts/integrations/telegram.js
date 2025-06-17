/**
 * 📱 SISTEMA DE HORAS EXTRAS - INTEGRAÇÃO TELEGRAM
 * Módulo para integração com o bot @ChamaNaExtra_bot
 */

const TelegramIntegration = (function() {
    
    // 🎯 ESTADO DA INTEGRAÇÃO
    let state = {
        botToken: '',
        chatId: '-484881363923:06',
        apiUrl: 'https://api.telegram.org/bot',
        isConfigured: false,
        lastMessageId: null,
        messageQueue: [],
        rateLimitInfo: {
            requestsPerMinute: 0,
            lastReset: Date.now(),
            maxRequestsPerMinute: 30
        },
        connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
        initialized: false
    };

    // 📝 TEMPLATES DE MENSAGENS
    const MESSAGE_TEMPLATES = {
        novaEscala: {
            text: `🚨 <b>NOVA ESCALA - Semana {semana}</b>
📅 {periodo}
🏭 Postos selecionados: {totalPostos}
{postos}

👤 {lider}, confirme os colaboradores no sistema
🔗 {linkSistema}

#HorasExtras #Semana{semana}`,
            parseMode: 'HTML'
        },

        escalaConfirmada: {
            text: `✅ <b>ESCALA CONFIRMADA</b>
📅 {data} - {tipo}
👥 {postosConfirmados} postos confirmados
⏰ {horasExtras}h extras programadas
📊 Meta semanal: {horasAtuais}/{metaSemanal}h ({percentualMeta}%)

{detalhesTurnos}

#Confirmado #Semana{semana}`,
            parseMode: 'HTML'
        },

        alertaMeta: {
            text: `⚠️ <b>ATENÇÃO - META SEMANAL</b>
📊 Utilização: {percentual}% ({horasAtuais}h / {metaSemanal}h)
🚨 {statusMeta}
📅 Semana {semana}

{recomendacao}

#AlertaMeta #Semana{semana}`,
            parseMode: 'HTML'
        },

        supervisorAlternado: {
            text: `👔 <b>ALTERNÂNCIA DE SUPERVISOR</b>
📅 Semana {semana}
🔄 {supervisorAnterior} → {supervisorNovo}

🌅 Turno Manhã: {supervisorManha}
🌆 Turno Tarde: {supervisorTarde}

#SupervisorAlternado #Semana{semana}`,
            parseMode: 'HTML'
        },

        dadosLimpos: {
            text: `🧹 <b>DADOS LIMPOS</b>
📅 Semana {semana} finalizada
💾 {totalRegistros} registros salvos no histórico
📊 Total de horas: {totalHoras}h

✅ Sistema pronto para nova semana

#DadosLimpos #Semana{semana}`,
            parseMode: 'HTML'
        },

        erroSistema: {
            text: `🚨 <b>ERRO DO SISTEMA</b>
⚠️ {tipoErro}
📝 {descricao}
🕐 {timestamp}

🔧 Verificar sistema necessário

#Erro #Sistema`,
            parseMode: 'HTML'
        },

        backup: {
            text: `📦 <b>BACKUP AUTOMÁTICO</b>
✅ Backup criado com sucesso
📊 {totalRegistros} registros
💾 Tamanho: {tamanho}
🕐 {timestamp}

#Backup #Sistema`,
            parseMode: 'HTML'
        },

        resumoSemanal: {
            text: `📋 <b>RESUMO SEMANAL</b>
📅 Semana {semana} ({periodo})
👔 Supervisor: {supervisor}

📊 <b>ESTATÍSTICAS:</b>
⏰ Total de horas: {totalHoras}h
🎯 Meta utilizada: {percentualMeta}%
🌅 Turno Manhã: {horasManha}h
🌆 Turno Tarde: {horasTarde}h

👥 <b>PARTICIPAÇÃO:</b>
{estatisticasColaboradores}

#ResumoSemanal #Semana{semana}`,
            parseMode: 'HTML'
        }
    };

    // ⚙️ CONFIGURAÇÕES DE RATE LIMITING
    const RATE_LIMIT_CONFIG = {
        maxRequestsPerMinute: 30,
        retryDelay: 1000,
        maxRetries: 3,
        backoffMultiplier: 2
    };

    // 🔧 MÉTODOS PRIVADOS

    function checkRateLimit() {
        const now = Date.now();
        
        // Reset contador a cada minuto
        if (now - state.rateLimitInfo.lastReset > 60000) {
            state.rateLimitInfo.requestsPerMinute = 0;
            state.rateLimitInfo.lastReset = now;
        }
        
        return state.rateLimitInfo.requestsPerMinute < RATE_LIMIT_CONFIG.maxRequestsPerMinute;
    }

    function incrementRateLimit() {
        state.rateLimitInfo.requestsPerMinute++;
    }

    async function makeApiRequest(method, params, retryCount = 0) {
        if (!state.isConfigured) {
            throw new Error('Telegram não configurado');
        }

        if (!checkRateLimit()) {
            throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
        }

        const url = `${state.apiUrl}${state.botToken}/${method}`;
        
        try {
            state.connectionStatus = 'connecting';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            incrementRateLimit();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.ok) {
                throw new Error(`Telegram API Error: ${data.description}`);
            }

            state.connectionStatus = 'connected';
            return data.result;

        } catch (error) {
            state.connectionStatus = 'error';
            
            // Implementar retry com backoff exponencial
            if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
                const delay = RATE_LIMIT_CONFIG.retryDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, retryCount);
                
                AppUtils.log(`Tentativa ${retryCount + 1} falhou. Tentando novamente em ${delay}ms...`, 'warn');
                
                await AppUtils.general.sleep(delay);
                return makeApiRequest(method, params, retryCount + 1);
            }
            
            throw error;
        }
    }

    function processTemplate(templateName, data) {
        const template = MESSAGE_TEMPLATES[templateName];
        if (!template) {
            throw new Error(`Template não encontrado: ${templateName}`);
        }

        let text = template.text;
        
        // Substituir placeholders
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            const value = data[key] !== undefined ? data[key] : '';
            text = text.replace(new RegExp(placeholder, 'g'), value);
        });

        return {
            text: text,
            parse_mode: template.parseMode || 'HTML'
        };
    }

    function formatPostosList(postos) {
        if (!postos || postos.length === 0) return 'Nenhum posto selecionado';
        
        const gruposArea = {};
        
        postos.forEach(postoCode => {
            const posto = AppData.getPostos().find(p => p.code === postoCode);
            if (posto) {
                if (!gruposArea[posto.area]) {
                    gruposArea[posto.area] = [];
                }
                gruposArea[posto.area].push(posto.code);
            }
        });

        const linhas = [];
        Object.keys(gruposArea).forEach(area => {
            linhas.push(`\n<b>${area}:</b>`);
            gruposArea[area].forEach(codigo => {
                linhas.push(`• ${codigo}`);
            });
        });

        return linhas.join('\n');
    }

    function formatTurnosDetalhes(turnos) {
        const detalhes = [];
        
        if (turnos.manha && turnos.manha.postos > 0) {
            detalhes.push(`🌅 <b>Manhã:</b> ${turnos.manha.postos} postos (${turnos.manha.horas}h)`);
        }
        
        if (turnos.tarde && turnos.tarde.postos > 0) {
            detalhes.push(`🌆 <b>Tarde:</b> ${turnos.tarde.postos} postos (${turnos.tarde.horas}h) - ${turnos.tarde.diasAtivos} dias`);
        }

        return detalhes.join('\n');
    }

    function formatColaboradoresStats(estatisticas) {
        const linhas = [];
        
        if (estatisticas.totalColaboradores) {
            linhas.push(`👥 Total: ${estatisticas.totalColaboradores} colaboradores`);
        }
        
        if (estatisticas.porTurno) {
            if (estatisticas.porTurno.manha > 0) {
                linhas.push(`🌅 Manhã: ${estatisticas.porTurno.manha}`);
            }
            if (estatisticas.porTurno.tarde > 0) {
                linhas.push(`🌆 Tarde: ${estatisticas.porTurno.tarde}`);
            }
        }

        return linhas.join('\n');
    }

    async function processMessageQueue() {
        if (state.messageQueue.length === 0) return;
        
        const message = state.messageQueue.shift();
        
        try {
            await sendMessage(message.text, message.options);
            AppUtils.log(`Mensagem da queue enviada: ${message.type}`);
            
            // Processar próxima mensagem com delay
            setTimeout(processMessageQueue, 1000);
            
        } catch (error) {
            AppUtils.log(`Erro ao enviar mensagem da queue: ${error.message}`, 'error');
            
            // Recolocar na queue se não excedeu tentativas
            if (message.retries < 3) {
                message.retries = (message.retries || 0) + 1;
                state.messageQueue.unshift(message);
            }
            
            // Tentar próxima mensagem
            setTimeout(processMessageQueue, 5000);
        }
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function(config = {}) {
            try {
                // Configurar bot token se fornecido
                if (config.botToken) {
                    state.botToken = config.botToken;
                    state.isConfigured = true;
                }
                
                // Configurar chat ID se fornecido
                if (config.chatId) {
                    state.chatId = config.chatId;
                }

                // Configurar URL da API se necessário
                if (config.apiUrl) {
                    state.apiUrl = config.apiUrl;
                }

                // Tentar carregar configuração salva
                const savedConfig = AppUtils.general.loadFromStorage('telegram_config');
                if (savedConfig) {
                    if (savedConfig.botToken) {
                        state.botToken = savedConfig.botToken;
                        state.isConfigured = true;
                    }
                }

                state.initialized = true;
                
                // Configurar listeners de eventos
                this.setupEventListeners();
                
                AppUtils.log('Integração Telegram inicializada');
                
                // Testar conexão se configurado
                if (state.isConfigured) {
                    this.testConnection();
                }
                
                return true;
            } catch (error) {
                AppUtils.log(`Erro ao inicializar Telegram: ${error.message}`, 'error');
                return false;
            }
        },

        // ⚙️ Configuração
        configure: function(botToken, chatId = null) {
            if (!botToken) {
                throw new Error('Bot token é obrigatório');
            }

            state.botToken = botToken;
            state.chatId = chatId || state.chatId;
            state.isConfigured = true;
            
            // Salvar configuração
            const config = { botToken };
            AppUtils.general.saveToStorage('telegram_config', config);
            
            // Testar conexão
            return this.testConnection();
        },

        // 🔗 Teste de Conexão
        testConnection: async function() {
            if (!state.isConfigured) {
                throw new Error('Telegram não configurado');
            }

            try {
                const botInfo = await makeApiRequest('getMe');
                
                AppUtils.log(`Conectado ao bot: @${botInfo.username} (${botInfo.first_name})`);
                
                // Notificar sucesso
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.telegram('Conectado ao Telegram com sucesso');
                }
                
                return {
                    success: true,
                    botInfo: botInfo
                };
                
            } catch (error) {
                AppUtils.log(`Erro ao testar conexão Telegram: ${error.message}`, 'error');
                
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.error('Erro na conexão com Telegram');
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        // 📤 Enviar Mensagem
        sendMessage: async function(text, options = {}) {
            const params = {
                chat_id: options.chatId || state.chatId,
                text: text,
                parse_mode: options.parseMode || 'HTML',
                disable_web_page_preview: options.disablePreview !== false,
                disable_notification: options.silent || false
            };

            try {
                const result = await makeApiRequest('sendMessage', params);
                state.lastMessageId = result.message_id;
                
                // Registrar no histórico
                if (typeof HistoricoManager !== 'undefined') {
                    HistoricoManager.registrar('TELEGRAM_ENVIADO', {
                        messageId: result.message_id,
                        texto: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                        chatId: params.chat_id
                    });
                }
                
                return result;
                
            } catch (error) {
                AppUtils.log(`Erro ao enviar mensagem Telegram: ${error.message}`, 'error');
                throw error;
            }
        },

        // 📝 Enviar usando Templates
        sendFromTemplate: async function(templateName, data, options = {}) {
            try {
                const message = processTemplate(templateName, data);
                const result = await this.sendMessage(message.text, {
                    ...options,
                    parseMode: message.parse_mode
                });
                
                AppUtils.log(`Template ${templateName} enviado com sucesso`);
                return result;
                
            } catch (error) {
                AppUtils.log(`Erro ao enviar template ${templateName}: ${error.message}`, 'error');
                throw error;
            }
        },

        // 📋 Métodos de Conveniência para Templates
        notificarNovaEscala: async function() {
            const semana = AppData.getCurrentWeek();
            const stats = TurnosManager.getEstatisticasTurnos();
            
            if (!semana) {
                throw new Error('Nenhuma semana ativa encontrada');
            }
            
            const postosManha = Array.from(semana.turnos.manha.postosSelecionados);
            const postosTarde = Array.from(semana.turnos.tarde.postosSelecionados);
            const todosPostos = [...postosManha, ...postosTarde];
            
            const data = {
                semana: semana.numero,
                periodo: `${AppUtils.formatDate(semana.dataInicio, 'dd/MM')} - ${AppUtils.formatDate(semana.dataFim, 'dd/MM')}`,
                totalPostos: todosPostos.length,
                postos: formatPostosList(todosPostos),
                lider: 'líder do turno',
                linkSistema: window.location.origin
            };
            
            return this.sendFromTemplate('novaEscala', data);
        },

        notificarEscalaConfirmada: async function() {
            const semana = AppData.getCurrentWeek();
            const stats = TurnosManager.getEstatisticasTurnos();
            const horas = TurnosManager.calcularHorasSemana();
            const meta = TurnosManager.calcularMetaUtilizacao();
            
            const data = {
                data: AppUtils.formatDate(new Date(), 'dd/MM/yyyy'),
                tipo: 'Escala Semanal',
                postosConfirmados: stats.turnos.manha.postos + stats.turnos.tarde.postos,
                horasExtras: horas.total,
                horasAtuais: meta.atual,
                metaSemanal: meta.meta,
                percentualMeta: Math.round(meta.percentual),
                detalhesTurnos: formatTurnosDetalhes(stats.turnos),
                semana: semana.numero
            };
            
            return this.sendFromTemplate('escalaConfirmada', data);
        },

        notificarAlertaMeta: async function() {
            const meta = TurnosManager.calcularMetaUtilizacao();
            const semana = AppData.getCurrentWeek();
            
            let statusMeta = '';
            let recomendacao = '';
            
            switch (meta.status) {
                case 'alto':
                    statusMeta = 'Utilização alta da meta semanal';
                    recomendacao = '⚠️ Considere reduzir horas extras nos próximos dias';
                    break;
                case 'critico':
                    statusMeta = 'Meta semanal praticamente esgotada';
                    recomendacao = '🚨 Evitar novas horas extras esta semana';
                    break;
                default:
                    statusMeta = 'Utilização dentro do esperado';
                    recomendacao = '✅ Margem adequada para ajustes';
            }
            
            const data = {
                percentual: Math.round(meta.percentual),
                horasAtuais: meta.atual,
                metaSemanal: meta.meta,
                statusMeta: statusMeta,
                recomendacao: recomendacao,
                semana: semana.numero
            };
            
            return this.sendFromTemplate('alertaMeta', data);
        },

        notificarSupervisorAlternado: async function(evento) {
            const data = {
                semana: evento.semana,
                supervisorAnterior: evento.supervisorAnterior || 'N/A',
                supervisorNovo: evento.supervisorNovo,
                supervisorManha: evento.turnos.manha,
                supervisorTarde: evento.turnos.tarde
            };
            
            return this.sendFromTemplate('supervisorAlternado', data);
        },

        notificarDadosLimpos: async function(evento) {
            const data = {
                semana: evento.semana,
                totalRegistros: evento.totalRegistros || 0,
                totalHoras: evento.totalHoras || 0
            };
            
            return this.sendFromTemplate('dadosLimpos', data);
        },

        enviarResumoSemanal: async function() {
            const semana = AppData.getCurrentWeek();
            const stats = TurnosManager.getEstatisticasTurnos();
            const horas = TurnosManager.calcularHorasSemana();
            const meta = TurnosManager.calcularMetaUtilizacao();
            
            // Mock de estatísticas de colaboradores (seria calculado pelo sistema)
            const estatisticasColaboradores = {
                totalColaboradores: 15,
                porTurno: {
                    manha: 8,
                    tarde: 7
                }
            };
            
            const data = {
                semana: semana.numero,
                periodo: `${AppUtils.formatDate(semana.dataInicio, 'dd/MM')} - ${AppUtils.formatDate(semana.dataFim, 'dd/MM')}`,
                supervisor: stats.supervisor.nome,
                totalHoras: horas.total,
                percentualMeta: Math.round(meta.percentual),
                horasManha: horas.manha,
                horasTarde: horas.tarde,
                estatisticasColaboradores: formatColaboradoresStats(estatisticasColaboradores)
            };
            
            return this.sendFromTemplate('resumoSemanal', data);
        },

        // 📬 Queue de Mensagens
        addToQueue: function(templateName, data, options = {}) {
            state.messageQueue.push({
                type: templateName,
                templateName: templateName,
                data: data,
                options: options,
                timestamp: new Date().toISOString(),
                retries: 0
            });
            
            // Processar queue se não estiver em andamento
            if (state.messageQueue.length === 1) {
                setTimeout(processMessageQueue, 100);
            }
        },

        // 📊 Informações
        getStatus: function() {
            return {
                configured: state.isConfigured,
                connectionStatus: state.connectionStatus,
                queueSize: state.messageQueue.length,
                rateLimitInfo: {
                    requestsThisMinute: state.rateLimitInfo.requestsPerMinute,
                    maxRequestsPerMinute: RATE_LIMIT_CONFIG.maxRequestsPerMinute
                },
                lastMessageId: state.lastMessageId
            };
        },

        getConfig: function() {
            return {
                chatId: state.chatId,
                hasToken: !!state.botToken,
                apiUrl: state.apiUrl
            };
        },

        // 🎯 Event Listeners
        setupEventListeners: function() {
            // Evento de posto selecionado
            document.addEventListener('postoSelecionado', () => {
                // Não enviar para cada posto individual, apenas no final
            });

            // Evento de supervisor alternado
            document.addEventListener('supervisorAlternado', (e) => {
                if (state.isConfigured) {
                    this.addToQueue('supervisorAlternado', e.detail);
                }
            });

            // Evento de dados limpos
            document.addEventListener('dadosLimpos', (e) => {
                if (state.isConfigured) {
                    this.addToQueue('dadosLimpos', e.detail);
                }
            });

            // Evento de meta atingida
            document.addEventListener('metaAtingida', () => {
                if (state.isConfigured) {
                    this.addToQueue('alertaMeta', {});
                }
            });

            // Listener customizado para notificações manuais
            document.addEventListener('telegramNotify', (e) => {
                if (state.isConfigured && e.detail.template) {
                    this.addToQueue(e.detail.template, e.detail.data || {});
                }
            });
        },

        // 🔧 Utilitários
        isConfigured: function() {
            return state.isConfigured;
        },

        isInitialized: function() {
            return state.initialized;
        },

        clearQueue: function() {
            const clearedCount = state.messageQueue.length;
            state.messageQueue = [];
            return clearedCount;
        },

        getTemplates: function() {
            return Object.keys(MESSAGE_TEMPLATES);
        },

        // 🧪 Teste (apenas desenvolvimento)
        test: async function() {
            if (!AppConfig.isDevelopment()) return;
            
            console.log('🧪 Testando integração Telegram...');
            
            try {
                const testMessage = `🧪 <b>TESTE DO SISTEMA</b>
⏰ ${new Date().toLocaleString('pt-BR')}
✅ Sistema funcionando corretamente

#Teste #${Date.now()}`;
                
                await this.sendMessage(testMessage);
                console.log('✅ Teste de envio bem-sucedido');
                
            } catch (error) {
                console.error('❌ Erro no teste:', error);
            }
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramIntegration;
}