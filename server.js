require('dotenv').config(); 

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    server: "earthquakeserver.database.windows.net",
    database: "EarlyAlert",
    user: "user",
    password: "Node123!",
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

app.get("/", (req, res) => {
    res.send("API is working");
});

// Настройка почтового транспорта через Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "ulanovulukbek2@gmail.com",
        pass: "owod pobm ctpg edyu"  // Google App Password
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

        // Настройка письма
        const mailOptions = {
            from: "ulanovulukbek2@gmail.com",
            to: email,
            subject: 'Добро пожаловать!',
            text: `Привет, ${name}!\n\nВы успешно зарегистрированы на сайте Зилзала Детектор. Теперь вы будете получать новости и уведомления о сейсмостанциях.`
        };

        // Отправка письма
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