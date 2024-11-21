class IlmaDocesOrganizer {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.initializeUI();
        this.initializeSpeechRecognition();
    }

    initializeUI() {
        // Configuração dos elementos da interface
        this.todoList = document.getElementById('todoList');
        this.doingList = document.getElementById('doingList');
        this.doneList = document.getElementById('doneList');
        
        this.newTaskBtn = document.getElementById('newTaskBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.taskForm = document.getElementById('taskForm');
        
        // Adicionar event listeners
        this.newTaskBtn.addEventListener('click', () => this.openNewTaskModal());
        this.taskForm.addEventListener('submit', (e) => this.addTask(e));
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        
        // Adicionar botão de exportar/importar
        this.createImportExportButtons();
        
        // Renderizar tarefas iniciais
        this.renderTasks();
    }

    createImportExportButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('import-export-buttons');
        
        const exportBtn = document.createElement('button');
        exportBtn.innerText = 'Exportar Tarefas';
        exportBtn.classList.add('btn', 'btn-primary', 'mr-2');
        exportBtn.addEventListener('click', () => this.exportTasks());
        
        const importBtn = document.createElement('button');
        importBtn.innerText = 'Importar Tarefas';
        importBtn.classList.add('btn', 'btn-secondary');
        importBtn.addEventListener('click', () => this.importTasks());
        
        buttonContainer.appendChild(exportBtn);
        buttonContainer.appendChild(importBtn);
        
        document.querySelector('.header-actions').appendChild(buttonContainer);
    }

    exportTasks() {
        const tasksJSON = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([tasksJSON], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ilma_doces_tasks_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    importTasks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    alert('Tarefas importadas com sucesso!');
                } catch (error) {
                    alert('Erro ao importar tarefas. Verifique o arquivo.');
                }
            };
            
            reader.readAsText(file);
        };
        input.click();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'pt-BR';
            this.recognition.interimResults = false;
            this.isListening = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                this.processVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.stopVoiceRecording();
            };
        } else {
            alert('Reconhecimento de voz não suportado neste navegador');
        }
    }

    toggleVoiceRecording() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        this.voiceBtn.classList.add('voice-recording');
        this.isListening = true;
        this.recognition.start();
    }

    stopVoiceRecording() {
        this.voiceBtn.classList.remove('voice-recording');
        this.isListening = false;
        this.recognition.stop();
    }

    processVoiceCommand(transcript) {
        transcript = transcript.toLowerCase();

        // Comandos de voz para gerenciar tarefas
        if (transcript.includes('criar tarefa')) {
            this.openNewTaskModal();
        } else if (transcript.includes('nova tarefa')) {
            const taskName = transcript.replace('nova tarefa', '').trim();
            this.addTaskByVoice(taskName);
        } else if (transcript.includes('listar tarefas')) {
            this.listTasksByVoice();
        } else if (transcript.includes('mover tarefa')) {
            this.moveTaskByVoice(transcript);
        }
    }

    addTaskByVoice(taskName) {
        const task = {
            id: Date.now(),
            title: taskName,
            description: '',
            priority: 'baixa',
            date: new Date().toISOString().split('T')[0],
            status: 'todo'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        
        // Feedback de áudio
        new Audio('success-sound.mp3').play();
    }

    listTasksByVoice() {
        let message = 'Suas tarefas são: ';
        this.tasks.forEach(task => {
            message += `${task.title} em ${task.status}, `;
        });
        
        // Usar Web Speech API para falar as tarefas
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    }

    moveTaskByVoice(transcript) {
        // Lógica simplificada de mover tarefas por voz
        const directions = {
            'próximo': 'next',
            'anterior': 'prev',
            'mover': 'next'
        };

        const direction = Object.keys(directions).find(key => transcript.includes(key));
        if (direction) {
            const lastTask = this.tasks[this.tasks.length - 1];
            if (lastTask) {
                this.moveTask(lastTask.id, directions[direction]);
            }
        }
    }

    openNewTaskModal() {
        const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
        taskModal.show();
    }

    addTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const priority = document.getElementById('taskPriority').value;
        const date = document.getElementById('taskDate').value;

        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            date,
            status: 'todo'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        
        // Fechar modal
        const taskModal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
        taskModal.hide();
        
        // Resetar formulário
        this.taskForm.reset();
    }

    renderTasks() {
        // Limpar listas
        [this.todoList, this.doingList, this.doneList].forEach(list => list.innerHTML = '');

        // Renderizar tarefas por status
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch(task.status) {
                case 'todo': this.todoList.appendChild(taskElement); break;
                case 'doing': this.doingList.appendChild(taskElement); break;
                case 'done': this.doneList.appendChild(taskElement); break;
            }
        });
    }

    createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card', task.priority);
        taskCard.innerHTML = `
            <h5>${task.title}</h5>
            <span class="task-priority ${task.priority}-priority">
                ${task.priority.toUpperCase()}
            </span>
            <div class="task-actions">
                <button class="btn btn-sm btn-info details-btn" data-id="${task.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <div>
                    <button class="btn btn-sm btn-warning move-prev" data-id="${task.id}">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="btn btn-sm btn-success move-next" data-id="${task.id}">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;

        taskCard.querySelector('.details-btn').addEventListener('click', () => this.showTaskDetails(task));
        taskCard.querySelector('.move-prev').addEventListener('click', () => this.moveTask(task.id, 'prev'));
        taskCard.querySelector('.move-next').addEventListener('click', () => this.moveTask(task.id, 'next'));

        return taskCard;
    }

    moveTask(taskId, direction) {
        const statuses = ['todo', 'doing', 'done'];
        const task = this.tasks.find(t => t.id === taskId);
        const currentIndex = statuses.indexOf(task.status);

        if (direction === 'next' && currentIndex < statuses.length - 1) {
            task.status = statuses[currentIndex + 1];
        } else if (direction === 'prev' && currentIndex > 0) {
            task.status = statuses[currentIndex - 1];
        }

        this.saveTasks();
        this.renderTasks();
    }

    showTaskDetails(task) {
        const detailsModal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
        const content = document.getElementById('taskDetailsContent');
        
        content.innerHTML = `
            <h4>${task.title}</h4>
            <p><strong>Descrição:</strong> ${task.description || 'Sem descrição'}</p>
            <p><strong>Prioridade:</strong> ${task.priority}</p>
            <p><strong>Data:</strong> ${task.date || 'Não definida'}</p>
        `;

        detailsModal.show();
    }

    saveTasks() {
        localStorage.setItem('ilmaDoceTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('ilmaDoceTasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    }
}

// Inicializar o organizador quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.ilmaDocesOrganizer = new IlmaDocesOrganizer();
});