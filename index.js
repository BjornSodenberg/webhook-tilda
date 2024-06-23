const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { format } = require("date-fns");

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(bodyParser.json());

app.get("/webhook", async (req, res) => {
  res.status(200).send("Webhook – ok");
  console.log("Webhook – ok");
});

app.post("/webhook", async (req, res) => {
  const orderData = req.body;

  // Проверка на данные { test: "test" }
  if (orderData.test === "test") {
    return res.status(200).send("Test data received");
  } else {
    const transactionItem = {
      count: orderData.payment.amount,
      date: format(new Date(), "yyyy-MM-dd hh:mm"),
      email: orderData.ma_email,
      id: orderData.payment.orderId,
      items: orderData.payment.products.map((p) => {
        if (p.options) {
          // "Футболка Зимний ЗаХод 2024 (Размер: L) – 1x350 ≡ 350"
          return `${p.name} (${p.options.option}: ${p.options.variant}) – ${p.quantity}x${p.price}=${p.amount};`;
        }
        // "Футболка Зимний ЗаХод 2024 – 1x350 ≡ 350"
        return `${p.name} – ${p.quantity}x${p.price}=${p.amount};`;
      }),
    };

    try {
      const docRef = await db.collection("transactions").add(transactionItem);
      console.log("Добавлен заказ с ID:", docRef.id);

      res.status(200).send("Заказ получен и сохранен успешно");
    } catch (error) {
      console.error("Ошибка при сохранении заказа:", error);

      res.status(500).send("Ошибка при сохранении заказа");
    }
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
