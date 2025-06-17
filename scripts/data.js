/**
 * 📊 SISTEMA DE HORAS EXTRAS - DADOS
 * Módulo de gerenciamento de dados do sistema
 */

const AppData = (function() {
    
    // 🏭 DADOS DOS POSTOS
    const POSTOS_DATA = [
        { code: 'GT3100', desc: '42 TC14', area: 'Torno', criticidade: 'alta' },
        { code: 'MU450', desc: '42 TC04', area: 'Torno', criticidade: 'media' },
        { code: 'TVC518', desc: '42 TV01', area: 'Torno Vertical', criticidade: 'alta' },
        { code: 'TVC 8300', desc: '42 TV02/03', area: 'Torno Vertical', criticidade: 'alta' },
        { code: 'LU300', desc: '42 TC02', area: 'Torno', criticidade: 'media' },
        { code: 'MW300', desc: '42 TC15', area: 'Torno', criticidade: 'media' },
        { code: 'MW301', desc: '42 TC16', area: 'Torno', criticidade: 'media' },
        { code: 'MV5025', desc: '41 CV01', area: 'Centro Usinagem', criticidade: 'alta' },
        { code: 'CUV02', desc: '41 CV02', area: 'Centro Usinagem', criticidade: 'alta' },
        { code: 'MA600', desc: '41 CH01', area: 'Centro Horizontal', criticidade: 'alta' },
        { code: 'MA800', desc: '41 CH02', area: 'Centro Horizontal', criticidade: 'alta' },
        { code: 'NH8000', desc: '41 CH03', area: 'Centro Horizontal', criticidade: 'alta' },
        { code: 'NH6300', desc: '41 CH04', area: 'Centro Horizontal', criticidade: 'media' },
        { code: 'HC8800', desc: '41 CH06', area: 'Centro Horizontal', criticidade: 'media' },
        { code: 'TREVISAN', desc: '41 CH05', area: 'Centro Horizontal', criticidade: 'media' },
        { code: 'BALANC.01 CB', desc: '43 BV01', area: 'Balanceamento', criticidade: 'baixa' },
        { code: 'BALANC.02 CB', desc: '43 BV02', area: 'Balanceamento', criticidade: 'baixa' },
        { code: 'BALANC.DINÂM.', desc: '43 EQ227', area: 'Balanceamento', criticidade: 'baixa' },
        { code: 'FURAD. RADIAL 1', desc: '43 FU01', area: 'Furadeira', criticidade: 'baixa' },
        { code: 'FURAD. RADIAL 2', desc: '43 FU02', area: 'Furadeira', criticidade: 'baixa' },
        { code: 'SERRA', desc: '43 SF02', area: 'Serra', criticidade: 'baixa' },
        { code: 'MU630', desc: '42 TC01', area: 'Torno', criticidade: 'media' },
        { code: 'PUMA700', desc: '42 TC11', area: 'Torno', criticidade: 'media' },
        { code: 'TCN521', desc: '42 TC06', area: 'Torno', criticidade: 'media' },
        { code: 'PUMA2500', desc: '42 TC10', area: 'Torno', criticidade: 'media' },
        { code: 'TCN536', desc: '42 TC07', area: 'Torno', criticidade: 'media' },
        { code: 'PUMA300', desc: '42 TC09', area: 'Torno', criticidade: 'media' },
        { code: 'HD310', desc: '42 TC17', area: 'Torno', criticidade: 'baixa' },
        { code: 'DT20', desc: '42 TC08', area: 'Torno', criticidade: 'baixa' },
        { code: 'FERRAMENTEIRO', desc: 'FERR', area: 'Ferramentaria', criticidade: 'alta' },
        { code: 'LIDER', desc: 'LIDERANÇA', area: 'Supervisão', criticidade: 'alta' }
    ];

    // 👥 COLABORADORES TURNO A (Manhã)
    const COLABORADORES_TURNO_A = [
        { re: '18239', nome: 'Adilson Gonçalves Leonel', status: 'ativo', especialidades: ['torno', 'centro'] },
        { re: '18094', nome: 'Adriano Farias de Melo', status: 'ativo', especialidades: ['centro'] },
        { re: '18061', nome: 'Aguinaldo Aparecido Nogueira', status: 'ativo', especialidades: ['torno'] },
        { re: '18031', nome: 'Aldemir Silva Almeida', status: 'ativo', especialidades: ['centro'] },
        { re: '18275', nome: 'Bruno Brito Oliveira Santos', status: 'ativo', especialidades: ['torno'] },
        { re: '18029', nome: 'Claudenir Ensides', status: 'ativo', especialidades: ['liderança'], cargo: 'supervisor' },
        { re: '18024', nome: 'Claudio Ramos', status: 'ativo', especialidades: ['centro'] },
        { re: '18181', nome: 'Cleber Luiz da Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18245', nome: 'Emerson Alves Rodrigues', status: 'ativo', especialidades: ['torno'] },
        { re: '18053', nome: 'Esdras Brambila', status: 'ativo', especialidades: ['torno'] },
        { re: '18099', nome: 'Ewerton Carvalho da Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18056', nome: 'Felipe Felix Martins da Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18255', nome: 'Fernando Damiao Feitoza de Almeida', status: 'ativo', especialidades: ['torno'] },
        { re: '18187', nome: 'Gianluca Soares', status: 'ativo', especialidades: ['torno'] },
        { re: '18270', nome: 'Jean Marcos Rocha Mendes', status: 'ativo', especialidades: ['balanceamento'] },
        { re: '18003', nome: 'Jean Michel Crivelaro', status: 'ativo', especialidades: ['torno'] },
        { re: '18249', nome: 'Julio Morais Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18174', nome: 'Marcelo Jose Pratta', status: 'ativo', especialidades: ['torno'] },
        { re: '18198', nome: 'Marcos Antonio Escuer', status: 'ativo', especialidades: ['centro'] },
        { re: '18241', nome: 'Marcos Paulo Pinheiro', status: 'ativo', especialidades: ['torno'] },
        { re: '18031', nome: 'Marcos Rogerio Cruz', status: 'ativo', especialidades: ['torno'] },
        { re: '18188', nome: 'Paulo Candido de Oliveira', status: 'ativo', especialidades: ['torno'] },
        { re: '18243', nome: 'Rafael Carvalho da Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18121', nome: 'Reginaldo Fabiano Campaneli', status: 'ativo', especialidades: ['torno'] },
        { re: '18032', nome: 'Robison Luiz Bellodi', status: 'ativo', especialidades: ['centro'] },
        { re: '18179', nome: 'Rodrigo Eusebio da Silva', status: 'ativo', especialidades: ['torno'] },
        { re: '18025', nome: 'Rogerio Guion', status: 'ativo', especialidades: ['torno'] },
        { re: '18073', nome: 'Willians Francisco de Oliveira', status: 'ativo', especialidades: ['centro'] },
        { re: '18109', nome: 'Luciano Magalhães', status: 'ativo', especialidades: ['ferramentaria'], cargo: 'ferramenteiro' }
    ];

    // 👥 COLABORADORES TURNO B (Tarde)
    const COLABORADORES_TURNO_B = [
        { re: '18326', nome: 'Adilson Gonçalves da Silva', status: 'ativo', especialidades: ['torno'] },
        { re: '18248', nome: 'Alexandre Domingos Honorio', status: 'ativo', especialidades: ['torno'] },
        { re: '18273', nome: 'Aluisio Martins de Oliveira', status: 'ativo', especialidades: ['balanceamento'] },
        { re: '18037', nome: 'Amilton Patera', status: 'ativo', especialidades: ['torno', 'centro'] },
        { re: '18019', nome: 'Antonio Francisco de Souza', status: 'ativo', especialidades: ['centro'] },
        { re: '18182', nome: 'Edilson Galdeano', status: 'ativo', especialidades: ['centro'] },
        { re: '18051', nome: 'Edir da Silva Brino', status: 'ativo', especialidades: ['torno'] },
        { re: '18035', nome: 'Edison Luiz Alves de Campos', status: 'ativo', especialidades: ['torno'] },
        { re: '18232', nome: 'Ernani Ramiro da Silva', status: 'ativo', especialidades: ['torno'] },
        { re: '18040', nome: 'Gabriel Borssatto', status: 'ativo', especialidades: ['torno'] },
        { re: '18190', nome: 'Ivan Moraes Dos Santos', status: 'ativo', especialidades: ['torno'] },
        { re: '18253', nome: 'Jonathan de Mello Santos', status: 'ativo', especialidades: ['centro'] },
        { re: '18114', nome: 'Juliano de Almeida Padoin', status: 'ativo', especialidades: ['centro'] },
        { re: '18249', nome: 'Júlio Morais Silva', status: 'ativo', especialidades: ['centro'] },
        { re: '18191', nome: 'Kaue Escuer Fernandes', status: 'ativo', especialidades: ['torno'] },
        { re: '18277', nome: 'Lucas Augusto Pereira', status: 'ativo', especialidades: ['torno'] },
        { re: '18109', nome: 'Luciano Magalhães', status: 'ativo', especialidades: ['ferramentaria'] },
        { re: '18295', nome: 'Milton Jose de Souza Silva Junior', status: 'ativo', especialidades: ['torno'] },
        { re: '18079', nome: 'Raildo Xavier de Jesus', status: 'ativo', especialidades: ['centro'] },
        { re: '18058', nome: 'Raphael Augusto Dos Anjos Moreira', status: 'ativo', especialidades: ['centro'] },
        { re: '18028', nome: 'Reinaldo Pires', status: 'ativo', especialidades: ['centro'] },
        { re: '18192', nome: 'Ricardo Nascimento Moraes', status: 'ativo', especialidades: ['centro'] },
        { re: '18173', nome: 'Robson Bassaroti', status: 'ativo', especialidades: ['torno'] },
        { re: '18193', nome: 'Rogério Costa Ramos', status: 'ativo', especialidades: ['liderança'], cargo: 'supervisor' },
        { re: '18271', nome: 'Samuel Ferreira de Lima', status: 'ativo', especialidades: ['balanceamento'] },
        { re: '18195', nome: 'Sergio Balbino da Silva', status: 'ativo', especialidades: ['balanceamento'] },
        { re: '18291', nome: 'Thiago Jose Duarte', status: 'ativo', especialidades: ['centro'] },
        { re: '18320', nome: 'Thiago Pereira Dos Santos', status: 'ativo', especialidades: ['torno'] },
        { re: '18228', nome: 'Vladimir Donizete Garcia', status: 'ativo', especialidades: ['torno'] }
    ];

    // 📊 ESTRUTURA DE DADOS DA SEMANA
    const SEMANA_TEMPLATE = {
        numero: null,
        ano: null,
        dataInicio: null,
        dataFim: null,
        supervisorAtivo: null,
        metaSemanal: 150,
        status: 'planejamento', // 'planejamento', 'executando', 'finalizada'
        turnos: {
            manha: {
                supervisor: null,
                postosSelecionados: new Set(),
                colaboradoresConfirmados: new Map(),
                totalHoras: 0,
                configuracoes: {
                    sabado: { ativo: false, horas: 3 },
                    domingo: { ativo: false, horas: 7 },
                    extensoes: new Map() // dia -> { inicio, fim, horas }
                }
            },
            tarde: {
                supervisor: null,
                postosSelecionados: new Set(),
                colaboradoresConfirmados: new Map(),
                totalHoras: 0,
                configuracoes: {
                    diasSemana: 0, // 0-5 dias
                    horasPorDia: 2.5,
                    diasAtivos: new Set() // ['segunda', 'terca', ...]
                }
            }
        },
        eventos: [],
        observacoes: '',
        criadoEm: null,
        atualizadoEm: null
    };

    // 📅 TIPOS DE EVENTOS/DIAS ESPECIAIS
    const TIPOS_EVENTOS = {
        feriado_nacional: {
            nome: 'Feriado Nacional',
            multiplicador: 2.0,
            horasBase: 8,
            cor: '#e74c3c'
        },
        feriado_estadual: {
            nome: 'Feriado Estadual',
            multiplicador: 1.8,
            horasBase: 8,
            cor: '#e67e22'
        },
        ponte: {
            nome: 'Ponte/Emenda',
            multiplicador: 1.5,
            horasBase: 6,
            cor: '#f39c12'
        },
        facultativo: {
            nome: 'Ponto Facultativo',
            multiplicador: 1.5,
            horasBase: 6,
            cor: '#f1c40f'
        },
        compensacao: {
            nome: 'Compensação',
            multiplicador: 1.0,
            horasBase: 10,
            cor: '#3498db'
        },
        especial: {
            nome: 'Demanda Especial',
            multiplicador: 1.2,
            horasBase: 4,
            cor: '#9b59b6'
        }
    };

    // 🗄️ CACHE DE DADOS
    let cacheData = {
        semanaAtual: null,
        semanas: new Map(), // numero -> dadosSemana
        historico: [],
        estatisticas: null,
        ultimaAtualizacao: null
    };

    // 🔧 VARIÁVEIS PRIVADAS
    let initialized = false;
    let currentWeek = null;

    // 🔧 MÉTODOS PRIVADOS
    function getCurrentWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.ceil(diff / oneWeek);
    }

    function createWeekData(weekNumber, year = new Date().getFullYear()) {
        const semana = JSON.parse(JSON.stringify(SEMANA_TEMPLATE));
        semana.numero = weekNumber;
        semana.ano = year;
        semana.criadoEm = new Date().toISOString();
        
        // Calcular datas da semana
        const jan1 = new Date(year, 0, 1);
        const daysToFirstMonday = ((1 - jan1.getDay() + 7) % 7) || 7;
        const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
        
        semana.dataInicio = new Date(firstMonday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
        semana.dataFim = new Date(semana.dataInicio.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        // Definir supervisor baseado na configuração
        const supervisor = AppConfig.calcularSupervisorAtual(weekNumber);
        semana.supervisorAtivo = supervisor?.id || 'claudenir';
        
        if (semana.supervisorAtivo === 'claudenir') {
            semana.turnos.manha.supervisor = 'claudenir';
            semana.turnos.tarde.supervisor = 'rogerio';
        } else {
            semana.turnos.manha.supervisor = 'rogerio';
            semana.turnos.tarde.supervisor = 'claudenir';
        }
        
        return semana;
    }

    function validateWeekData(semana) {
        const required = ['numero', 'ano', 'supervisorAtivo'];
        const missing = required.filter(field => semana[field] === null || semana[field] === undefined);
        
        if (missing.length > 0) {
            throw new Error(`Dados da semana inválidos. Campos obrigatórios: ${missing.join(', ')}`);
        }
        
        return true;
    }

    function updateWeekCache(semana) {
        validateWeekData(semana);
        semana.atualizadoEm = new Date().toISOString();
        cacheData.semanas.set(semana.numero, semana);
        cacheData.ultimaAtualizacao = new Date().toISOString();
        
        // Disparar evento
        document.dispatchEvent(new CustomEvent('weekDataUpdated', {
            detail: { semana: semana.numero, data: semana }
        }));
    }

    // 🌐 API PÚBLICA
    return {
        
        // 🚀 Inicialização
        init: function() {
            try {
                currentWeek = getCurrentWeekNumber();
                cacheData.semanaAtual = this.getOrCreateWeek(currentWeek);
                initialized = true;
                
                console.log(`📊 Dados inicializados - Semana ${currentWeek}`);
                
                // Disparar evento
                document.dispatchEvent(new CustomEvent('dataInitialized', {
                    detail: { currentWeek, semanaAtual: cacheData.semanaAtual }
                }));
                
                return true;
            } catch (error) {
                console.error('❌ Erro ao inicializar dados:', error);
                return false;
            }
        },

        // 📊 Getters de Dados Estáticos
        getPostos: function() {
            return [...POSTOS_DATA];
        },

        getColaboradoresTurnoA: function() {
            return [...COLABORADORES_TURNO_A];
        },

        getColaboradoresTurnoB: function() {
            return [...COLABORADORES_TURNO_B];
        },

        getAllColaboradores: function() {
            return [...COLABORADORES_TURNO_A, ...COLABORADORES_TURNO_B];
        },

        getTiposEventos: function() {
            return { ...TIPOS_EVENTOS };
        },

        // 📅 Gerenciamento de Semanas
        getCurrentWeek: function() {
            return cacheData.semanaAtual;
        },

        getWeek: function(weekNumber) {
            return cacheData.semanas.get(weekNumber) || null;
        },

        getOrCreateWeek: function(weekNumber, year) {
            let semana = this.getWeek(weekNumber);
            
            if (!semana) {
                semana = createWeekData(weekNumber, year);
                updateWeekCache(semana);
            }
            
            return semana;
        },

        setCurrentWeek: function(weekNumber) {
            const semana = this.getOrCreateWeek(weekNumber);
            cacheData.semanaAtual = semana;
            currentWeek = weekNumber;
            
            document.dispatchEvent(new CustomEvent('currentWeekChanged', {
                detail: { weekNumber, semana }
            }));
            
            return semana;
        },

        // 🎯 Gerenciamento de Postos
        selectPosto: function(postoCode, turno, weekNumber = currentWeek) {
            const semana = this.getOrCreateWeek(weekNumber);
            const turnoData = semana.turnos[turno];
            
            if (!turnoData) {
                throw new Error(`Turno inválido: ${turno}`);
            }
            
            turnoData.postosSelecionados.add(postoCode);
            updateWeekCache(semana);
            
            // Log do evento
            semana.eventos.push({
                timestamp: new Date().toISOString(),
                tipo: 'posto_selecionado',
                usuario: 'supervisor',
                detalhes: { posto: postoCode, turno }
            });
            
            return true;
        },

        unselectPosto: function(postoCode, turno, weekNumber = currentWeek) {
            const semana = this.getOrCreateWeek(weekNumber);
            const turnoData = semana.turnos[turno];
            
            turnoData.postosSelecionados.delete(postoCode);
            turnoData.colaboradoresConfirmados.delete(postoCode);
            updateWeekCache(semana);
            
            return true;
        },

        getPostosSelecionados: function(turno, weekNumber = currentWeek) {
            const semana = this.getWeek(weekNumber);
            if (!semana) return new Set();
            
            return new Set(semana.turnos[turno]?.postosSelecionados || []);
        },

        // 👥 Gerenciamento de Colaboradores
        confirmColaborador: function(postoCode, colaboradorRE, config, weekNumber = currentWeek) {
            const semana = this.getOrCreateWeek(weekNumber);
            
            // Encontrar turno do posto
            let turno = null;
            for (const [turnoKey, turnoData] of Object.entries(semana.turnos)) {
                if (turnoData.postosSelecionados.has(postoCode)) {
                    turno = turnoKey;
                    break;
                }
            }
            
            if (!turno) {
                throw new Error(`Posto ${postoCode} não selecionado em nenhum turno`);
            }
            
            const turnoData = semana.turnos[turno];
            turnoData.colaboradoresConfirmados.set(postoCode, {
                colaboradorRE,
                config,
                confirmedBy: 'lider',
                confirmedAt: new Date().toISOString()
            });
            
            updateWeekCache(semana);
            
            // Log do evento
            semana.eventos.push({
                timestamp: new Date().toISOString(),
                tipo: 'colaborador_confirmado',
                usuario: 'lider',
                detalhes: { posto: postoCode, colaborador: colaboradorRE, turno }
            });
            
            return true;
        },

        getColaboradorConfirmado: function(postoCode, weekNumber = currentWeek) {
            const semana = this.getWeek(weekNumber);
            if (!semana) return null;
            
            for (const turnoData of Object.values(semana.turnos)) {
                const colaborador = turnoData.colaboradoresConfirmados.get(postoCode);
                if (colaborador) return colaborador;
            }
            
            return null;
        },

        // 📊 Cálculos e Estatísticas
        calcularHorasSemana: function(weekNumber = currentWeek) {
            const semana = this.getWeek(weekNumber);
            if (!semana) return { manha: 0, tarde: 0, total: 0 };
            
            let horasManha = 0;
            let horasTarde = 0;
            
            // Calcular horas manhã
            const postosManha = semana.turnos.manha.postosSelecionados.size;
            if (semana.turnos.manha.configuracoes.sabado.ativo) {
                horasManha += postosManha * semana.turnos.manha.configuracoes.sabado.horas;
            }
            if (semana.turnos.manha.configuracoes.domingo.ativo) {
                horasManha += postosManha * semana.turnos.manha.configuracoes.domingo.horas;
            }
            
            // Calcular horas tarde
            const postosTarde = semana.turnos.tarde.postosSelecionados.size;
            const diasTarde = semana.turnos.tarde.configuracoes.diasSemana;
            const horasPorDia = semana.turnos.tarde.configuracoes.horasPorDia;
            horasTarde = postosTarde * diasTarde * horasPorDia;
            
            const total = horasManha + horasTarde;
            
            // Atualizar cache
            semana.turnos.manha.totalHoras = horasManha;
            semana.turnos.tarde.totalHoras = horasTarde;
            updateWeekCache(semana);
            
            return { manha: horasManha, tarde: horasTarde, total };
        },

        // 🔍 Busca e Filtros
        findColaborador: function(searchTerm) {
            const allColaboradores = this.getAllColaboradores();
            const term = searchTerm.toLowerCase();
            
            return allColaboradores.filter(col => 
                col.nome.toLowerCase().includes(term) ||
                col.re.includes(term)
            );
        },

        findPosto: function(searchTerm) {
            const term = searchTerm.toLowerCase();
            
            return POSTOS_DATA.filter(posto =>
                posto.code.toLowerCase().includes(term) ||
                posto.desc.toLowerCase().includes(term) ||
                posto.area.toLowerCase().includes(term)
            );
        },

        // 📈 Histórico e Relatórios
        addHistoricoEntry: function(entry) {
            entry.id = Date.now();
            entry.timestamp = entry.timestamp || new Date().toISOString();
            cacheData.historico.unshift(entry);
            
            // Manter apenas últimos 1000 registros em memória
            if (cacheData.historico.length > 1000) {
                cacheData.historico = cacheData.historico.slice(0, 1000);
            }
            
            return entry.id;
        },

        getHistorico: function(limit = 50, offset = 0) {
            return cacheData.historico.slice(offset, offset + limit);
        },

        // 🧹 Limpeza e Reset
        clearWeekData: function(weekNumber = currentWeek, saveToHistory = true) {
            const semana = this.getWeek(weekNumber);
            if (!semana) return false;
            
            if (saveToHistory) {
                // Salvar no histórico antes de limpar
                this.addHistoricoEntry({
                    tipo: 'semana_finalizada',
                    semana: weekNumber,
                    dados: JSON.parse(JSON.stringify(semana)),
                    usuario: 'sistema'
                });
            }
            
            // Resetar seleções mantendo estrutura
            semana.turnos.manha.postosSelecionados.clear();
            semana.turnos.manha.colaboradoresConfirmados.clear();
            semana.turnos.tarde.postosSelecionados.clear();
            semana.turnos.tarde.colaboradoresConfirmados.clear();
            
            // Reset configurações
            semana.turnos.manha.configuracoes.sabado.ativo = false;
            semana.turnos.manha.configuracoes.domingo.ativo = false;
            semana.turnos.tarde.configuracoes.diasSemana = 0;
            
            semana.status = 'planejamento';
            updateWeekCache(semana);
            
            return true;
        },

        // 💾 Persistência
        exportWeekData: function(weekNumber = currentWeek) {
            const semana = this.getWeek(weekNumber);
            if (!semana) return null;
            
            // Converter Sets e Maps para arrays para serialização
            const exportData = JSON.parse(JSON.stringify(semana, (key, value) => {
                if (value instanceof Set) {
                    return Array.from(value);
                }
                if (value instanceof Map) {
                    return Object.fromEntries(value);
                }
                return value;
            }));
            
            return exportData;
        },

        importWeekData: function(weekData) {
            try {
                // Converter arrays de volta para Sets e Maps
                const semana = JSON.parse(JSON.stringify(weekData));
                
                // Restaurar Sets
                semana.turnos.manha.postosSelecionados = new Set(semana.turnos.manha.postosSelecionados);
                semana.turnos.tarde.postosSelecionados = new Set(semana.turnos.tarde.postosSelecionados);
                
                // Restaurar Maps
                semana.turnos.manha.colaboradoresConfirmados = new Map(Object.entries(semana.turnos.manha.colaboradoresConfirmados));
                semana.turnos.tarde.colaboradoresConfirmados = new Map(Object.entries(semana.turnos.tarde.colaboradoresConfirmados));
                
                updateWeekCache(semana);
                return true;
            } catch (error) {
                console.error('❌ Erro ao importar dados:', error);
                return false;
            }
        },

        // 🔧 Utilitários
        isInitialized: function() {
            return initialized;
        },

        getStats: function() {
            return {
                totalSemanas: cacheData.semanas.size,
                semanaAtual: currentWeek,
                totalPostos: POSTOS_DATA.length,
                totalColaboradores: this.getAllColaboradores().length,
                ultimaAtualizacao: cacheData.ultimaAtualizacao
            };
        },

        reset: function() {
            cacheData = {
                semanaAtual: null,
                semanas: new Map(),
                historico: [],
                estatisticas: null,
                ultimaAtualizacao: null
            };
            initialized = false;
            currentWeek = null;
        }
    };

})();

// 🎯 Export para testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}