import cors from 'cors';
import express from 'express';
import { Pool } from 'pg';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// database configurations
const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1919',
    port: 5432,
};

// connecting to database
const pool = new Pool(config);

// Function to create a users table in DB if not exist before
async function createUsersTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS Users(
            Email varchar(255) PRIMARY KEY,
            userName varchar(255),
            mobile int UNIQUE,
            password varchar(25),
            isAdmin boolean
        );
        `;

        const result = await pool.query(query);

        // console.log('Table is ready');
    } catch (error) {
        console.error('Error creating users table:', error);
    }
}

async function userExistCheck(email: string) {
    const query = `
        select * from users
        where email = $1
    `;
    const result = await pool.query(query, [email]);
    return result;
}

// Connection to register page
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        await createUsersTable();
        const user = await userExistCheck(email);

        if (user.rowCount > 0) {
            console.log('User already Exist!');
            res.status(200).json({ message: "User Already Registered" });
        }
        else {
            const query = `
                INSERT INTO users (email, username, password)
                VALUES ($1, $2, $3);
            `;

            // Inserting the users data into the users table
            const result = await pool.query(query, [email, username, password]);

            console.log('User registered successfully');
            res.status(201).send('User registered successfully');
        }

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('An error occurred during registration');
    }
});

// Connection to login page
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = `
            SELECT * FROM users WHERE email = $1;
        `;
        const result = await pool.query(query, [email]); // Taking users data in table

        // Checking if the users data exist in the table
        if (result.rows.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        // Checking if the password is correct
        const user = result.rows[0];
        const passwordMatch = password === user.password;

        if (!passwordMatch) {
            return res.status(401).send('Invalid credentials');
        }

        // Generating a JWT token for authenticated user
        const token = jwt.sign({ userId: user.id }, 'tenny');

        res.status(200).json({ token });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('An error occurred during login');
    }
});

// Assigning a port to run the server
app.listen(8082, () => {
    console.log('Server is running on port 8082');
});
