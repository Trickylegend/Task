const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs')
const bodyParser = require('body-parser')
const methodOverride = require('method-override');
const app = express()

const PORT = 3000


const db = 'mongodb+srv://qwerty:qwe123@cluster0.wibxgtk.mongodb.net/toDoList?retryWrites=true&w=majority';


mongoose
    .connect(db)
    .then((res) => console.log('Connected to MongoDB'))
    .catch((error) => console.log(error));


app.listen( PORT, (error) => {
        error ? console.log(error) : console.log("listening port ${PORT}")
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.json());
app.use(express.json())
app.use(express.static('static'));
app.use(methodOverride('_method'));


const taskSchema = new mongoose.Schema({
    text: String,
    completed: Boolean,
});

const Task = mongoose.model('Task', taskSchema);

app.get('/main', (req,res) => {
    res.sendFile(__dirname + '/static/index.html');
});

app.get('/get-tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        console.error('Ошибка при получении задач из базы данных:', error);
        res.status(500).json({ error: 'Ошибка при получении задач' });
    }
});

app.post('/add-task', async (req, res) => {
    const task = req.body;

    try {
        const newTask = new Task(task);
        await newTask.save();

        res.sendStatus(200);
    } catch (error) {
        console.error('Error when saving a task:', error);
        res.sendStatus(500);
    }
});


app.put('/edit-task', async (req, res) => {
    const task = req.body;
    try {
        Task
            .findByIdAndUpdate(task._id, task)
            .then(result => res.sendStatus(200))
            .catch((error) =>{
                res.sendStatus(500)
            })
    } catch (error) {
        console.error('Error when changing the task:', error);
        res.sendStatus(500);
    }
});

app.delete('/delete-task/:taskId', async (req, res) => {
    const taskId = req.params.taskId;
    try {
        Task
            .findByIdAndDelete(taskId)
            .then(result => res.sendStatus(200))
            .catch((error) => res.sendStatus(500))
    } catch (error) {
        console.error('Error when deleting a task:', error);
        res.sendStatus(500);
    }
});
