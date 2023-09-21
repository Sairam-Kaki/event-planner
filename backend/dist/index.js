"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const body_parser_1 = __importDefault(require("body-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// database configurations
const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1919',
    port: 5432,
};
// connecting to database
const pool = new pg_1.Pool(config);
// Function to create a users table in DB if not exist before
function createUsersTable() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = `
            CREATE TABLE IF NOT EXISTS users (
                email VARCHAR(100) PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(50) NOT NULL
            );
        `;
            const result = yield pool.query(query);
            // console.log('Table is ready');
        }
        catch (error) {
            console.error('Error querying data:', error);
        }
    });
}
function userExistCheck(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
        select * from users
        where email = $1
    `;
        const result = yield pool.query(query, [email]);
        return result;
    });
}
// Connection to register page
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, password } = req.body;
    try {
        yield createUsersTable();
        const user = yield userExistCheck(email);
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
            const result = yield pool.query(query, [email, username, password]);
            console.log('User registered successfully');
            res.status(201).send('User registered successfully');
        }
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('An error occurred during registration');
    }
}));
// Connection to login page
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const query = `
            SELECT * FROM users WHERE email = $1;
        `;
        const result = yield pool.query(query, [email]); // Taking users data in table
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, 'tenny');
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('An error occurred during login');
    }
}));
// Assigning a port to run the server
app.listen(8082, () => {
    console.log('Server is running on port 8082');
});
