require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    server: "arthquakeserver.database.windows.net",
    database: "EarlyAlert",
    user: "user",
    password: "Node123!",
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// ======= Почтовый транспорт Gmail (локально работает) =======
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "ulanovulukbek2@gmail.com",
        pass: "owod pobm ctpg edyu" // App password
    }
});

// ======= Главная =======
app.get("/", (req, res) => {
    res.send("Local API is working");
});

// ======= Регистрация =======
app.post('/register', async (req, res) => {
    const { name, email, phone, region } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: "Не заполнены обязательные поля" });
    }

    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('region', sql.NVarChar, region)
            .query(`
                INSERT INTO users (name, email, phone, region)
                VALUES (@name, @email, @phone, @region)
            `);

        const mailOptions = {
            from: "ulanovulukbek2@gmail.com",
            to: email,
            subject: "Добро пожаловать!",
            text: `Привет, ${name}! Ты успешно зарегистрирован локально!`
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true });

    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ======= Старт =======
app.listen(3000, () => console.log("Local server running at http://localhost:3000"));
