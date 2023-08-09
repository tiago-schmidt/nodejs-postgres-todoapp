const express = require('express');
const cors = require('cors');
const { Pool } = require('pg')
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

const env = require('dotenv');
env.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`Server running on port ${port}`));

const handleResponse = (res, data, isError = false) => {
    const code = isError ? 400 : 200;
    return res.status(code).send(data);
}

app.get('/', () => { console.log('GET on /') });

app.get('/users', async (_, res) => {
    try {
        const { rows: users } = await pool.query('SELECT * FROM users');
        return handleResponse(res, users);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});

app.post('/session', async (req, res) => {
    const { username } = req.body;
    try {
        let user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username]);
        if(!user.rows[0]) {
            user = await pool.query('INSERT INTO users (user_name) VALUES ($1)', [username]);
        }
        return handleResponse(res, user.rows);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});

app.post('/todo/:user_id', async (req, res) => {
    const { description, done } = req.body;
    const { user_id } = req.params;

    try {
        const query = `
            INSERT INTO todos (todo_description, todo_done, user_id)
            VALUES ($1, $2, $3)
        `;
        const { rows: newTodo } = await pool.query(query, [description, done, user_id]);
        return handleResponse(res, newTodo);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});

app.get('/todo/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const query = `
            SELECT * FROM todos
            WHERE user_id = ($1)
        `;
        const { rows: userTodos } = await pool.query(query, [user_id]);
        return handleResponse(res, userTodos);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});

app.put('/todo/:user_id/:todo_id', async (req, res) => {
    const { user_id, todo_id } = req.params;
    const { description, done } = req.body;

    try {
        const query = `
            UPDATE todos
            SET todo_description = ($1), todo_done = ($2)
            WHERE todo_id = ($3)
            AND user_id = ($4)
            RETURNING *
        `;
        const { rows: updatedTodo } = await pool.query(query, [description, done, todo_id, user_id]);
        return handleResponse(res, updatedTodo);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});

app.delete('/todo/:user_id/:todo_id', async (req, res) => {
    const { user_id, todo_id } = req.params;

    try {
        const query = `
            DELETE FROM todos
            WHERE todo_id = ($1)
            AND user_id = ($2)
            RETURNING *
        `;
        const { rows: deletedTodo } = await pool.query(query, [todo_id, user_id]);
        return handleResponse(res, deletedTodo);
    } catch (error) {
        return handleResponse(res, error, true);
    }
});