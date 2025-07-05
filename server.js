const express = require('express');
const app = express();
const Stripe = require('stripe');
const stripe = Stripe('sk_test_xxx'); // Replace with your Stripe secret key

app.use(express.json());

app.post('/create-subscription', async (req, res) => {
  try {
    const { token, email } = req.body;

    // Create a PaymentMethod with Google Pay token
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: token },
    });

    // Create customer
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: '29' }], // Replace with your Stripe monthly price ID
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({ success: true, subscriptionId: subscription.id });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
