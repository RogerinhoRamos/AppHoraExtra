/**
 * 🔧 SISTEMA DE HORAS EXTRAS - UTILITÁRIOS
 * Funções auxiliares e utilitárias do sistema
 */

const AppUtils = (function() {
    
    // 📅 UTILITÁRIOS DE DATA
    const DateUtils = {
        
        // Formatar data para exibição
        formatDate: function(date, format = 'dd/MM/yyyy') {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            const formats = {
                'dd/MM/yyyy': `${day}/${month}/${year}`,
                'MM/dd/yyyy': `${month}/${day}/${year}`,
                'yyyy-MM-dd': `${year}-${month}-${day}`,
                'dd/MM': `${day}/${month}`,
                'HH:mm': `${hours}:${minutes}`,
                'dd/MM/yyyy HH:mm': `${day}/${month}/${year} ${hours}:${minutes}`,
                'relative': this.getRelativeDate(d)
            };
            
            return formats[format] || formats['dd/MM/yyyy'];
        },
        
        // Data relativa (há 2 dias, amanhã, etc)
        getRelativeDate: function(date) {
            const now = new Date();
            const target = new Date(date);
            const diffTime = target.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Amanhã';
            if (diffDays === -1) return 'Ontem';
            if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
            if (diffDays < -1 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;
            
            return this.formatDate(date, 'dd/MM');
        },
        
        // Obter número da semana ISO
        getWeekNumber: function(date = new Date()) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
            const week1 = new Date(d.getFullYear(), 0, 4);
            return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        },
        
        // Obter datas de início e fim da semana
        getWeekDates: function(weekNumber, year = new Date().getFullYear()) {
            const jan1 = new Date(year, 0, 1);
            const daysToFirstMonday = (1 - jan1.getDay() + 7) % 7;
            const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
            
            const startDate = new Date(firstMonday);
            startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
            
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            
            return { start: startDate, end: endDate };
        },
        
        // Verificar se é feriado (base simples, pode ser expandida)
        isHoliday: function(date) {
            const d = new Date(date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            
            // Feriados fixos básicos (pode ser expandido)
            const fixedHolidays = [
                '01-01', // Ano Novo
                '04-21', // Tiradentes
                '09-07', // Independência
                '10-12', // Nossa Senhora Aparecida
                '11-02', // Finados
                '11-15', // Proclamação da República
                '12-25'  // Natal
            ];
            
            const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return fixedHolidays.includes(dateStr);
        },
        
        // Calcular diferença em horas entre duas datas
        getDifferenceInHours: function(startDate, endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffMs = end.getTime() - start.getTime();
            return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Arredondar para 1 decimal
        }
    };

    // 🔢 UTILITÁRIOS DE CÁLCULO
    const CalcUtils = {
        
        // Calcular horas extras por configuração
        calculateExtraHours: function(config) {
            let total = 0;
            
            if (config.sabado && config.sabado.ativo) {
                total += config.sabado.horas || 3;
            }
            
            if (config.domingo && config.domingo.ativo) {
                total += config.domingo.horas || 7;
            }
            
            if (config.diasSemana) {
                const diasConfig = AppConfig.get('horarios.turnoTarde.diasConfig');
                const configDias = diasConfig[config.diasSemana];
                if (configDias) {
                    total += configDias.totalHoras;
                }
            }
            
            if (config.extensoes) {
                config.extensoes.forEach(ext => {
                    total += ext.horas || 0;
                });
            }
            
            return total;
        },
        
        // Calcular porcentagem da meta
        calculateMetaPercentage: function(atual, meta) {
            if (!meta || meta === 0) return 0;
            return Math.min((atual / meta) * 100, 100);
        },
        
        // Calcular multiplicador de horas por tipo de dia
        calculateHourMultiplier: function(tipoEvento) {
            const tipos = AppData.getTiposEventos();
            return tipos[tipoEvento]?.multiplicador || 1;
        },
        
        // Arredondar para múltiplos (ex: 0.5h)
        roundToMultiple: function(number, multiple = 0.5) {
            return Math.round(number / multiple) * multiple;
        },
        
        // Somar arrays de números
        sumArray: function(numbers) {
            return numbers.reduce((sum, num) => sum + (Number(num) || 0), 0);
        },
        
        // Calcular média
        average: function(numbers) {
            const validNumbers = numbers.filter(n => !isNaN(n));
            return validNumbers.length > 0 ? this.sumArray(validNumbers) / validNumbers.length : 0;
        }
    };

    // 🎨 UTILITÁRIOS DE FORMATAÇÃO
    const FormatUtils = {
        
        // Formatar horas (ex: 2.5 -> "2h 30min")
        formatHours: function(hours, simple = false) {
            if (!hours || hours === 0) return simple ? '0h' : '0 horas';
            
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            
            if (simple) {
                if (m === 0) return `${h}h`;
                return `${h}h${m}min`;
            }
            
            let result = '';
            if (h > 0) result += `${h} hora${h > 1 ? 's' : ''}`;
            if (m > 0) {
                if (result) result += ' e ';
                result += `${m} minuto${m > 1 ? 's' : ''}`;
            }
            
            return result || '0 horas';
        },
        
        // Formatar número com separadores
        formatNumber: function(number, decimals = 0) {
            return new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(number);
        },
        
        // Formatar porcentagem
        formatPercentage: function(value, decimals = 0) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'percent',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value / 100);
        },
        
        // Capitalizar primeira letra
        capitalize: function(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
        
        // Formatar nome (Nome Sobrenome)
        formatName: function(fullName, maxLength = 20) {
            if (!fullName) return '';
            
            const parts = fullName.trim().split(' ');
            if (parts.length === 1) return parts[0];
            
            const firstName = parts[0];
            const lastName = parts[parts.length - 1];
            const formatted = `${firstName} ${lastName}`;
            
            if (formatted.length <= maxLength) return formatted;
            return `${firstName} ${lastName.charAt(0)}.`;
        },
        
        // Truncar texto
        truncate: function(text, maxLength = 50, suffix = '...') {
            if (!text || text.length <= maxLength) return text;
            return text.substr(0, maxLength - suffix.length) + suffix;
        }
    };

    // ✅ UTILITÁRIOS DE VALIDAÇÃO
    const ValidationUtils = {
        
        // Validar RE (Registro de Empregado)
        isValidRE: function(re) {
            return /^\d{5}$/.test(re);
        },
        
        // Validar nome
        isValidName: function(name) {
            return name && name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
        },
        
        // Validar código de posto
        isValidPostoCode: function(code) {
            return code && code.trim().length > 0;
        },
        
        // Validar horário (HH:MM)
        isValidTime: function(time) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
        },
        
        // Validar email
        isValidEmail: function(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        
        // Validar URL
        isValidUrl: function(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },
        
        // Validar número de semana
        isValidWeekNumber: function(week) {
            return Number.isInteger(week) && week >= 1 && week <= 53;
        },
        
        // Validar configuração de horas
        isValidHoursConfig: function(config) {
            if (!config || typeof config !== 'object') return false;
            
            // Validar campos obrigatórios baseado no tipo
            if (config.tipo === 'sabado' || config.tipo === 'domingo') {
                return typeof config.horas === 'number' && config.horas > 0;
            }
            
            if (config.tipo === 'diasSemana') {
                return Number.isInteger(config.dias) && config.dias >= 0 && config.dias <= 5;
            }
            
            return true;
        }
    };

    // 🔍 UTILITÁRIOS DE BUSCA E FILTRO
    const SearchUtils = {
        
        // Busca fuzzy simples
        fuzzySearch: function(query, items, searchFields) {
            if (!query || !items || items.length === 0) return items;
            
            const queryLower = query.toLowerCase().trim();
            
            return items.filter(item => {
                return searchFields.some(field => {
                    const value = this.getNestedProperty(item, field);
                    return value && value.toString().toLowerCase().includes(queryLower);
                });
            }).sort((a, b) => {
                // Ordenar por relevância (matches no início têm prioridade)
                const aRelevance = this.getRelevanceScore(queryLower, a, searchFields);
                const bRelevance = this.getRelevanceScore(queryLower, b, searchFields);
                return bRelevance - aRelevance;
            });
        },
        
        // Obter propriedade aninhada (ex: 'user.name')
        getNestedProperty: function(obj, path) {
            return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
        },
        
        // Calcular pontuação de relevância
        getRelevanceScore: function(query, item, searchFields) {
            let score = 0;
            
            searchFields.forEach(field => {
                const value = this.getNestedProperty(item, field);
                if (value) {
                    const valueLower = value.toString().toLowerCase();
                    if (valueLower.startsWith(query)) score += 10;
                    else if (valueLower.includes(query)) score += 5;
                }
            });
            
            return score;
        },
        
        // Filtrar por múltiplos critérios
        multiFilter: function(items, filters) {
            return items.filter(item => {
                return Object.entries(filters).every(([key, value]) => {
                    if (value === null || value === undefined || value === '') return true;
                    
                    const itemValue = this.getNestedProperty(item, key);
                    
                    if (Array.isArray(value)) {
                        return value.includes(itemValue);
                    }
                    
                    return itemValue === value;
                });
            });
        }
    };

    // 🎨 UTILITÁRIOS DE UI
    const UIUtils = {
        
        // Obter cor baseada em porcentagem
        getColorByPercentage: function(percentage, theme = 'default') {
            const themes = {
                default: {
                    low: '#27ae60',      // Verde
                    medium: '#f39c12',   // Laranja  
                    high: '#e74c3c'      // Vermelho
                },
                inverted: {
                    low: '#e74c3c',      // Vermelho (ruim)
                    medium: '#f39c12',   // Laranja
                    high: '#27ae60'      // Verde (bom)
                }
            };
            
            const colors = themes[theme] || themes.default;
            
            if (percentage <= 50) return colors.low;
            if (percentage <= 80) return colors.medium;
            return colors.high;
        },
        
        // Gerar gradiente CSS
        generateGradient: function(color1, color2, direction = '135deg') {
            return `linear-gradient(${direction}, ${color1}, ${color2})`;
        },
        
        // Obter ícone baseado no tipo
        getIconByType: function(type) {
            const icons = {
                // Turnos
                manha: '🌅',
                tarde: '🌆',
                noite: '🌙',
                
                // Status
                pendente: '⏳',
                confirmado: '✅',
                problema: '⚠️',
                cancelado: '❌',
                
                // Ações
                selecionar: '☑️',
                editar: '✏️',
                excluir: '🗑️',
                salvar: '💾',
                enviar: '📤',
                
                // Tipos de dados
                posto: '🏭',
                colaborador: '👤',
                supervisor: '👔',
                lider: '🎯',
                
                // Eventos
                feriado: '🎉',
                normal: '📅',
                especial: '⭐',
                
                default: '📋'
            };
            
            return icons[type] || icons.default;
        },
        
        // Classe CSS baseada no status
        getStatusClass: function(status) {
            const classes = {
                ativo: 'status-active',
                inativo: 'status-inactive',
                pendente: 'status-pending',
                confirmado: 'status-confirmed',
                problema: 'status-error',
                sucesso: 'status-success',
                alerta: 'status-warning'
            };
            
            return classes[status] || 'status-default';
        }
    };

    // 🔧 UTILITÁRIOS GERAIS
    const GeneralUtils = {
        
        // Debounce function
        debounce: function(func, wait, immediate = false) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        },
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Deep clone object
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (obj instanceof Set) return new Set(Array.from(obj).map(item => this.deepClone(item)));
            if (obj instanceof Map) return new Map(Array.from(obj).map(([k, v]) => [k, this.deepClone(v)]));
            
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        },
        
        // Gerar ID único
        generateId: function(prefix = '') {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 5);
            return `${prefix}${timestamp}${random}`;
        },
        
        // Aguardar um tempo
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        // Tentar executar função com retry
        retry: async function(fn, maxAttempts = 3, delay = 1000) {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    if (attempt === maxAttempts) throw error;
                    await this.sleep(delay * attempt);
                }
            }
        },
        
        // Verificar se é mobile
        isMobile: function() {
            return window.innerWidth <= 768;
        },
        
        // Verificar se é tablet
        isTablet: function() {
            return window.innerWidth > 768 && window.innerWidth <= 1024;
        },
        
        // Salvar no localStorage com fallback
        saveToStorage: function(key, data, useSession = false) {
            try {
                const storage = useSession ? sessionStorage : localStorage;
                storage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.warn('Erro ao salvar no storage:', error);
                return false;
            }
        },
        
        // Carregar do localStorage com fallback
        loadFromStorage: function(key, defaultValue = null, useSession = false) {
            try {
                const storage = useSession ? sessionStorage : localStorage;
                const item = storage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Erro ao carregar do storage:', error);
                return defaultValue;
            }
        }
    };

    // 🌐 API PÚBLICA
    return {
        // Expor módulos
        date: DateUtils,
        calc: CalcUtils,
        format: FormatUtils,
        validation: ValidationUtils,
        search: SearchUtils,
        ui: UIUtils,
        general: GeneralUtils,
        
        // Funções de conveniência mais usadas
        formatDate: DateUtils.formatDate,
        formatHours: FormatUtils.formatHours,
        formatName: FormatUtils.formatName,
        getWeekNumber: DateUtils.getWeekNumber,
        calculateExtraHours: CalcUtils.calculateExtraHours,
        isValidRE: ValidationUtils.isValidRE,
        fuzzySearch: SearchUtils.fuzzySearch,
        debounce: GeneralUtils.debounce,
        generateId: GeneralUtils.generateId,
        isMobile: GeneralUtils.isMobile,
        
        // Função para log com timestamp
        log: function(message, level = 'info') {
            const timestamp = DateUtils.formatDate(new Date(), 'dd/MM/yyyy HH:mm');
            const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
            
            switch (level) {
                case 'error':
                    console.error(prefix, message);
                    break;
                case 'warn':
                    console.warn(prefix, message);
                    break;
                case 'debug':
                    if (AppConfig && AppConfig.isDebug()) {
                        console.debug(prefix, message);
                    }
                    break;
                default:
                    console.log(prefix, message);
            }
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppUtils;
}