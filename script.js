document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const categorySections = document.getElementById('category-sections');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
    const itemsLeftSpan = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const dueDaySelect = document.getElementById('due-day');
    const dueMonthSelect = document.getElementById('due-month');
    const dueYearSelect = document.getElementById('due-year');
    const taskCategorySelect = document.getElementById('task-category');

    // تحميل المهام المحفوظة
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';

    // تهيئة التطبيق
    initDateSelectors();
    initSearch();
    renderTodos();
    updateItemsLeft();

    // أحداث
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTodos();
        });
    });

    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategoryFilter = this.dataset.category;
            renderTodos();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    // الدوال الأساسية
    function initDateSelectors() {
        // أيام
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dueDaySelect.appendChild(option);
        }

        // أشهر
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            dueMonthSelect.appendChild(option);
        });

        // سنوات
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dueYearSelect.appendChild(option);
        }
    }

    function initSearch() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.placeholder = 'ابحث عن مهام...';
        searchInput.className = 'search-input';
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.todo-item').forEach(item => {
                const text = item.querySelector('.todo-text').textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
            });
        });
        
        document.querySelector('.todo-container').insertBefore(searchInput, document.querySelector('.input-section'));
    }

    function addTodo() {
        const text = todoInput.value.trim();
        
        if (!text) {
            showToast('الرجاء إدخال نص المهمة', 'error');
            todoInput.focus();
            return;
        }
        
        const dueDay = dueDaySelect.value;
        const dueMonth = dueMonthSelect.value;
        const dueYear = dueYearSelect.value;
        const category = taskCategorySelect.value;
        
        let dueDate = null;
        if (dueDay && dueMonth && dueYear) {
            dueDate = new Date(dueYear, dueMonth - 1, dueDay).toISOString();
        }

        const newTodo = {
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate,
            category
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();
        resetInputFields();
        updateItemsLeft();
        showToast('تمت إضافة المهمة بنجاح', 'success');
    }

    function resetInputFields() {
        todoInput.value = '';
        dueDaySelect.value = '';
        dueMonthSelect.value = '';
        dueYearSelect.value = '';
        taskCategorySelect.value = 'study';
    }

    function renderTodos() {
        categorySections.innerHTML = '';
        
        const filteredTodos = filterTodos();
        
        if (filteredTodos.length === 0) {
            showNoTasksMessage();
            return;
        }

        if (currentCategoryFilter !== 'all') {
            renderCategorySection(currentCategoryFilter, filteredTodos);
        } else {
            renderAllCategories(filteredTodos);
        }
    }

    function filterTodos() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return todos.filter(todo => {
            // تصفية حسب الحالة
            switch (currentFilter) {
                case 'active': if (todo.completed) return false; break;
                case 'completed': if (!todo.completed) return false; break;
                case 'overdue':
                    if (todo.completed || !todo.dueDate) return false;
                    const dueDate = new Date(todo.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate >= today) return false;
                    break;
            }

            // تصفية حسب الفئة
            return currentCategoryFilter === 'all' || todo.category === currentCategoryFilter;
        });
    }

    function showNoTasksMessage() {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="لا توجد مهام">
            <h3>لا توجد مهام حالياً!</h3>
            <p>ابدأ بإضافة مهمة جديدة لتنظيم يومك</p>
        `;
        categorySections.appendChild(emptyMessage);
    }

    function renderAllCategories(todos) {
        const categories = {
            study: todos.filter(todo => todo.category === 'study'),
            work: todos.filter(todo => todo.category === 'work'),
            important: todos.filter(todo => todo.category === 'important'),
            notImportant: todos.filter(todo => todo.category === 'not-important')
        };

        if (categories.study.length > 0) renderCategorySection('study', categories.study);
        if (categories.work.length > 0) renderCategorySection('work', categories.work);
        if (categories.important.length > 0) renderCategorySection('important', categories.important);
        if (categories.notImportant.length > 0) renderCategorySection('not-important', categories.notImportant);
    }

    function renderCategorySection(category, todos) {
        const section = document.createElement('div');
        section.className = `category-section category-${category}`;

        const header = document.createElement('h2');
        header.className = 'category-header';
        header.textContent = getCategoryName(category);

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'category-tasks';

        todos.sort(sortByDueDate).forEach(todo => {
            tasksContainer.appendChild(createTodoItem(todo));
        });

        section.appendChild(header);
        section.appendChild(tasksContainer);
        categorySections.appendChild(section);

        addEventListenersToTasks();
    }

    function getCategoryName(category) {
        const names = {
            'study': 'الدراسة',
            'work': 'العمل',
            'important': 'المهم',
            'not-important': 'غير المهم'
        };
        return names[category];
    }

    function sortByDueDate(a, b) {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    }

    function createTodoItem(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        if (todo.completed) todoItem.classList.add('completed');
        
        // التحقق من التأخر
        if (!todo.completed && todo.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(todo.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) todoItem.classList.add('overdue');
        }

        const createdAt = new Date(todo.createdAt);
        const createdStr = `تم الإضافة: ${createdAt.toLocaleDateString('ar-EG')} ${createdAt.toLocaleTimeString('ar-EG')}`;
        
        let dueStr = 'لا يوجد تاريخ';
        if (todo.dueDate) {
            const dueDate = new Date(todo.dueDate);
            dueStr = `الاستحقاق: ${dueDate.toLocaleDateString('ar-EG')}`;
        }

        const timeRemaining = getTimeRemaining(todo.dueDate);
        const categoryLabel = getCategoryLabel(todo.category);

        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
            <div class="todo-content">
                <div class="todo-text-row">
                    <span class="todo-text">${todo.text}</span>
                    <span class="task-category-label">${categoryLabel}</span>
                </div>
                <div class="task-meta">
                    <span class="created-date">${createdStr}</span>
                    <span class="due-date ${timeRemaining.class}">
                        ${dueStr} • ${timeRemaining.text}
                        <span class="time-visual" style="width:${getTimeVisual(todo.dueDate)}%"></span>
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" data-id="${todo.id}">تعديل</button>
                <button class="delete-btn" data-id="${todo.id}">حذف</button>
            </div>
        `;

        return todoItem;
    }

    function getCategoryLabel(category) {
        const labels = {
            'study': 'دراسة',
            'work': 'عمل',
            'important': 'مهم',
            'not-important': 'غير مهم'
        };
        return labels[category];
    }

    function addEventListenersToTasks() {
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', toggleTodo);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTodo);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const todo = todos.find(todo => todo.id === id);
                const todoItem = e.target.closest('.todo-item');
                if (todo) enableEditMode(todoItem, todo);
            });
        });
    }

    function enableEditMode(todoItem, todo) {
        const todoText = todoItem.querySelector('.todo-text');
        const currentText = todoText.textContent;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';
        
        todoText.replaceWith(input);
        input.focus();
        
        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                todo.text = newText;
                saveTodos();
                renderTodos();
                showToast('تم تعديل المهمة بنجاح', 'success');
            } else {
                renderTodos();
            }
        }
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });
    }

    function toggleTodo(e) {
        const id = parseInt(e.target.dataset.id);
        const todo = todos.find(todo => todo.id === id);
        
        if (todo) {
            const wasCompleted = todo.completed;
            todo.completed = e.target.checked;
            saveTodos();
            renderTodos();
            updateItemsLeft();
            
            if (todo.completed && !wasCompleted) {
                celebrateCompletion(e.target.closest('.todo-item'));
            }
        }
    }

    function deleteTodo(e) {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
        
        const id = parseInt(e.target.dataset.id);
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateItemsLeft();
        showToast('تم حذف المهمة بنجاح', 'success');
    }

    function clearCompleted() {
        if (!confirm('هل أنت متأكد من حذف جميع المهام المكتملة؟')) return;
        
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateItemsLeft();
        showToast('تم حذف المهام المكتملة', 'success');
    }

    function updateItemsLeft() {
        const activeTodos = todos.filter(todo => !todo.completed).length;
        itemsLeftSpan.textContent = `${activeTodos} ${activeTodos === 1 ? 'مهمة باقية' : 'مهام باقية'}`;
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function getTimeRemaining(dueDate) {
        if (!dueDate) return { text: 'لا يوجد تاريخ', class: '' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return { text: 'ينتهي اليوم!', class: 'due-today' };
        if (diffDays < 0) return { text: `متأخر ${Math.abs(diffDays)} يوم`, class: 'overdue' };
        if (diffDays === 1) return { text: 'غداً', class: 'due-soon' };
        if (diffDays <= 7) return { text: `${diffDays} أيام متبقية`, class: 'due-soon' };
        return { text: `${diffDays} يوم متبقي`, class: '' };
    }

    function getTimeVisual(dueDate) {
        if (!dueDate) return 0;
        
        const today = new Date();
        const due = new Date(dueDate);
        const totalDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        
        if (totalDays < 0) return 100;
        
        const maxDays = 30;
        return Math.min(100, Math.max(0, 100 - (totalDays / maxDays * 100)));
    }

    function celebrateCompletion(element) {
        if (!element) return;
        
        // تأثير الاهتزاز
        const container = document.querySelector('.todo-container');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
        
        // إنشاء النجوم
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        createStars(centerX, centerY);
        createConfetti();
    }

    function createStars(x, y, count = 30) {
        const colors = ['#FFD700', '#FFA500', '#FF1493', '#00BFFF', '#7CFC00', '#9400D3'];
        const container = document.getElementById('celebration-container') || document.body;
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.innerHTML = '★';
            star.style.cssText = `
                position: fixed;
                left: ${x + (Math.random() - 0.5) * 100}px;
                top: ${y + (Math.random() - 0.5) * 100}px;
                color: ${colors[Math.floor(Math.random() * colors.length)]};
                font-size: ${20 + Math.random() * 20}px;
                animation: float-up ${1 + Math.random()}s ease-out forwards;
                z-index: 1000;
                pointer-events: none;
            `;
            
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 1500);
        }
    }

    function createConfetti() {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${5 + Math.random() * 10}px;
                height: ${5 + Math.random() * 10}px;
                background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                animation: confetti-fall ${2 + Math.random() * 2}s ease-in forwards;
                z-index: 999;
                pointer-events: none;
            `;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }
});
