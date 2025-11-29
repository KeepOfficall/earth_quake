// server.js
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    server: "SARBAGYSHOV",
    database: "EarlyAlert",
    user: "node_user",
    password: "Node123!",
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Настройка почтового транспорта
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Маршрут для регистрации ---
app.post('/register', async (req, res) => {
    const { name, email, phone, region } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: "Не заполнены обязательные поля" });
    }

    try {
        // Подключаемся к базе
        const pool = await sql.connect(dbConfig);

        // Вставляем данные в таблицу users
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
            from: 'ulanovulukbek2@gmail.com',
            to: email,
            subject: 'Добро пожаловать в Зилзала Детектор!',
            text: `Привет, ${name}!\n\nВы успешно зарегистрированы на сайте Зилзала Детектор. Теперь вы будете получать новости и уведомления о сейсмостанциях.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.error('Ошибка отправки письма:', err);
            else console.log('Письмо отправлено:', info.response);
        });

        res.json({ success: true });

    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Запуск сервера ---
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
