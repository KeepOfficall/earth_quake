require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { Resend } = require('resend');

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
        trustServerCertificate: false
    }
};

const resend = new Resend("re_MDQDXqHE_4YUu2WQWtwmnvhhoATCVBSo7"); 

app.get("/", (req, res) => {
    res.send("Render API is running with Resend!");
});

app.post("/register", async (req, res) => {
    const { name, email, phone, region } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: "Не заполнены обязательные поля" });
    }

    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("phone", sql.NVarChar, phone)
            .input("region", sql.NVarChar, region)
            .query(`
                INSERT INTO users (name, email, phone, region)
                VALUES (@name, @email, @phone, @region)
            `);

        await resend.emails.send({
            from: "Zilzala Detector <onboarding@resend.dev>",
            to: email,
            subject: "Добро пожаловать!",
            html: `
                <h2>Привет, ${name}!</h2>
                <p>Вы успешно зарегистрированы на сайте <b>Зилзала Детектор</b>.</p>
                <p>Спасибо за вашу регистрацию!</p>
            `
        });

        res.json({ success: true });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
