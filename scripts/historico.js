/**
 * 📋 SISTEMA DE HORAS EXTRAS - HISTÓRICO
 * Módulo para gerenciamento de histórico, logs e auditoria
 */

const HistoricoManager = (function() {
    
    // 🗄️ ESTADO DO HISTÓRICO
    let state = {
        historico: [],
        logs: [],
        auditoria: [],
        filtros: {
            usuario: null,
            tipo: null,
            dataInicio: null,
            dataFim: null,
            semana: null
        },
        cache: new Map(),
        initialized: false
    };

    // 📊 TIPOS DE EVENTOS
    const TIPOS_EVENTO = {
        // Eventos de supervisor
        POSTO_SELECIONADO: {
            categoria: 'supervisor',
            icone: '✅',
            cor: '#3498db',
            descricao: 'Posto selecionado para horas extras'
        },
        POSTO_REMOVIDO: {
            categoria: 'supervisor',
            icone: '❌',
            cor: '#e74c3c',
            descricao: 'Posto removido das horas extras'
        },
        CONFIGURACAO_ALTERADA: {
            categoria: 'supervisor',
            icone: '⚙️',
            cor: '#f39c12',
            descricao: 'Configuração de turno alterada'
        },
        
        // Eventos de líder
        COLABORADOR_CONFIRMADO: {
            categoria: 'lider',
            icone: '👤',
            cor: '#27ae60',
            descricao: 'Colaborador confirmado para posto'
        },
        COLABORADOR_SUBSTITUIDO: {
            categoria: 'lider',
            icone: '🔄',
            cor: '#9b59b6',
            descricao: 'Colaborador substituído'
        },
        DISPONIBILIDADE_ATUALIZADA: {
            categoria: 'lider',
            icone: '📅',
            cor: '#1abc9c',
            descricao: 'Disponibilidade de colaborador atualizada'
        },
        
        // Eventos de sistema
        DADOS_SALVOS: {
            categoria: 'sistema',
            icone: '💾',
            cor: '#34495e',
            descricao: 'Dados salvos no sistema'
        },
        DADOS_LIMPOS: {
            categoria: 'sistema',
            icone: '🧹',
            cor: '#95a5a6',
            descricao: 'Dados da semana limpos'
        },
        BACKUP_CRIADO: {
            categoria: 'sistema',
            icone: '📦',
            cor: '#2c3e50',
            descricao: 'Backup automático criado'
        },
        SEMANA_FINALIZADA: {
            categoria: 'sistema',
            icone: '🏁',
            cor: '#16a085',
            descricao: 'Semana finalizada e arquivada'
        },
        
        // Eventos de integração
        TELEGRAM_ENVIADO: {
            categoria: 'integracao',
            icone: '📱',
            cor: '#0088cc',
            descricao: 'Mensagem enviada para Telegram'
        },
        SHEETS_SINCRONIZADO: {
            categoria: 'integracao',
            icone: '📊',
            cor: '#0f9d58',
            descricao: 'Dados sincronizados com Google Sheets'
        },
        
        // Eventos de supervisor
        SUPERVISOR_ALTERNADO: {
            categoria: 'supervisao',
            icone: '👔',
            cor: '#8e44ad',
            descricao: 'Supervisor de turno alternado'
        },
        
        // Eventos de erro
        ERRO_SISTEMA: {
            categoria: 'erro',
            icone: '🚨',
            cor: '#c0392b',
            descricao: 'Erro do sistema'
        },
        ERRO_INTEGRACAO: {
            categoria: 'erro',
            icone: '⚠️',
            cor: '#e67e22',
            descricao: 'Erro de integração'
        }
    };

    // 🔧 CONFIGURAÇÕES
    const CONFIG = {
        maxRegistros: 1000,
        maxLogs: 500,
        maxAuditoria: 200,
        retencaoDias: 90,
        autoBackup: true,
        compressaoThreshold: 100
    };

    // 🔧 MÉTODOS PRIVADOS

    function criarRegistro(tipo, detalhes, usuario = 'sistema') {
        const tipoInfo = TIPOS_EVENTO[tipo] || TIPOS_EVENTO.ERRO_SISTEMA;
        
        const registro = {
            id: AppUtils.generateId('hist_'),
            timestamp: new Date().toISOString(),
            tipo: tipo,
            categoria: tipoInfo.categoria,
            usuario: usuario,
            detalhes: detalhes || {},
            semana: AppData.getCurrentWeek()?.numero || AppUtils.getWeekNumber(),
            icone: tipoInfo.icone,
            cor: tipoInfo.cor,
            descricao: tipoInfo.descricao,
            metadata: {
                userAgent: navigator.userAgent,
                timestamp_unix: Date.now(),
                sessionId: getSessionId()
            }
        };

        return registro;
    }

    function getSessionId() {
        let sessionId = sessionStorage.getItem('horasExtras_sessionId');
        if (!sessionId) {
            sessionId = AppUtils.generateId('session_');
            sessionStorage.setItem('horasExtras_sessionId', sessionId);
        }
        return sessionId;
    }

    function validarRegistro(registro) {
        const camposObrigatorios = ['id', 'timestamp', 'tipo', 'categoria', 'usuario'];
        return camposObrigatorios.every(campo => registro.hasOwnProperty(campo) && registro[campo] !== null);
    }

    function aplicarFiltros(registros, filtros) {
        return registros.filter(registro => {
            // Filtro por usuário
            if (filtros.usuario && registro.usuario !== filtros.usuario) {
                return false;
            }
            
            // Filtro por tipo
            if (filtros.tipo && registro.tipo !== filtros.tipo) {
                return false;
            }
            
            // Filtro por categoria
            if (filtros.categoria && registro.categoria !== filtros.categoria) {
                return false;
            }
            
            // Filtro por semana
            if (filtros.semana && registro.semana !== filtros.semana) {
                return false;
            }
            
            // Filtro por data
            if (filtros.dataInicio) {
                const dataRegistro = new Date(registro.timestamp);
                const dataInicio = new Date(filtros.dataInicio);
                if (dataRegistro < dataInicio) return false;
            }
            
            if (filtros.dataFim) {
                const dataRegistro = new Date(registro.timestamp);
                const dataFim = new Date(filtros.dataFim);
                if (dataRegistro > dataFim) return false;
            }
            
            return true;
        });
    }

    function compactarHistorico() {
        // Remover registros antigos
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CONFIG.retencaoDias);
        
        const historicoBefore = state.historico.length;
        state.historico = state.historico.filter(registro => {
            const dataRegistro = new Date(registro.timestamp);
            return dataRegistro > cutoffDate;
        });
        
        const removidos = historicoBefore - state.historico.length;
        
        if (removidos > 0) {
            AppUtils.log(`Histórico compactado: ${removidos} registros removidos`);
        }
        
        // Limitar tamanho máximo
        if (state.historico.length > CONFIG.maxRegistros) {
            const excessoAntes = state.historico.length;
            state.historico = state.historico.slice(0, CONFIG.maxRegistros);
            const excessoRemovido = excessoAntes - CONFIG.maxRegistros;
            
            AppUtils.log(`Histórico limitado: ${excessoRemovido} registros antigos removidos`);
        }
        
        // Limpar cache
        state.cache.clear();
    }

    function gerarEstatisticas() {
        const stats = {
            total: state.historico.length,
            porCategoria: {},
            porTipo: {},
            porUsuario: {},
            porSemana: {},
            periodo: {
                inicio: null,
                fim: null
            },
            atividade: {
                ultimaHora: 0,
                ultimoDia: 0,
                ultimaSemana: 0
            }
        };

        const agora = new Date();
        const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);
        const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
        const umaSemanAAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

        state.historico.forEach(registro => {
            const data = new Date(registro.timestamp);
            
            // Contadores por categoria
            stats.porCategoria[registro.categoria] = (stats.porCategoria[registro.categoria] || 0) + 1;
            
            // Contadores por tipo
            stats.porTipo[registro.tipo] = (stats.porTipo[registro.tipo] || 0) + 1;
            
            // Contadores por usuário
            stats.porUsuario[registro.usuario] = (stats.porUsuario[registro.usuario] || 0) + 1;
            
            // Contadores por semana
            stats.porSemana[registro.semana] = (stats.porSemana[registro.semana] || 0) + 1;
            
            // Período
            if (!stats.periodo.inicio || data < new Date(stats.periodo.inicio)) {
                stats.periodo.inicio = registro.timestamp;
            }
            if (!stats.periodo.fim || data > new Date(stats.periodo.fim)) {
                stats.periodo.fim = registro.timestamp;
            }
            
            // Atividade recente
            if (data > umaHoraAtras) stats.atividade.ultimaHora++;
            if (data > umDiaAtras) stats.atividade.ultimoDia++;
            if (data > umaSemanAAtras) stats.atividade.ultimaSemana++;
        });

        return stats;
    }

    function exportarParaCSV(registros) {
        const headers = [
            'Timestamp',
            'Tipo',
            'Categoria',
            'Usuário',
            'Descrição',
            'Semana',
            'Detalhes'
        ];

        const rows = registros.map(registro => [
            registro.timestamp,
            registro.tipo,
            registro.categoria,
            registro.usuario,
            registro.descricao,
            registro.semana,
            JSON.stringify(registro.detalhes)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    function salvarLocal() {
        try {
            const dados = {
                historico: state.historico.slice(0, CONFIG.maxRegistros),
                filtros: state.filtros,
                timestamp: new Date().toISOString()
            };
            
            AppUtils.general.saveToStorage('horasExtras_historico', dados);
            return true;
        } catch (error) {
            AppUtils.log(`Erro ao salvar histórico localmente: ${error.message}`, 'error');
            return false;
        }
    }

    function carregarLocal() {
        try {
            const dados = AppUtils.general.loadFromStorage('horasExtras_historico');
            if (dados && dados.historico) {
                state.historico = dados.historico;
                state.filtros = dados.filtros || {};
                return true;
            }
            return false;
        } catch (error) {
            AppUtils.log(`Erro ao carregar histórico local: ${error.message}`, 'error');
            return false;
        }
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function() {
            try {
                // Carregar dados locais
                carregarLocal();
                
                // Configurar listeners
                this.setupEventListeners();
                
                // Compactar histórico se necessário
                if (state.historico.length > CONFIG.compressaoThreshold) {
                    compactarHistorico();
                }
                
                state.initialized = true;
                
                // Registrar inicialização
                this.registrar('DADOS_SALVOS', {
                    modulo: 'HistoricoManager',
                    registros: state.historico.length
                });

                AppUtils.log('Sistema de Histórico inicializado');
                return true;
            } catch (error) {
                AppUtils.log(`Erro ao inicializar histórico: ${error.message}`, 'error');
                return false;
            }
        },

        // 📝 Registro de Eventos
        registrar: function(tipo, detalhes, usuario = 'sistema') {
            try {
                const registro = criarRegistro(tipo, detalhes, usuario);
                
                if (!validarRegistro(registro)) {
                    throw new Error('Registro inválido');
                }
                
                // Adicionar ao histórico
                state.historico.unshift(registro);
                
                // Limitar tamanho
                if (state.historico.length > CONFIG.maxRegistros) {
                    state.historico = state.historico.slice(0, CONFIG.maxRegistros);
                }
                
                // Limpar cache
                state.cache.clear();
                
                // Salvar localmente (debounced)
                this.salvarLocalDebounced();
                
                // Disparar evento
                document.dispatchEvent(new CustomEvent('historicoAtualizado', {
                    detail: { registro, total: state.historico.length }
                }));
                
                return registro.id;
            } catch (error) {
                console.error('Erro ao registrar histórico:', error);
                return null;
            }
        },

        // Versão debounced do salvamento
        salvarLocalDebounced: AppUtils.debounce(salvarLocal, 1000),

        // 🔍 Consultas
        obter: function(filtros = {}, limite = 50, offset = 0) {
            const cacheKey = JSON.stringify({ filtros, limite, offset });
            
            if (state.cache.has(cacheKey)) {
                return state.cache.get(cacheKey);
            }
            
            let resultado = [...state.historico];
            
            // Aplicar filtros
            if (Object.keys(filtros).length > 0) {
                resultado = aplicarFiltros(resultado, filtros);
            }
            
            // Paginação
            const total = resultado.length;
            resultado = resultado.slice(offset, offset + limite);
            
            const response = {
                registros: resultado,
                total: total,
                limite: limite,
                offset: offset,
                temMais: offset + limite < total
            };
            
            // Cache do resultado
            state.cache.set(cacheKey, response);
            
            return response;
        },

        obterPorId: function(id) {
            return state.historico.find(registro => registro.id === id) || null;
        },

        obterPorSemana: function(numeroSemana, limite = 100) {
            return this.obter({ semana: numeroSemana }, limite);
        },

        obterPorCategoria: function(categoria, limite = 50) {
            return this.obter({ categoria }, limite);
        },

        obterPorUsuario: function(usuario, limite = 50) {
            return this.obter({ usuario }, limite);
        },

        obterRecentes: function(limite = 20) {
            return this.obter({}, limite);
        },

        // 📊 Estatísticas
        getEstatisticas: function() {
            const cacheKey = 'estatisticas';
            
            if (state.cache.has(cacheKey)) {
                const cached = state.cache.get(cacheKey);
                // Cache válido por 5 minutos
                if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                    return cached.data;
                }
            }
            
            const stats = gerarEstatisticas();
            
            state.cache.set(cacheKey, {
                data: stats,
                timestamp: Date.now()
            });
            
            return stats;
        },

        getAtividadeRecente: function() {
            const stats = this.getEstatisticas();
            return stats.atividade;
        },

        getResumoSemana: function(numeroSemana) {
            const registros = this.obterPorSemana(numeroSemana, 1000).registros;
            
            const resumo = {
                semana: numeroSemana,
                total: registros.length,
                porCategoria: {},
                eventos: {
                    primiero: registros[registros.length - 1]?.timestamp,
                    ultimo: registros[0]?.timestamp
                },
                usuarios: new Set(),
                postos: new Set()
            };
            
            registros.forEach(registro => {
                // Contar por categoria
                resumo.porCategoria[registro.categoria] = (resumo.porCategoria[registro.categoria] || 0) + 1;
                
                // Coletar usuários únicos
                resumo.usuarios.add(registro.usuario);
                
                // Coletar postos únicos (se aplicável)
                if (registro.detalhes?.posto) {
                    resumo.postos.add(registro.detalhes.posto);
                }
            });
            
            resumo.usuarios = resumo.usuarios.size;
            resumo.postos = resumo.postos.size;
            
            return resumo;
        },

        // 🔍 Filtros
        definirFiltros: function(novosFiltros) {
            state.filtros = { ...state.filtros, ...novosFiltros };
            state.cache.clear();
            
            // Salvar filtros
            AppUtils.general.saveToStorage('horasExtras_filtros', state.filtros);
            
            return state.filtros;
        },

        limparFiltros: function() {
            state.filtros = {};
            state.cache.clear();
            
            AppUtils.general.saveToStorage('horasExtras_filtros', {});
            
            return true;
        },

        getFiltros: function() {
            return { ...state.filtros };
        },

        // 📤 Exportação
        exportarCSV: function(filtros = {}) {
            const dados = this.obter(filtros, 10000); // Máximo 10k registros
            return exportarParaCSV(dados.registros);
        },

        exportarJSON: function(filtros = {}) {
            const dados = this.obter(filtros, 10000);
            return JSON.stringify(dados.registros, null, 2);
        },

        gerarRelatorio: function(parametros = {}) {
            const {
                periodo = 'semana',
                formato = 'json',
                incluirDetalhes = false
            } = parametros;
            
            let filtros = {};
            
            // Definir período
            switch (periodo) {
                case 'hoje':
                    filtros.dataInicio = new Date().toISOString().split('T')[0];
                    break;
                case 'semana':
                    const semanaAtual = AppUtils.getWeekNumber();
                    filtros.semana = semanaAtual;
                    break;
                case 'mes':
                    const mesAtras = new Date();
                    mesAtras.setMonth(mesAtras.getMonth() - 1);
                    filtros.dataInicio = mesAtras.toISOString();
                    break;
            }
            
            const dados = this.obter(filtros, 10000);
            const stats = this.getEstatisticas();
            
            const relatorio = {
                cabecalho: {
                    titulo: 'Relatório de Histórico - Sistema de Horas Extras',
                    periodo: periodo,
                    geradoEm: new Date().toISOString(),
                    filtros: filtros
                },
                resumo: {
                    totalRegistros: dados.total,
                    periodo: stats.periodo,
                    atividade: stats.atividade
                },
                estatisticas: {
                    porCategoria: stats.porCategoria,
                    porTipo: stats.porTipo,
                    porUsuario: stats.porUsuario
                },
                registros: incluirDetalhes ? dados.registros : undefined
            };
            
            return formato === 'csv' ? this.exportarCSV(filtros) : relatorio;
        },

        // 🧹 Manutenção
        limpar: function(confirmar = false) {
            if (!confirmar) {
                throw new Error('Operação requer confirmação explícita');
            }
            
            const totalAntes = state.historico.length;
            state.historico = [];
            state.cache.clear();
            
            salvarLocal();
            
            this.registrar('DADOS_LIMPOS', {
                acao: 'historico_limpo',
                registrosRemovidos: totalAntes
            });
            
            AppUtils.log(`Histórico limpo: ${totalAntes} registros removidos`);
            return true;
        },

        compactar: function() {
            const antesCompactacao = state.historico.length;
            compactarHistorico();
            const depoisCompactacao = state.historico.length;
            
            const removidos = antesCompactacao - depoisCompactacao;
            
            if (removidos > 0) {
                this.registrar('BACKUP_CRIADO', {
                    acao: 'compactacao',
                    registrosRemovidos: removidos,
                    registrosRestantes: depoisCompactacao
                });
            }
            
            return removidos;
        },

        // 🎯 Event Listeners
        setupEventListeners: function() {
            // Eventos do sistema
            document.addEventListener('postoSelecionado', (e) => {
                this.registrar('POSTO_SELECIONADO', e.detail, 'supervisor');
            });

            document.addEventListener('postoDesselecionado', (e) => {
                this.registrar('POSTO_REMOVIDO', e.detail, 'supervisor');
            });

            document.addEventListener('colaboradorConfirmado', (e) => {
                this.registrar('COLABORADOR_CONFIRMADO', e.detail, 'lider');
            });

            document.addEventListener('supervisorAlternado', (e) => {
                this.registrar('SUPERVISOR_ALTERNADO', e.detail, 'sistema');
            });

            document.addEventListener('turnoConfigurado', (e) => {
                this.registrar('CONFIGURACAO_ALTERADA', e.detail, 'supervisor');
            });

            document.addEventListener('dadosLimpos', (e) => {
                this.registrar('DADOS_LIMPOS', e.detail, 'sistema');
            });

            // Auto-compactação periódica
            setInterval(() => {
                if (state.historico.length > CONFIG.compressaoThreshold) {
                    this.compactar();
                }
            }, 10 * 60 * 1000); // A cada 10 minutos
        },

        // 🔧 Utilitários
        isInitialized: function() {
            return state.initialized;
        },

        getTiposEvento: function() {
            return { ...TIPOS_EVENTO };
        },

        getConfig: function() {
            return { ...CONFIG };
        },

        getState: function() {
            return {
                totalRegistros: state.historico.length,
                filtrosAtivos: Object.keys(state.filtros).length,
                cacheSize: state.cache.size,
                initialized: state.initialized
            };
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricoManager;
}