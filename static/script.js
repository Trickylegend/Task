const TIMEOUT_DURATION = 2000;
let isServerOnline = true;

document.addEventListener('DOMContentLoaded', async () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');


    let tasks = []

    try {
        tasks = await loadTasksFromServer();
        if (tasks) {
            console.log(tasks)
            saveTasksToLocalStorage(tasks);
        }
        renderTasks();
    } catch (error) {
        console.error('Error when loading data from the server:', error);
        tasks = await loadTasksFromLocalStorage();
        renderTasks();
    }

    function addTask(taskText) {
        if (taskText.trim() === '') return;

        const task = {
            text: taskText,
            completed: false
        };

        tasks.push(task);
        sendNewTaskToServer(task);
        renderTasks();
        taskInput.value = '';
    }

    function renderTasks() {
        sortTasksByCompletion();
        taskList.innerHTML = '';

        tasks.forEach((task, index) => {
            const listItem = document.createElement('li');
            const checkBox = document.createElement('input');

            checkBox.type = 'checkbox';
            checkBox.checked = task.completed;
            checkBox.className = 'styled-checkbox';
            checkBox.id = `taskCheckbox${index}`;

            const taskTextSpan = document.createElement('span');
            const editInput = document.createElement('input');
            editInput.id = 'editInput';
            const saveButton = document.createElement('button');
            const deleteButton = document.createElement('button');
            const editButton = document.createElement('button');
            const cancelButton = document.createElement('button');

            cancelButton.textContent = 'Cancel';
            cancelButton.style.display = 'none';

            taskTextSpan.textContent = task.text;
            taskTextSpan.id = task._id;
            editInput.value = task.text;
            editInput.style.display = 'none';
            saveButton.textContent = 'Save';
            saveButton.id = task._id;
            saveButton.style.display = 'none';
            deleteButton.textContent = 'Delete';
            deleteButton.id = task._id;
            editButton.textContent = 'Edit';
            editButton.id = task._id;

            listItem.appendChild(editInput);
            listItem.appendChild(checkBox);
            listItem.appendChild(taskTextSpan);
            listItem.appendChild(saveButton);
            listItem.appendChild(cancelButton);
            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);

            var taskText = listItem.querySelector('span');

            if (task.completed) {
                taskText.style.textDecoration = 'line-through'
                taskText.style.color = 'grey'
            }

            const checkbox = listItem.querySelector('input[type="checkbox"]');

            checkbox.addEventListener('change', () => {
                tasks[index].completed = checkbox.checked;
                sendEditedTaskToServer(tasks[index]);
                renderTasks();
            });

            deleteButton.addEventListener('click', () => {
                var delId = tasks[index]._id;
                tasks.splice(index, 1);
                deleteTaskFromServer(delId)
                renderTasks();
            });

            cancelButton.addEventListener('click', () => {
                editInput.style.display = 'none';
                taskTextSpan.style.display = 'inline-block';
                editButton.style.display = 'inline-block';
                checkBox.style.display = 'inline-block';
                saveButton.style.display = 'none';
                deleteButton.style.display = 'inline-block';

                editInput.value = tasks[index].text;
                cancelButton.style.display = 'none';
            });

            editButton.addEventListener('click', () => {
                taskTextSpan.style.display = 'none';
                editInput.style.display = 'inline-block';
                editButton.style.display = 'none';
                checkBox.style.display = 'none';
                cancelButton.style.display = 'inline-block';
                saveButton.style.display = 'inline-block';
                deleteButton.style.display = 'none';
            })

            taskTextSpan.addEventListener('dblclick', () => {
                taskTextSpan.style.display = 'none';
                editInput.style.display = 'inline-block';
                editButton.style.display = 'none';
                checkBox.style.display = 'none';
                cancelButton.style.display = 'inline-block';
                saveButton.style.display = 'inline-block';
                deleteButton.style.display = 'none';
            })

            saveButton.addEventListener('click', () => {
                const newText = editInput.value.trim();
                if (newText !== '') {
                    tasks[index].text = newText;
                    sendEditedTaskToServer(tasks[index]);
                    renderTasks();
                }
                cancelButton.style.display = 'none';
            });

            editInput.addEventListener('keyup', (event) => {
                if (event.key === "Enter") {
                    const newText = editInput.value.trim();
                    if (newText !== '') {
                        tasks[index].text = newText;
                        sendEditedTaskToServer(tasks[index]);
                        renderTasks();
                    }
                }
            })

            taskList.appendChild(listItem);
        });

        taskCount.textContent = `Total tasks: ${tasks.length}`;
    }

    addTaskBtn.addEventListener('click', () => {
        addTask(taskInput.value);
    });

    taskInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addTask(taskInput.value);
        }
    });

    function sortTasksByCompletion() {
        tasks.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return 0;
        });
    }

    async function saveTasksToLocalStorage(tasks) {
        try {
            const tasksJSON = JSON.stringify(tasks);
            localStorage.setItem('tasks', tasksJSON);
            renderTasks();
        } catch (error) {
            console.error('Error saving tasks to local storage:', error);
        }
    }

    async function sendNewTaskToServer(task) {
        try {
            const response = await fetch('/add-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task),
            })

            if (!response.ok) {
                saveTasksToLocalStorage(tasks);
            }
        } catch (error) {
            console.error('Error while executing a fetch request:', error, '- sendNewTaskToServer()');
            saveTasksToLocalStorage(tasks);
        }
    }

    async function sendEditedTaskToServer(task) {
        try {
            const response = await fetch('/edit-task?_method=PUT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task),
            })
            if (!response.ok) {
                saveTasksToLocalStorage(tasks);
            }
        } catch (error) {
            console.error('Error while executing a fetch request:', error, '- sendEditedTaskToServer()');
            saveTasksToLocalStorage(tasks);
        }
    }

    async function deleteTaskFromServer(taskId) {
        try {
            const response = await fetch('/delete-task/' + taskId, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                saveTasksToLocalStorage(tasks);
            }
        } catch (error) {
            console.error('Error while executing /delete-task/', taskId, error);
            saveTasksToLocalStorage(tasks);
        }
    }

    async function loadTasksFromServer() {
        try {
            const response = await Promise.race([
                fetch('/get-tasks'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('The waiting time has expired')), TIMEOUT_DURATION)
                ),
            ]);

            if (response.ok) {
                const data = await response.json();
                console.log('loadTasksFromServer() - Tasks are successfully retrieved from the server:', data);
                return data;
            }

        } catch (error) {
            console.error('Error when executing /get-tasks', error);
            const storedTasks = loadTasksFromLocalStorage();
            return storedTasks;
        }
    }

    function loadTasksFromLocalStorage() {
        try {
            const tasksJSON = localStorage.getItem('tasks');
            if (tasksJSON) {
                const tasks = JSON.parse(tasksJSON);
                return tasks;
            } else {
                console.log('Local storage does not contain tasks.');
                return [];
            }
        } catch (error) {
            console.error('Error when loading tasks from local storage:', error);
            return [];
        }
    }

});


