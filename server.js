const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const customersFile = path.join(dataDir, 'customers.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(ordersFile);
  } catch {
    await fs.writeFile(ordersFile, '[]\n', 'utf8');
  }

  try {
    await fs.access(customersFile);
  } catch {
    await fs.writeFile(customersFile, '[]\n', 'utf8');
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function validateOrderPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body must be a valid order object.';
  }

  const customer = payload.customer || {};
  const shippingAddress = payload.shippingAddress || {};

  if (!customer.fullName || !customer.emailAddress || !customer.phoneNumber) {
    return 'Customer fullName, emailAddress, and phoneNumber are required.';
  }

  if (
    !shippingAddress.houseNumber ||
    !shippingAddress.streetAddress ||
    !shippingAddress.city ||
    !shippingAddress.stateProvince ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    return 'Complete shippingAddress is required.';
  }

  if (!payload.paymentMethod) {
    return 'paymentMethod is required.';
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return 'Order must include at least one item.';
  }

  return null;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'uenaturals-order-api' });
});

app.post('/api/orders', async (req, res) => {
  const validationError = validateOrderPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const orderNumber = req.body.orderNumber || `UE${Date.now().toString().slice(-8)}`;
  const order = {
    ...req.body,
    orderNumber,
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  try {
    const [orders, customers] = await Promise.all([
      readJson(ordersFile),
      readJson(customersFile)
    ]);

    orders.push(order);

    customers.push({
      orderNumber,
      fullName: order.customer.fullName,
      emailAddress: order.customer.emailAddress,
      phoneNumber: order.customer.phoneNumber,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt
    });

    await Promise.all([
      writeJson(ordersFile, orders),
      writeJson(customersFile, customers)
    ]);

    return res.status(201).json({
      message: 'Order saved successfully.',
      orderNumber
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save order data.' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await readJson(ordersFile);
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const orders = await readJson(ordersFile);
    const order = orders.find((item) => item.orderNumber === req.params.orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`uenaturals order API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data storage.', error);
    process.exit(1);
  });
