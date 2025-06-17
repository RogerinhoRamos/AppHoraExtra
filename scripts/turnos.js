/**
 * 🔄 SISTEMA DE HORAS EXTRAS - GERENCIADOR DE TURNOS
 * Módulo especializado para lógica de turnos e alternâncias
 */

const TurnosManager = (function() {
    
    // 🎯 ESTADO DO GERENCIADOR
    let state = {
        semanaAtual: null,
        supervisorAtivo: null,
        turnosConfig: {
            manha: {
                supervisor: null,
                horarios: {
                    sabado: { inicio: '13:30', fim: '16:30', horas: 3 },
                    domingo: { inicio: '05:00', fim: '12:00', horas: 7 }
                },
                postosSelecionados: new Set(),
                configuracoes: new Map() // posto -> config específica
            },
            tarde: {
                supervisor: null,
                horarios: {
                    extensao: { inicio: '22:00', fim: '00:30', horasPorDia: 2.5 }
                },
                postosSelecionados: new Set(),
                configuracoes: new Map(),
                diasAtivos: 0 // 0-5 dias
            }
        },
        alternanciaHistorico: [],
        initialized: false
    };

    // 📅 CONFIGURAÇÕES DE ALTERNÂNCIA
    const ALTERNANCIA_CONFIG = {
        automatica: true,
        ciclo: 2, // semanas
        supervisores: [
            { id: 'claudenir', nome: 'Claudenir', turnoPreferencial: 'manha' },
            { id: 'rogerio', nome: 'Rogério', turnoPreferencial: 'tarde' }
        ]
    };

    // ⏰ PADRÕES DE HORÁRIOS
    const HORARIOS_PADRAO = {
        manha: {
            normal: { inicio: '06:00', fim: '14:00' },
            sabado: { inicio: '13:30', fim: '16:30', horas: 3 },
            domingo: { inicio: '05:00', fim: '12:00', horas: 7 },
            extensoes: {
                ate16h: { fim: '16:00', horasExtras: 2 },
                ate17h: { fim: '17:00', horasExtras: 3 },
                ate18h: { fim: '18:00', horasExtras: 4 }
            }
        },
        tarde: {
            normal: { inicio: '14:00', fim: '22:00' },
            extensao: { inicio: '22:00', fim: '00:30', horasPorDia: 2.5 },
            configuracoesDias: {
                1: { dias: ['segunda'], totalHoras: 2.5 },
                2: { dias: ['segunda', 'terca'], totalHoras: 5.0 },
                3: { dias: ['segunda', 'terca', 'quarta'], totalHoras: 7.5 },
                4: { dias: ['segunda', 'terca', 'quarta', 'quinta'], totalHoras: 10.0 },
                5: { dias: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'], totalHoras: 12.5 }
            }
        }
    };

    // 🔧 MÉTODOS PRIVADOS

    function calcularSupervisorSemana(numeroSemana) {
        if (!ALTERNANCIA_CONFIG.automatica) {
            return ALTERNANCIA_CONFIG.supervisores[0];
        }

        // Lógica de alternância baseada no número da semana
        const indice = Math.floor((numeroSemana - 1) / ALTERNANCIA_CONFIG.ciclo) % ALTERNANCIA_CONFIG.supervisores.length;
        return ALTERNANCIA_CONFIG.supervisores[indice];
    }

    function definirTurnosSupervisores(supervisor) {
        if (supervisor.id === 'claudenir') {
            state.turnosConfig.manha.supervisor = 'claudenir';
            state.turnosConfig.tarde.supervisor = 'rogerio';
        } else {
            state.turnosConfig.manha.supervisor = 'rogerio';
            state.turnosConfig.tarde.supervisor = 'claudenir';
        }
    }

    function validarConfiguracao(turno, configuracao) {
        const validations = {
            manha: (config) => {
                if (config.sabado && typeof config.sabado.ativo !== 'boolean') return false;
                if (config.domingo && typeof config.domingo.ativo !== 'boolean') return false;
                return true;
            },
            tarde: (config) => {
                if (!Number.isInteger(config.diasAtivos) || config.diasAtivos < 0 || config.diasAtivos > 5) return false;
                return true;
            }
        };

        return validations[turno] ? validations[turno](configuracao) : false;
    }

    function calcularHorasTurno(turno) {
        const config = state.turnosConfig[turno];
        const postos = config.postosSelecionados.size;
        let totalHoras = 0;

        if (turno === 'manha') {
            // Verificar configurações salvas no AppData
            const semana = AppData.getCurrentWeek();
            if (semana && semana.turnos.manha.configuracoes) {
                const configuracoes = semana.turnos.manha.configuracoes;
                
                if (configuracoes.sabado.ativo) {
                    totalHoras += postos * configuracoes.sabado.horas;
                }
                
                if (configuracoes.domingo.ativo) {
                    totalHoras += postos * configuracoes.domingo.horas;
                }

                // Extensões específicas
                if (configuracoes.extensoes && configuracoes.extensoes.size > 0) {
                    configuracoes.extensoes.forEach((ext, dia) => {
                        totalHoras += postos * (ext.horas || 0);
                    });
                }
            }
        } else if (turno === 'tarde') {
            const diasAtivos = config.diasAtivos;
            const horasPorDia = HORARIOS_PADRAO.tarde.extensao.horasPorDia;
            totalHoras = postos * diasAtivos * horasPorDia;
        }

        return totalHoras;
    }

    function sincronizarComAppData() {
        const semana = AppData.getCurrentWeek();
        if (!semana) return;

        // Sincronizar postos selecionados
        state.turnosConfig.manha.postosSelecionados = new Set(semana.turnos.manha.postosSelecionados);
        state.turnosConfig.tarde.postosSelecionados = new Set(semana.turnos.tarde.postosSelecionados);

        // Sincronizar configurações
        if (semana.turnos.tarde.configuracoes.diasSemana) {
            state.turnosConfig.tarde.diasAtivos = semana.turnos.tarde.configuracoes.diasSemana;
        }

        // Atualizar supervisores
        state.turnosConfig.manha.supervisor = semana.turnos.manha.supervisor;
        state.turnosConfig.tarde.supervisor = semana.turnos.tarde.supervisor;
    }

    function registrarAlternancia(semana, supervisorAnterior, supervisorNovo) {
        const registro = {
            semana: semana,
            data: new Date().toISOString(),
            supervisorAnterior: supervisorAnterior?.id || null,
            supervisorNovo: supervisorNovo.id,
            tipo: 'automatica',
            turnos: {
                manha: state.turnosConfig.manha.supervisor,
                tarde: state.turnosConfig.tarde.supervisor
            }
        };

        state.alternanciaHistorico.unshift(registro);

        // Manter apenas últimas 50 alternâncias
        if (state.alternanciaHistorico.length > 50) {
            state.alternanciaHistorico = state.alternanciaHistorico.slice(0, 50);
        }

        // Disparar evento
        document.dispatchEvent(new CustomEvent('supervisorAlternado', {
            detail: registro
        }));

        AppUtils.log(`Supervisor alternado: ${supervisorAnterior?.nome || 'N/A'} → ${supervisorNovo.nome}`, 'info');
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function() {
            try {
                const semanaAtual = AppUtils.getWeekNumber();
                state.semanaAtual = semanaAtual;

                // Definir supervisor da semana
                const supervisor = calcularSupervisorSemana(semanaAtual);
                const supervisorAnterior = state.supervisorAtivo;
                state.supervisorAtivo = supervisor;

                // Configurar turnos
                definirTurnosSupervisores(supervisor);

                // Sincronizar com dados existentes
                sincronizarComAppData();

                // Registrar alternância se houve mudança
                if (supervisorAnterior && supervisorAnterior.id !== supervisor.id) {
                    registrarAlternancia(semanaAtual, supervisorAnterior, supervisor);
                }

                state.initialized = true;

                AppUtils.log(`Turnos Manager inicializado - Semana ${semanaAtual}, Supervisor: ${supervisor.nome}`);

                // Disparar evento de inicialização
                document.dispatchEvent(new CustomEvent('turnosInitialized', {
                    detail: {
                        semana: semanaAtual,
                        supervisor: supervisor,
                        turnos: state.turnosConfig
                    }
                }));

                return true;
            } catch (error) {
                AppUtils.log(`Erro ao inicializar TurnosManager: ${error.message}`, 'error');
                return false;
            }
        },

        // 📊 Getters
        getSupervisorAtivo: function() {
            return state.supervisorAtivo;
        },

        getSupervisorSemana: function(numeroSemana) {
            return calcularSupervisorSemana(numeroSemana || state.semanaAtual);
        },

        getTurnosSupervisores: function() {
            return {
                manha: state.turnosConfig.manha.supervisor,
                tarde: state.turnosConfig.tarde.supervisor
            };
        },

        getPostosSelecionados: function(turno) {
            return new Set(state.turnosConfig[turno]?.postosSelecionados || []);
        },

        getConfiguracao: function(turno) {
            return { ...state.turnosConfig[turno] };
        },

        getHorariosPadrao: function() {
            return AppUtils.general.deepClone(HORARIOS_PADRAO);
        },

        getAlternanciaHistorico: function(limite = 10) {
            return state.alternanciaHistorico.slice(0, limite);
        },

        // ⚙️ Configurações
        configurarTurnoManha: function(configuracao) {
            if (!validarConfiguracao('manha', configuracao)) {
                throw new Error('Configuração inválida para turno manhã');
            }

            const semana = AppData.getCurrentWeek();
            if (!semana) throw new Error('Semana não encontrada');

            // Atualizar configurações no AppData
            if (configuracao.sabado !== undefined) {
                semana.turnos.manha.configuracoes.sabado.ativo = configuracao.sabado.ativo;
                if (configuracao.sabado.horas) {
                    semana.turnos.manha.configuracoes.sabado.horas = configuracao.sabado.horas;
                }
            }

            if (configuracao.domingo !== undefined) {
                semana.turnos.manha.configuracoes.domingo.ativo = configuracao.domingo.ativo;
                if (configuracao.domingo.horas) {
                    semana.turnos.manha.configuracoes.domingo.horas = configuracao.domingo.horas;
                }
            }

            if (configuracao.extensoes) {
                semana.turnos.manha.configuracoes.extensoes = new Map(configuracao.extensoes);
            }

            // Disparar evento
            document.dispatchEvent(new CustomEvent('turnoConfigurado', {
                detail: { turno: 'manha', configuracao }
            }));

            return true;
        },

        configurarTurnoTarde: function(diasAtivos) {
            if (!validarConfiguracao('tarde', { diasAtivos })) {
                throw new Error('Configuração inválida para turno tarde');
            }

            state.turnosConfig.tarde.diasAtivos = diasAtivos;

            // Atualizar no AppData
            const semana = AppData.getCurrentWeek();
            if (semana) {
                semana.turnos.tarde.configuracoes.diasSemana = diasAtivos;
                
                // Definir dias específicos
                const configDias = HORARIOS_PADRAO.tarde.configuracoesDias[diasAtivos];
                if (configDias) {
                    semana.turnos.tarde.configuracoes.diasAtivos = new Set(configDias.dias);
                }
            }

            // Disparar evento
            document.dispatchEvent(new CustomEvent('turnoConfigurado', {
                detail: { turno: 'tarde', diasAtivos }
            }));

            return true;
        },

        // 🎯 Gerenciamento de Postos
        selecionarPosto: function(postoCode, turno) {
            if (!['manha', 'tarde'].includes(turno)) {
                throw new Error(`Turno inválido: ${turno}`);
            }

            const posto = AppData.getPostos().find(p => p.code === postoCode);
            if (!posto) {
                throw new Error(`Posto não encontrado: ${postoCode}`);
            }

            // Adicionar ao estado local
            state.turnosConfig[turno].postosSelecionados.add(postoCode);

            // Sincronizar com AppData
            AppData.selectPosto(postoCode, turno);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('postoSelecionado', {
                detail: { posto: postoCode, turno }
            }));

            AppUtils.log(`Posto selecionado: ${postoCode} (${turno})`);
            return true;
        },

        desselecionarPosto: function(postoCode, turno) {
            // Remover do estado local
            state.turnosConfig[turno].postosSelecionados.delete(postoCode);

            // Sincronizar com AppData
            AppData.unselectPosto(postoCode, turno);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('postoDesselecionado', {
                detail: { posto: postoCode, turno }
            }));

            AppUtils.log(`Posto desselecionado: ${postoCode} (${turno})`);
            return true;
        },

        alternarSelecaoPosto: function(postoCode, turno) {
            const isSelected = state.turnosConfig[turno].postosSelecionados.has(postoCode);
            
            if (isSelected) {
                return this.desselecionarPosto(postoCode, turno);
            } else {
                return this.selecionarPosto(postoCode, turno);
            }
        },

        // 📊 Cálculos
        calcularHorasSemana: function() {
            const horasManha = calcularHorasTurno('manha');
            const horasTarde = calcularHorasTurno('tarde');
            
            return {
                manha: horasManha,
                tarde: horasTarde,
                total: horasManha + horasTarde
            };
        },

        calcularMetaUtilizacao: function() {
            const horas = this.calcularHorasSemana();
            const semana = AppData.getCurrentWeek();
            const meta = semana?.metaSemanal || 150;
            
            return {
                atual: horas.total,
                meta: meta,
                percentual: AppUtils.calc.calculateMetaPercentage(horas.total, meta),
                restante: Math.max(meta - horas.total, 0),
                status: this.getStatusMeta(horas.total, meta)
            };
        },

        getStatusMeta: function(atual, meta) {
            const percentual = (atual / meta) * 100;
            
            if (percentual < 50) return 'baixo';
            if (percentual < 80) return 'normal';
            if (percentual < 95) return 'alto';
            return 'critico';
        },

        // 🔄 Alternância de Supervisores
        alternarSupervisor: function(forcar = false) {
            if (!forcar && ALTERNANCIA_CONFIG.automatica) {
                AppUtils.log('Alternância automática ativa. Use forcar=true para alternância manual.', 'warn');
                return false;
            }

            const supervisorAtual = state.supervisorAtivo;
            const supervisores = ALTERNANCIA_CONFIG.supervisores;
            const indiceAtual = supervisores.findIndex(s => s.id === supervisorAtual.id);
            const proximoIndice = (indiceAtual + 1) % supervisores.length;
            const proximoSupervisor = supervisores[proximoIndice];

            // Atualizar estado
            state.supervisorAtivo = proximoSupervisor;
            definirTurnosSupervisores(proximoSupervisor);

            // Registrar alternância
            registrarAlternancia(state.semanaAtual, supervisorAtual, proximoSupervisor);

            return true;
        },

        definirSupervisorManual: function(supervisorId) {
            const supervisor = ALTERNANCIA_CONFIG.supervisores.find(s => s.id === supervisorId);
            if (!supervisor) {
                throw new Error(`Supervisor não encontrado: ${supervisorId}`);
            }

            const supervisorAnterior = state.supervisorAtivo;
            state.supervisorAtivo = supervisor;
            definirTurnosSupervisores(supervisor);

            // Registrar como alternância manual
            const registro = {
                semana: state.semanaAtual,
                data: new Date().toISOString(),
                supervisorAnterior: supervisorAnterior?.id || null,
                supervisorNovo: supervisor.id,
                tipo: 'manual',
                turnos: {
                    manha: state.turnosConfig.manha.supervisor,
                    tarde: state.turnosConfig.tarde.supervisor
                }
            };

            state.alternanciaHistorico.unshift(registro);

            document.dispatchEvent(new CustomEvent('supervisorAlternado', {
                detail: registro
            }));

            return true;
        },

        // 📈 Estatísticas e Relatórios
        getEstatisticasTurnos: function() {
            const horas = this.calcularHorasSemana();
            const meta = this.calcularMetaUtilizacao();
            
            return {
                semanaAtual: state.semanaAtual,
                supervisor: state.supervisorAtivo,
                horas: horas,
                meta: meta,
                turnos: {
                    manha: {
                        supervisor: state.turnosConfig.manha.supervisor,
                        postos: state.turnosConfig.manha.postosSelecionados.size,
                        horas: horas.manha
                    },
                    tarde: {
                        supervisor: state.turnosConfig.tarde.supervisor,
                        postos: state.turnosConfig.tarde.postosSelecionados.size,
                        horas: horas.tarde,
                        diasAtivos: state.turnosConfig.tarde.diasAtivos
                    }
                }
            };
        },

        gerarRelatorioSemanal: function() {
            const stats = this.getEstatisticasTurnos();
            const semana = AppData.getCurrentWeek();
            
            const relatorio = {
                cabecalho: {
                    semana: stats.semanaAtual,
                    periodo: AppUtils.formatDate(semana?.dataInicio, 'dd/MM') + ' - ' + AppUtils.formatDate(semana?.dataFim, 'dd/MM'),
                    supervisor: stats.supervisor.nome,
                    geradoEm: new Date().toISOString()
                },
                resumo: {
                    totalHoras: stats.horas.total,
                    metaSemanal: stats.meta.meta,
                    utilizacao: stats.meta.percentual,
                    status: stats.meta.status
                },
                turnos: {
                    manha: {
                        supervisor: stats.turnos.manha.supervisor,
                        postosSelecionados: Array.from(state.turnosConfig.manha.postosSelecionados),
                        horasExtras: stats.turnos.manha.horas,
                        configuracao: this.getConfiguracaoManha()
                    },
                    tarde: {
                        supervisor: stats.turnos.tarde.supervisor,
                        postosSelecionados: Array.from(state.turnosConfig.tarde.postosSelecionados),
                        horasExtras: stats.turnos.tarde.horas,
                        diasAtivos: stats.turnos.tarde.diasAtivos
                    }
                },
                observacoes: semana?.observacoes || ''
            };

            return relatorio;
        },

        getConfiguracaoManha: function() {
            const semana = AppData.getCurrentWeek();
            if (!semana) return {};

            const config = semana.turnos.manha.configuracoes;
            return {
                sabado: config.sabado,
                domingo: config.domingo,
                extensoes: config.extensoes ? Object.fromEntries(config.extensoes) : {}
            };
        },

        // 🧹 Limpeza e Reset
        limparDadosSemana: function() {
            // Limpar seleções locais
            state.turnosConfig.manha.postosSelecionados.clear();
            state.turnosConfig.tarde.postosSelecionados.clear();
            state.turnosConfig.tarde.diasAtivos = 0;

            // Limpar no AppData
            AppData.clearWeekData();

            // Disparar evento
            document.dispatchEvent(new CustomEvent('dadosLimpos', {
                detail: { semana: state.semanaAtual }
            }));

            AppUtils.log('Dados da semana limpos');
            return true;
        },

        // 🔧 Utilitários
        isInitialized: function() {
            return state.initialized;
        },

        atualizarSemana: function(numeroSemana) {
            const supervisor = calcularSupervisorSemana(numeroSemana);
            const supervisorAnterior = state.supervisorAtivo;
            
            state.semanaAtual = numeroSemana;
            state.supervisorAtivo = supervisor;
            
            definirTurnosSupervisores(supervisor);
            sincronizarComAppData();

            if (supervisorAnterior && supervisorAnterior.id !== supervisor.id) {
                registrarAlternancia(numeroSemana, supervisorAnterior, supervisor);
            }

            return true;
        },

        exportarConfiguracao: function() {
            return {
                semana: state.semanaAtual,
                supervisor: state.supervisorAtivo,
                turnos: AppUtils.general.deepClone(state.turnosConfig),
                alternanciaHistorico: [...state.alternanciaHistorico]
            };
        },

        importarConfiguracao: function(configuracao) {
            try {
                state.semanaAtual = configuracao.semana;
                state.supervisorAtivo = configuracao.supervisor;
                state.turnosConfig = configuracao.turnos;
                state.alternanciaHistorico = configuracao.alternanciaHistorico || [];
                
                return true;
            } catch (error) {
                AppUtils.log(`Erro ao importar configuração: ${error.message}`, 'error');
                return false;
            }
        },

        reset: function() {
            state = {
                semanaAtual: null,
                supervisorAtivo: null,
                turnosConfig: {
                    manha: {
                        supervisor: null,
                        horarios: HORARIOS_PADRAO.manha,
                        postosSelecionados: new Set(),
                        configuracoes: new Map()
                    },
                    tarde: {
                        supervisor: null,
                        horarios: HORARIOS_PADRAO.tarde,
                        postosSelecionados: new Set(),
                        configuracoes: new Map(),
                        diasAtivos: 0
                    }
                },
                alternanciaHistorico: [],
                initialized: false
            };
        }
    };

})();

// 🎯 Event Listeners Globais
document.addEventListener('DOMContentLoaded', function() {
    // Sincronizar quando dados mudam
    document.addEventListener('weekDataUpdated', function(e) {
        if (TurnosManager.isInitialized()) {
            TurnosManager.atualizarSemana(e.detail.semana);
        }
    });

    // Log de eventos importantes
    document.addEventListener('supervisorAlternado', function(e) {
        const detail = e.detail;
        AppUtils.log(`👔 Supervisor alternado: ${detail.supervisorAnterior || 'N/A'} → ${detail.supervisorNovo} (Semana ${detail.semana})`);
    });

    document.addEventListener('turnoConfigurado', function(e) {
        const detail = e.detail;
        AppUtils.log(`⚙️ Turno ${detail.turno} configurado`);
    });
});

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurnosManager;
}