class GameTracker {
    constructor() {
        this.games = JSON.parse(localStorage.getItem('games')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderGames();
        this.setupEventListeners();
        this.updateStats();
        this.addInitialGames();
    }

    setupEventListeners() {
        document.getElementById('gameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGame();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterGames(e.target.dataset.filter);
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateGame();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Автоматическое заполнение даты окончания при выборе статуса "Завершена"
        document.getElementById('gameStatus').addEventListener('change', (e) => {
            if (e.target.value === 'completed' && !document.getElementById('endDate').value) {
                document.getElementById('endDate').value = new Date().toISOString().split('T')[0];
            }
        });

        document.getElementById('editStatus').addEventListener('change', (e) => {
            if (e.target.value === 'completed' && !document.getElementById('editEndDate').value) {
                document.getElementById('editEndDate').value = new Date().toISOString().split('T')[0];
            }
        });
    }

    addGame() {
        const name = document.getElementById('gameName').value.trim();
        const status = document.getElementById('gameStatus').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Валидация
        if (!name) {
            this.showNotification('Введите название игры', 'error');
            return;
        }

        // Проверка дат
        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            this.showNotification('Дата окончания не может быть раньше даты начала', 'error');
            return;
        }

        const game = {
            id: Date.now(),
            name,
            status,
            startDate,
            endDate,
            added: new Date().toISOString()
        };

        this.games.unshift(game); // Добавляем в начало
        this.saveGames();
        this.renderGames();
        this.updateStats();

        // Анимация добавления
        document.getElementById('gameForm').reset();
        this.showNotification(`🎮 Игра "${name}" добавлена!`, 'success');
    }

    editGame(id) {
        const game = this.games.find(g => g.id === id);
        if (game) {
            document.getElementById('editId').value = game.id;
            document.getElementById('editName').value = game.name;
            document.getElementById('editStatus').value = game.status;
            document.getElementById('editStartDate').value = game.startDate;
            document.getElementById('editEndDate').value = game.endDate;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    updateGame() {
        const id = parseInt(document.getElementById('editId').value);
        const name = document.getElementById('editName').value.trim();
        const status = document.getElementById('editStatus').value;
        const startDate = document.getElementById('editStartDate').value;
        const endDate = document.getElementById('editEndDate').value;

        // Валидация
        if (!name) {
            this.showNotification('Введите название игры', 'error');
            return;
        }

        // Проверка дат
        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            this.showNotification('Дата окончания не может быть раньше даты начала', 'error');
            return;
        }

        const gameIndex = this.games.findIndex(g => g.id === id);
        if (gameIndex !== -1) {
            this.games[gameIndex] = { ...this.games[gameIndex], name, status, startDate, endDate };
            this.saveGames();
            this.renderGames();
            this.updateStats();
            this.closeModal();
            this.showNotification(`✏️ Игра "${name}" обновлена!`, 'success');
        }
    }

    deleteGame(id) {
        const game = this.games.find(g => g.id === id);
        if (game && confirm(`Удалить игру "${game.name}"?`)) {
            // Анимация удаления
            const row = document.querySelector(`tr[data-game-id="${id}"]`);
            if (row) {
                row.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    this.games = this.games.filter(g => g.id !== id);
                    this.saveGames();
                    this.renderGames();
                    this.updateStats();
                    this.showNotification(`🗑️ Игра "${game.name}" удалена`, 'error');
                }, 300);
            } else {
                this.games = this.games.filter(g => g.id !== id);
                this.saveGames();
                this.renderGames();
                this.updateStats();
                this.showNotification(`🗑️ Игра "${game.name}" удалена`, 'error');
            }
        }
    }

    filterGames(filter) {
        this.currentFilter = filter;
        this.renderGames();
    }

