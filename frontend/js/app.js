const app = {
    currentTripId: null,

    init() {
        window.addEventListener('hashchange', this.router.bind(this));
        this.router();
    },

    navigate(view) {
        window.location.hash = `#${view}`;
    },

    showFeedback(message, isError = false) {
        document.getElementById('feedbackModalTitle').innerText = isError ? 'Erro' : 'Sucesso';
        document.getElementById('feedbackModalTitle').className = isError ? 'modal-title text-danger' : 'modal-title text-success';
        document.getElementById('feedbackModalBody').innerText = message;
        const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
        modal.show();
    },

    router() {
        const hash = window.location.hash || '#login';
        const path = hash.substring(1).split('/');
        const view = path[0];

        const token = api.getToken();
        
        // Proteção de rotas
        if (!token && view !== 'login' && view !== 'register') {
            this.navigate('login');
            return;
        }

        if (token && (view === 'login' || view === 'register')) {
            this.navigate('dashboard');
            return;
        }

        // Toggle Navbar
        document.getElementById('mainNavbar').style.display = token ? 'flex' : 'none';
        if (token) {
            const user = api.getUser();
            if (user) {
                document.getElementById('userNameDisplay').innerText = `Olá, ${user.name}`;
            }
        }

        this.renderView(view, path[1]);
    },

    async renderView(view, param) {
        const root = document.getElementById('app-root');
        
        switch (view) {
            case 'login':
                root.innerHTML = this.views.login();
                break;
            case 'register':
                root.innerHTML = this.views.register();
                break;
            case 'dashboard':
                root.innerHTML = this.views.dashboard();
                await this.controllers.loadTrips();
                break;
            case 'trip':
                this.currentTripId = param;
                root.innerHTML = this.views.trip();
                await this.controllers.loadTrip(param);
                break;
            case 'settlement':
                root.innerHTML = this.views.settlement();
                await this.controllers.loadSettlement(param);
                break;
            default:
                root.innerHTML = `<h2>Página não encontrada</h2>`;
        }
    },

    logout() {
        api.clearToken();
        this.navigate('login');
    },

    views: {
        login: () => `
            <div class="auth-container premium-card p-5 fade-in">
                <h2 class="text-center mb-4 text-primary"><i class="bi bi-airplane-engines"></i> SplitTrip</h2>
                <h5 class="text-center mb-4 text-muted">Faça login para continuar</h5>
                <form onsubmit="app.controllers.handleLogin(event)">
                    <div class="mb-3">
                        <label class="form-label">E-mail</label>
                        <input type="email" id="loginEmail" class="form-control form-control-lg" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Senha</label>
                        <input type="password" id="loginPassword" class="form-control form-control-lg" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg w-100">Entrar</button>
                </form>
                <div class="text-center mt-4">
                    <span>Não tem uma conta? <a href="#register" class="text-decoration-none">Cadastre-se</a></span>
                </div>
            </div>
        `,
        register: () => `
            <div class="auth-container premium-card p-5 fade-in">
                <h2 class="text-center mb-4 text-primary">Criar Conta</h2>
                <form onsubmit="app.controllers.handleRegister(event)">
                    <div class="mb-3">
                        <label class="form-label">Nome</label>
                        <input type="text" id="regName" class="form-control form-control-lg" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">E-mail</label>
                        <input type="email" id="regEmail" class="form-control form-control-lg" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Senha</label>
                        <input type="password" id="regPassword" class="form-control form-control-lg" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg w-100">Cadastrar</button>
                </form>
                <div class="text-center mt-4">
                    <span>Já tem uma conta? <a href="#login" class="text-decoration-none">Faça login</a></span>
                </div>
            </div>
        `,
        dashboard: () => `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">Minhas Viagens</h2>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newTripModal">
                        <i class="bi bi-plus-lg"></i> Nova Viagem
                    </button>
                </div>
                <div class="row" id="tripsList">
                    <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
                </div>
            </div>

            <!-- Modal Nova Viagem -->
            <div class="modal fade" id="newTripModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Criar Nova Viagem</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="text" id="newTripTitle" class="form-control" placeholder="Ex: Férias em Cancún" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="app.controllers.createTrip()">Criar</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        trip: () => `
            <div class="fade-in" id="tripDetailsContainer">
                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
            </div>

            <!-- Modal Adicionar Participante -->
            <div class="modal fade" id="addParticipantModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Adicionar Participante</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label>Email do usuário cadastrado no sistema:</label>
                            <input type="email" id="participantEmail" class="form-control mt-2" placeholder="email@exemplo.com">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="app.controllers.addParticipant()">Adicionar</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Adicionar Despesa -->
            <div class="modal fade" id="addExpenseModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Registrar Despesa</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label>Descrição</label>
                                <input type="text" id="expDesc" class="form-control" placeholder="Ex: Jantar na Praia" required>
                            </div>
                            <div class="mb-3">
                                <label>Valor Total (R$)</label>
                                <input type="number" id="expAmount" class="form-control" step="0.01" min="0.01" required>
                            </div>
                            <div class="mb-3">
                                <label>Quem Pagou?</label>
                                <select id="expPayer" class="form-select"></select>
                            </div>
                            <div class="mb-3">
                                <label>Dividir entre (Participantes):</label>
                                <div id="expParticipantsList" class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="app.controllers.addExpense()">Salvar Despesa</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        settlement: () => `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Prestação de Contas</h2>
                    <button class="btn btn-outline-primary" onclick="window.history.back()">Voltar</button>
                </div>
                <div id="settlementContainer">
                    <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
                </div>
            </div>
        `
    },

    controllers: {
        async handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const res = await api.login(email, password);
                api.setToken(res.token);
                api.setUser(res.user);
                app.navigate('dashboard');
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        async handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            try {
                await api.register(name, email, password);
                app.showFeedback("Cadastro realizado com sucesso! Faça login.");
                app.navigate('login');
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        async loadTrips() {
            try {
                const trips = await api.getTrips();
                const container = document.getElementById('tripsList');
                if (trips.length === 0) {
                    container.innerHTML = `<div class="col-12"><div class="alert alert-info">Você ainda não tem viagens. Crie uma!</div></div>`;
                    return;
                }
                
                let html = '';
                trips.forEach(t => {
                    const statusBadge = t.is_finished ? '<span class="badge bg-secondary badge-custom">Finalizada</span>' : '<span class="badge bg-success badge-custom">Em Aberto</span>';
                    html += `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="premium-card p-4 h-100 d-flex flex-column">
                                <div class="d-flex justify-content-between mb-3">
                                    <h4 class="mb-0 text-truncate" title="${t.title}">${t.title}</h4>
                                    ${statusBadge}
                                </div>
                                <p class="text-muted small mb-4">Criada em: ${new Date(t.created_at).toLocaleDateString()}</p>
                                <div class="mt-auto">
                                    <a href="#trip/${t.id}" class="btn btn-outline-primary w-100">Ver Detalhes</a>
                                </div>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } catch (err) {
                app.showFeedback("Erro ao carregar viagens", true);
            }
        },

        async createTrip() {
            const title = document.getElementById('newTripTitle').value;
            if (!title) return;
            try {
                await api.createTrip(title);
                bootstrap.Modal.getInstance(document.getElementById('newTripModal')).hide();
                app.showFeedback("Viagem criada!");
                this.loadTrips();
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        async loadTrip(id) {
            try {
                const [trip, expenses] = await Promise.all([
                    api.getTrip(id),
                    api.getExpenses(id)
                ]);

                const user = api.getUser();
                const isCreator = trip.created_by === user.id;

                let html = `
                    <div class="row g-4">
                        <div class="col-lg-8">
                            <div class="premium-card p-4 mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h2 class="mb-0">${trip.title}</h2>
                                    <div>
                                        <a href="#settlement/${trip.id}" class="btn btn-success me-2"><i class="bi bi-calculator"></i> Prestação de Contas</a>
                                        ${(!trip.is_finished && isCreator) ? `<button class="btn btn-outline-danger" onclick="app.controllers.finishTrip(${trip.id})">Finalizar Viagem</button>` : ''}
                                    </div>
                                </div>
                                ${trip.is_finished ? '<div class="alert alert-warning">Esta viagem foi finalizada. Não é possível adicionar novas despesas ou participantes.</div>' : ''}
                            </div>

                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Despesas</h3>
                                ${!trip.is_finished ? `<button class="btn btn-primary" onclick="app.controllers.openExpenseModal()">+ Nova Despesa</button>` : ''}
                            </div>
                            <div id="expensesList">
                                ${expenses.length === 0 ? '<p class="text-muted">Nenhuma despesa registrada.</p>' : expenses.map(e => `
                                    <div class="expense-item">
                                        <div class="d-flex justify-content-between">
                                            <h5 class="mb-1">${e.description}</h5>
                                            <span class="fw-bold fs-5 text-primary">R$ ${e.amount.toFixed(2)}</span>
                                        </div>
                                        <p class="small text-muted mb-1">Pago por: <strong>${e.payer_name}</strong> em ${new Date(e.created_at).toLocaleDateString()}</p>
                                        <p class="small mb-0">Dividido entre: ${e.participants.map(p => p.name).join(', ')}</p>
                                        ${(!trip.is_finished && (e.payer_id === user.id || isCreator)) ? `<button class="btn btn-sm btn-link text-danger p-0 mt-2" onclick="app.controllers.deleteExpense(${e.id}, ${trip.id})">Excluir</button>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="col-lg-4">
                            <div class="premium-card p-4">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h4 class="mb-0">Participantes</h4>
                                    ${(!trip.is_finished && isCreator) ? `<button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addParticipantModal"><i class="bi bi-person-plus"></i></button>` : ''}
                                </div>
                                <ul class="list-group list-group-flush">
                                    ${trip.participants.map(p => `<li class="list-group-item bg-transparent px-0">${p.name} ${p.id === trip.created_by ? '(Admin)' : ''}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;

                document.getElementById('tripDetailsContainer').innerHTML = html;

                // Armazenar participantes para o modal de despesas
                window.currentTripParticipants = trip.participants;

            } catch (err) {
                app.showFeedback(err.message, true);
                app.navigate('dashboard');
            }
        },

        async addParticipant() {
            const email = document.getElementById('participantEmail').value;
            if (!email) return;
            try {
                await api.addParticipant(app.currentTripId, email);
                bootstrap.Modal.getInstance(document.getElementById('addParticipantModal')).hide();
                app.showFeedback("Participante adicionado!");
                this.loadTrip(app.currentTripId);
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        openExpenseModal() {
            const selectPayer = document.getElementById('expPayer');
            const partsList = document.getElementById('expParticipantsList');
            
            selectPayer.innerHTML = '';
            partsList.innerHTML = '';

            window.currentTripParticipants.forEach(p => {
                selectPayer.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                partsList.innerHTML += `
                    <div class="form-check">
                        <input class="form-check-input exp-part-cb" type="checkbox" value="${p.id}" id="cb_${p.id}" checked>
                        <label class="form-check-label" for="cb_${p.id}">${p.name}</label>
                    </div>
                `;
            });

            new bootstrap.Modal(document.getElementById('addExpenseModal')).show();
        },

        async addExpense() {
            const description = document.getElementById('expDesc').value;
            const amount = parseFloat(document.getElementById('expAmount').value);
            const payer_id = document.getElementById('expPayer').value;
            
            const checkboxes = document.querySelectorAll('.exp-part-cb:checked');
            const participants_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

            if (!description || isNaN(amount) || amount <= 0 || participants_ids.length === 0) {
                app.showFeedback("Preencha todos os campos e selecione pelo menos um participante.", true);
                return;
            }

            try {
                await api.addExpense(app.currentTripId, { description, amount, payer_id, participants_ids });
                bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
                app.showFeedback("Despesa registrada!");
                this.loadTrip(app.currentTripId);
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        async deleteExpense(id, tripId) {
            if(!confirm('Tem certeza que deseja excluir esta despesa?')) return;
            try {
                await api.deleteExpense(id);
                app.showFeedback("Despesa excluída.");
                this.loadTrip(tripId);
            } catch(err) {
                app.showFeedback(err.message, true);
            }
        },

        async finishTrip(tripId) {
            if(!confirm('Tem certeza que deseja finalizar a viagem? Nenhuma despesa poderá ser alterada após isso.')) return;
            try {
                await api.finishTrip(tripId);
                app.showFeedback("Viagem finalizada!");
                this.loadTrip(tripId);
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        },

        async loadSettlement(tripId) {
            try {
                const data = await api.getSettlement(tripId);
                let html = `
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="premium-card p-4 h-100">
                                <h3 class="mb-4">Resumo Financeiro</h3>
                                <div class="alert alert-info">
                                    <h5 class="mb-0">Custo Total da Viagem: R$ ${data.total_cost}</h5>
                                </div>
                                <h5 class="mt-4 mb-3">Balanço por Participante</h5>
                                <ul class="list-group">
                                    ${data.balances.map(b => {
                                        const bal = parseFloat(b.balance);
                                        let color = bal > 0 ? 'text-success' : (bal < 0 ? 'text-danger' : 'text-muted');
                                        let val = bal > 0 ? `+R$ ${bal.toFixed(2)} (A Receber)` : (bal < 0 ? `-R$ ${Math.abs(bal).toFixed(2)} (A Pagar)` : `R$ 0.00 (Quite)`);
                                        return `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            ${b.name}
                                            <strong class="${color}">${val}</strong>
                                        </li>`;
                                    }).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="premium-card p-4 h-100">
                                <h3 class="mb-4">Algoritmo de Quitação <i class="bi bi-magic text-warning"></i></h3>
                                <p class="text-muted">Como resolver as dívidas com a menor quantidade de transferências:</p>
                                ${data.transactions.length === 0 ? '<div class="alert alert-success">Tudo certo! Ninguém deve nada a ninguém.</div>' : `
                                    <div class="list-group">
                                        ${data.transactions.map(t => `
                                            <div class="list-group-item list-group-item-action d-flex align-items-center p-3">
                                                <div class="me-3 fs-3 text-danger"><i class="bi bi-arrow-right-circle"></i></div>
                                                <div>
                                                    <strong class="fs-5">${t.from.name}</strong> deve pagar
                                                    <strong class="fs-5 text-primary">R$ ${t.amount}</strong> para
                                                    <strong class="fs-5">${t.to.name}</strong>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('settlementContainer').innerHTML = html;
            } catch (err) {
                app.showFeedback(err.message, true);
            }
        }
    }
};

// Start App
window.onload = () => app.init();
