const express = require("express");
const bodyParser = require("body-parser");
const { format } = require("date-fns");
const axios = require("axios");

// Constants
const PORT = process.env.PORT || 3000;
const API_URL = 'https://bankoflemons.ru/api/v1/orders/create';

// Express setup
const app = express();
app.use(bodyParser.json());

// Helper functions
const formatProductOption = (option) => `${option.option}: ${option.variant}`;

const formatProductLine = (product) => {
  const baseText = `${product.name}`;
  const optionsText = product.options
    ? ` (${product.options.map(formatProductOption).join(", ")})`
    : "";
  const quantityPrice = ` – ${product.quantity}x${product.price}=${product.amount};`;
  
  return `${baseText}${optionsText}${quantityPrice}`;
};

const createTransactionItem = (orderData) => ({
  total: orderData.payment.amount,
  date: format(new Date(), "yyyy-MM-dd HH:mm"),
  email: orderData.ma_email,
  id: orderData.payment.orderid,
  items: orderData.payment.products.map(formatProductLine).join(""),
});

const sendToApi = async (transactionItem) => {
  try {
    const response = await axios.post(API_URL, transactionItem, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("API Error:", error.message);
    return { success: false, error };
  }
};

// Route handlers
app.get("/webhook", async (req, res) => {
  res.status(200).send("Webhook – ok");
  console.log("Webhook – ok");
});

app.post("/webhook", async (req, res) => {
  try {
    // Handle test requests
    if (req.body.test === "test") {
      return res.status(200).send("Test data received");
    }

    // Create transaction item
    const transactionItem = createTransactionItem(req.body);

    // Validate order ID
    if (!transactionItem.id) {
      console.error("Order ID is undefined");
      return res.status(400).json({
        error: "Invalid order data",
        message: "Missing order ID"
      });
    }

    // Send to API
    const { success, data, error } = await sendToApi(transactionItem);

    if (!success) {
      throw error;
    }

    console.log('Order sent to Bank of Lemons API:', data);
    return res.status(200).json({
      message: "Order received and saved successfully",
      orderId: transactionItem.id
    });

  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Error processing order"
    });
  }
});

// Server initialization
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Implement proper cleanup here if needed
  process.exit(1);
});
