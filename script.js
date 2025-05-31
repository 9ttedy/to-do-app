document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const itemsLeftSpan = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    
    // Initialize the app
    renderTodos();
    updateItemsLeft();
    
    // Add new todo
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // Filter todos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTodos();
        });
    });
    
    // Clear completed todos
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            const newTodo = {
                id: Date.now(),
                text,
                completed: false
            };
            todos.push(newTodo);
            saveTodos();
            renderTodos();
            todoInput.value = '';
            updateItemsLeft();
        }
    }
    
    function renderTodos() {
        todoList.innerHTML = '';
        
        let filteredTodos = [];
        
        switch (currentFilter) {
            case 'active':
                filteredTodos = todos.filter(todo => !todo.completed);
                break;
            case 'completed':
                filteredTodos = todos.filter(todo => todo.completed);
                break;
            default:
                filteredTodos = [...todos];
        }
        
        if (filteredTodos.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'No tasks found';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.padding = '20px';
            todoList.appendChild(emptyMessage);
        } else {
            filteredTodos.forEach(todo => {
                const todoItem = document.createElement('li');
                todoItem.className = 'todo-item';
                if (todo.completed) {
                    todoItem.classList.add('completed');
                }
                
                todoItem.innerHTML = `
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                    <span class="todo-text">${todo.text}</span>
                    <button class="delete-btn" data-id="${todo.id}">Delete</button>
                `;
                
                todoList.appendChild(todoItem);
            });
        }
        
        // Add event listeners to checkboxes and delete buttons
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', toggleTodo);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTodo);
        });
    }
    
    function toggleTodo(e) {
        const id = parseInt(e.target.dataset.id);
        const todo = todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = e.target.checked;
            saveTodos();
            renderTodos();
            updateItemsLeft();
        }
    }
    
    function deleteTodo(e) {
        const id = parseInt(e.target.dataset.id);
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateItemsLeft();
    }
    
    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateItemsLeft();
    }
    
    function updateItemsLeft() {
        const activeTodos = todos.filter(todo => !todo.completed).length;
        itemsLeftSpan.textContent = `${activeTodos} ${activeTodos === 1 ? 'item' : 'items'} left`;
    }
    
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
});