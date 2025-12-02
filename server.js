require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ======= Конфиг Azure SQL =======
const dbConfig = {
    server: "earthquakeserver.database.windows.net", // твой сервер
    database: "EarlyAlert",                           // твоя база
    user: "user",                                     // твой SQL login
    password: "Node123!",                             // твой пароль
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// ======= Почтовый транспорт Gmail (SMTP) =======
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "ulanovulukbek2@gmail.com",
        pass: "owod pobm ctpg edyu" // твой App Password
    }
});

// ======= Главная страница (тест) =======
app.get("/", (req, res) => {
    res.send("Render API is working!");
});

// ======= Маршрут регистрации =======
app.post("/register", async (req, res) => {
    const { name, email, phone, region } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: "Не заполнены обязательные поля" });
    }

    try {
        // Подключение к базе Azure SQL
        const pool = await sql.connect(dbConfig);

        // Вставка пользователя в базу
        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("phone", sql.NVarChar, phone)
            .input("region", sql.NVarChar, region)
            .query(`
                INSERT INTO users (name, email, phone, region)
                VALUES (@name, @email, @phone, @region)
            `);

        // Отправка письма пользователю
        await transporter.sendMail({
            from: "ulanovulukbek2@gmail.com",
            to: email,
            subject: "Добро пожаловать!",
            text: `Привет, ${name}! Вы успешно зарегистрированы на сайте Зилзала Детектор!`
        });

        res.json({ success: true });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ======= Запуск сервера =======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
