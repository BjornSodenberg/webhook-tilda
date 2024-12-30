const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { format } = require("date-fns");

const app = express();
const port = process.env.PORT || 3000;

// const serviceAccount = require("./serviceAccountKey.json");
// Получаем путь из переменной окружения
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let serviceAccount;
if (serviceAccountPath) {
  serviceAccount = require(serviceAccountPath);
} else {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS не задана.");
}

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
  }

  const transactionItem = {
    count: orderData.payment.amount,
    date: format(new Date(), "yyyy-MM-dd HH:mm"),
    email: orderData.ma_email,
    id: orderData.payment.orderid,
    items: orderData.payment.products
      .map((p) => {
        if (p.options) {
          const optionsString = p.options
            .map((option) => `${option.option}: ${option.variant}`)
            .join(", ");
          return `${p.name} (${optionsString}) – ${p.quantity}x${p.price}=${p.amount};`;
        }
        return `${p.name} – ${p.quantity}x${p.price}=${p.amount};`;
      })
      .join(""),
  };

  console.log("Prepared transactionItem:", transactionItem);

  if (!transactionItem.id) {
    console.error("Order ID is undefined");
    return res.status(400).send("Invalid order data, missing order ID");
  }

  try {
    const docRef = await db.collection("transactions").add(transactionItem);
    console.log("Added order with ID:", docRef.id);

    // Then, send to Bank of Lemons API
    const apiResponse = await axios.post(
      'https://bankoflemons.ru/api/v1/orders/create',
      transactionItem,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Order sent to Bank of Lemons API:', apiResponse.data);
    res.status(200).send("Order received and saved successfully");
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).send("Error saving order");
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