    renderGames() {
        const gamesBody = document.getElementById('gamesBody');

        let filteredGames = this.games;
        if (this.currentFilter !== 'all') {
            filteredGames = this.games.filter(game => game.status === this.currentFilter);
        }

        if (filteredGames.length === 0) {
            gamesBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <h3>🎮 Пока нет игр</h3>
                        <p>Добавьте первую игру чтобы начать отслеживать прогресс!</p>
                    </td>
                </tr>
            `;
            return;
        }

        gamesBody.innerHTML = '';
        filteredGames.forEach((game, index) => {
            const row = this.createGameRow(game);
            row.style.animationDelay = `${index * 0.1}s`;
            gamesBody.appendChild(row);
        });
    }

    createGameRow(game) {
        const row = document.createElement('tr');
        row.setAttribute('data-game-id', game.id);
        row.style.animation = 'slideUp 0.4s ease both';

        const statusConfig = {
            'completed': { icon: '✅', text: 'Завершена', class: 'status-completed' },
            'in-progress': { icon: '🟡', text: 'В процессе', class: 'status-in-progress' },
            'not-started': { icon: '❌', text: 'Не начата', class: 'status-not-started' }
        };

        const status = statusConfig[game.status];
        const startDate = game.startDate ? this.formatDate(game.startDate) : '—';
        const endDate = game.endDate ? this.formatDate(game.endDate) : '—';

        row.innerHTML = `
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <strong>${game.name}</strong>
                    ${this.getProgressBadge(game)}
                </div>
            </td>
            <td class="${status.class}">
                ${status.icon} ${status.text}
            </td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="gameTracker.editGame(${game.id})" title="Редактировать">
                        ✏️ Изменить
                    </button>
                    <button class="action-btn delete-btn" onclick="gameTracker.deleteGame(${game.id})" title="Удалить">
                        🗑️ Удалить
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getProgressBadge(game) {
        if (game.status === 'completed') {
            return '<span class="progress-badge completed">🎉 Пройдена!</span>';
        }
        if (game.status === 'in-progress' && game.startDate) {
            const days = Math.floor((new Date() - new Date(game.startDate)) / (1000 * 60 * 60 * 24));
            const weeks = Math.floor(days / 7);
            let text = `📅 ${days}д`;
            if (weeks > 0) {
                text = `📅 ${weeks}н ${days % 7}д`;
            }
            return `<span class="progress-badge in-progress">${text}</span>`;
        }
        return '';
    }

    updateStats() {
        const total = this.games.length;
        const completed = this.games.filter(g => g.status === 'completed').length;
        const inProgress = this.games.filter(g => g.status === 'in-progress').length;
        const notStarted = this.games.filter(g => g.status === 'not-started').length;

        // Плавное обновление счетчиков без ухода в отрицательные значения
        this.updateCounter('totalGames', total);
        this.updateCounter('completedGames', completed);
        this.updateCounter('inProgressGames', inProgress);
        this.updateCounter('notStartedGames', notStarted);
    }

    updateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const current = parseInt(element.textContent) || 0;

        // Защита от отрицательных значений
        if (targetValue < 0) targetValue = 0;

        if (current === targetValue) return;

        // Простая установка значения без сложной анимации
        element.textContent = targetValue;

        // Легкая анимация
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    saveGames() {
        localStorage.setItem('games', JSON.stringify(this.games));
    }

    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 400px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    addInitialGames() {
        if (this.games.length === 0) {
            const initialGames = [
                {
                    id: 1,
                    name: "Метро: Последний свет",
                    status: "completed",
                    startDate: "2024-10-26",
                    endDate: "2024-11-06",
                    added: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "Метро: Экзодус",
                    status: "in-progress",
                    startDate: "2024-11-01",
                    endDate: "",
                    added: new Date().toISOString()
                },
                {
                    id: 3,
                    name: "Bendy: Чернильная машина",
                    status: "completed",
                    startDate: "2024-11-03",
                    endDate: "2024-11-28",
                    added: new Date().toISOString()
                }
            ];

            this.games = initialGames;
            this.saveGames();
            this.renderGames();
            this.updateStats();
        }
    }
}

// Добавляем CSS для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
const gameTracker = new GameTracker();