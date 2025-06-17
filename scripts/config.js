/**
 * 🔧 SISTEMA DE HORAS EXTRAS - CONFIGURAÇÕES
 * Módulo central de configurações do sistema
 */

const AppConfig = (function() {
    
    // 📋 CONFIGURAÇÕES GERAIS
    const SYSTEM_CONFIG = {
        version: '1.0.0',
        environment: 'production', // 'development' | 'production'
        debug: false,
        appName: 'Sistema de Horas Extras',
        language: 'pt-BR'
    };

    // ⏰ CONFIGURAÇÕES DE HORÁRIOS
    const HORARIOS_CONFIG = {
        turnoManha: {
            normal: { inicio: '05:00', fim: '12:42' },
            sabado: { inicio: '05:00', fim: '13:30', horas: 8 },
            domingo: { inicio: '05:00', fim: '12:00', horas: 7 },
            extensoes: {
                ate16h: { fim: '16:00', horasExtras: 3 },
                ate17h: { fim: '17:00', horasExtras: 4 }
            }
        },
        turnoTarde: {
            normal: { inicio: '12:42', fim: '22:00' },
            extensao: { inicio: '22:00', fim: '00:30', horas: 2.5 },
            diasConfig: {
                1: { dias: 1, totalHoras: 2.5 },
                2: { dias: 2, totalHoras: 5.0 },
                3: { dias: 3, totalHoras: 7.5 },
                4: { dias: 4, totalHoras: 10.0 },
                5: { dias: 5, totalHoras: 12.5 }
            }
        },
        feriados: {
            multiplicador: 1.0,
            horasBase: 8,
            tipos: {
                'nacional': { horas: 8, multiplicador: 2.0 },
                'facultativo': { horas: 6, multiplicador: 1.5 },
                'compensacao': { horas: 10, multiplicador: 1.0 },
                'especial': { horas: 4, multiplicador: 1.2 }
            }
        }
    };

    // 👥 CONFIGURAÇÕES DE USUÁRIOS
    const USERS_CONFIG = {
        perfis: {
            supervisor: {
                nome: 'Supervisor',
                icon: '👔',
                permissoes: [
                    'selecionar_postos',
                    'configurar_horarios',
                    'gerar_relatorios',
                    'limpar_dados',
                    'visualizar_historico',
                    'enviar_telegram'
                ]
            },
            lider: {
                nome: 'Líder',
                icon: '👤',
                permissoes: [
                    'confirmar_colaboradores',
                    'visualizar_postos_selecionados',
                    'adicionar_observacoes',
                    'marcar_disponibilidade'
                ]
            }
        },
        supervisores: [
            { id: 'claudenir', nome: 'Claudenir', turnoPreferencial: 'manha' },
            { id: 'rogerio', nome: 'Rogério', turnoPreferencial: 'tarde' }
        ],
        alternanciaAutomatica: true, // Alterna supervisores automaticamente por semana
        semanaBase: 1 // Semana de referência para alternância
    };

    // 📊 CONFIGURAÇÕES DE METAS
    const METAS_CONFIG = {
        metaSemanalPadrao: 700, // horas
        limiteAlerta: 0.8, // 80% da meta
        limiteCritico: 0.95, // 95% da meta
        cores: {
            normal: '#27ae60',
            alerta: '#f39c12', 
            critico: '#e74c3c',
            sucesso: '#2ecc71'
        }
    };

    // 🤖 CONFIGURAÇÕES TELEGRAM
    const TELEGRAM_CONFIG = {
        botToken: '7877375832:AAElu4kbtqT3pv7eB3gTOS_XBeTUo5w7H0I', // Será configurado via interface
        chatId: '-484881363923:06',
        apiUrl: 'https://api.telegram.org/bot',
        mensagens: {
            novaEscala: {
                template: `🚨 <b>NOVA ESCALA - Semana {semana}</b>
📅 {periodo}
🏭 Postos: {postos}
👤 @{lider} confirme os colaboradores
🔗 {link}`,
                parseMode: 'HTML'
            },
            escalaConfirmada: {
                template: `✅ <b>ESCALA CONFIRMADA</b>
📅 {data} - {tipo}
👥 {postos} postos confirmados
⏰ {horas}h extras programadas
📊 Meta semanal: {atual}/{meta}h ({percentual}%)`,
                parseMode: 'HTML'
            },
            alertaMeta: {
                template: `⚠️ <b>ATENÇÃO - META SEMANAL</b>
📊 Utilização: {percentual}% ({atual}h / {meta}h)
🚨 {status}
📅 Semana {semana}`,
                parseMode: 'HTML'
            }
        },
        eventos: {
            postoSelecionado: true,
            escalaConfirmada: true,
            metaAtingida: true,
            dadosLimpos: false,
            erroSistema: true
        }
    };

    // 📝 CONFIGURAÇÕES GOOGLE SHEETS
    const SHEETS_CONFIG = {
        spreadsheetId: 'AKfycbyqRwApMZSCets-GbVF83iRr1U861MOIoqCTmtXPz4iMHJcpK0nCUSDSGgHqDh-nucZ', // Será configurado
        ranges: {
            turnoA: 'Turno A - Claudenir!A:M',
            turnoB: 'Turno B - Rogério!A:M',
            historico: 'Histórico!A:N',
            postos: 'Postos!A:B',
            colaboradoresA: 'Colaboradores A!A:B',
            colaboradoresB: 'Colaboradores B!A:B',
            relatorio: 'Relatório!A:Z'
        },
        backup: {
            automatico: true,
            intervalo: 300000, // 5 minutos em ms
            versoes: 10 // manter últimas 10 versões
        }
    };

    // 🎨 CONFIGURAÇÕES DE INTERFACE
    const UI_CONFIG = {
        tema: {
            cores: {
                primaria: '#3498db',
                secundaria: '#2c3e50',
                sucesso: '#27ae60',
                alerta: '#f39c12',
                erro: '#e74c3c',
                info: '#74b9ff'
            },
            gradientes: {
                header: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                manha: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                tarde: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
                meta: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
            }
        },
        animacoes: {
            duracao: 300, // ms
            easing: 'ease-in-out',
            loading: true
        },
        responsive: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },
        notificacoes: {
            duracao: 3000, // ms
            posicao: 'top-right',
            maxVisible: 3
        }
    };

    // 📊 CONFIGURAÇÕES DE HISTÓRICO E LOGS
    const HISTORICO_CONFIG = {
        eventos: {
            'posto_selecionado': {
                categoria: 'supervisor',
                importancia: 'media',
                salvarDetalhes: true
            },
            'colaborador_confirmado': {
                categoria: 'lider',
                importancia: 'alta',
                salvarDetalhes: true
            },
            'escala_finalizada': {
                categoria: 'sistema',
                importancia: 'alta',
                salvarDetalhes: true
            },
            'dados_limpos': {
                categoria: 'sistema',
                importancia: 'alta',
                salvarDetalhes: true
            },
            'erro_sistema': {
                categoria: 'erro',
                importancia: 'critica',
                salvarDetalhes: true
            }
        },
        retencao: {
            logs: 90, // dias
            backup: 365, // dias
            auditoria: 1095 // 3 anos
        },
        formato: {
            timestamp: 'YYYY-MM-DD HH:mm:ss',
            timezone: 'America/Sao_Paulo'
        }
    };

    // 🔧 CONFIGURAÇÕES DE DESENVOLVIMENTO
    const DEV_CONFIG = {
        mockData: true, // Usar dados simulados
        apiDelay: 1000, // Simular delay de API
        consoleLogging: true,
        debugMode: false,
        testMode: false
    };

    // 🌐 URLS E ENDPOINTS
    const ENDPOINTS = {
        telegram: {
            sendMessage: `${TELEGRAM_CONFIG.apiUrl}{botToken}/sendMessage`,
            getUpdates: `${TELEGRAM_CONFIG.apiUrl}{botToken}/getUpdates`
        },
        sheets: {
            read: 'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}',
            write: 'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}',
            batchUpdate: 'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchUpdate'
        },
        backup: {
            create: '/backup/create',
            restore: '/backup/restore/{version}',
            list: '/backup/list'
        }
    };

    // 📱 CONFIGURAÇÕES PWA (Future)
    const PWA_CONFIG = {
        enabled: false,
        name: 'Horas Extras',
        shortName: 'HorasExtra',
        description: 'Sistema de Gestão de Horas Extras',
        themeColor: '#3498db',
        backgroundColor: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        startUrl: '/',
        scope: '/'
    };

    // 🔐 VARIÁVEIS PRIVADAS
    let currentConfig = {};
    let environment = SYSTEM_CONFIG.environment;
    let initialized = false;

    // 🔧 MÉTODOS PRIVADOS
    function mergeConfigs() {
        currentConfig = {
            system: SYSTEM_CONFIG,
            horarios: HORARIOS_CONFIG,
            users: USERS_CONFIG,
            metas: METAS_CONFIG,
            telegram: TELEGRAM_CONFIG,
            sheets: SHEETS_CONFIG,
            ui: UI_CONFIG,
            historico: HISTORICO_CONFIG,
            dev: environment === 'development' ? DEV_CONFIG : {},
            endpoints: ENDPOINTS,
            pwa: PWA_CONFIG
        };
    }

    function validateConfig() {
        const required = ['system', 'horarios', 'users', 'ui'];
        const missing = required.filter(key => !currentConfig[key]);
        
        if (missing.length > 0) {
            throw new Error(`Configurações obrigatórias não encontradas: ${missing.join(', ')}`);
        }
        
        return true;
    }

    function logConfig() {
        if (SYSTEM_CONFIG.debug) {
            console.group('🔧 Configuração do Sistema');
            console.log('Versão:', SYSTEM_CONFIG.version);
            console.log('Ambiente:', environment);
            console.log('Debug:', SYSTEM_CONFIG.debug);
            console.groupEnd();
        }
    }

    // 🌐 API PÚBLICA
    return {
        
        // Inicialização
        init: function(customConfig = {}) {
            try {
                // Merge configurações customizadas
                Object.assign(SYSTEM_CONFIG, customConfig.system || {});
                Object.assign(TELEGRAM_CONFIG, customConfig.telegram || {});
                Object.assign(SHEETS_CONFIG, customConfig.sheets || {});
                
                // Montar configuração final
                mergeConfigs();
                validateConfig();
                
                initialized = true;
                logConfig();
                
                // Disparar evento de inicialização
                document.dispatchEvent(new CustomEvent('configInitialized', {
                    detail: { config: this.getAll() }
                }));
                
                return true;
            } catch (error) {
                console.error('❌ Erro ao inicializar configurações:', error);
                return false;
            }
        },

        // Getters
        get: function(path) {
            if (!initialized) {
                console.warn('⚠️ Configurações não inicializadas');
                return null;
            }
            
            const keys = path.split('.');
            let value = currentConfig;
            
            for (const key of keys) {
                value = value?.[key];
                if (value === undefined) break;
            }
            
            return value;
        },

        getAll: function() {
            return initialized ? { ...currentConfig } : null;
        },

        getSystem: function() {
            return this.get('system');
        },

        getHorarios: function() {
            return this.get('horarios');
        },

        getUsers: function() {
            return this.get('users');
        },

        getTelegram: function() {
            return this.get('telegram');
        },

        getSheets: function() {
            return this.get('sheets');
        },

        getUI: function() {
            return this.get('ui');
        },

        // Setters
        set: function(path, value) {
            if (!initialized) {
                console.warn('⚠️ Configurações não inicializadas');
                return false;
            }
            
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = currentConfig;
            
            for (const key of keys) {
                if (!target[key]) target[key] = {};
                target = target[key];
            }
            
            target[lastKey] = value;
            
            // Disparar evento de mudança
            document.dispatchEvent(new CustomEvent('configChanged', {
                detail: { path, value }
            }));
            
            return true;
        },

        // Utilitários
        isDebug: function() {
            return this.get('system.debug') || false;
        },

        isDevelopment: function() {
            return this.get('system.environment') === 'development';
        },

        getVersion: function() {
            return this.get('system.version');
        },

        // Configurações específicas
        calcularSupervisorAtual: function(semana) {
            const supervisores = this.get('users.supervisores');
            const semanaBase = this.get('users.semanaBase');
            const automatica = this.get('users.alternanciaAutomatica');
            
            if (!automatica || !supervisores || supervisores.length === 0) {
                return supervisores?.[0] || null;
            }
            
            const indice = (semana - semanaBase) % supervisores.length;
            return supervisores[indice >= 0 ? indice : supervisores.length + indice];
        },

        formatarEndpoint: function(key, params = {}) {
            let endpoint = this.get(`endpoints.${key}`);
            if (!endpoint) return null;
            
            // Substituir parâmetros na URL
            Object.keys(params).forEach(param => {
                endpoint = endpoint.replace(`{${param}}`, params[param]);
            });
            
            return endpoint;
        },

        // Status
        isInitialized: function() {
            return initialized;
        },

        reset: function() {
            initialized = false;
            currentConfig = {};
            environment = 'production';
        }
    };

})();

// 🎯 Export para testes (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
