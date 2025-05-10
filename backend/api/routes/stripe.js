const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, servicioId, mascotaId } = req.body;
    
    // Verify service exists and get price from database
    const [service] = await connection.query(
      'SELECT precio FROM servicios WHERE id = ?',
      [servicioId]
    );

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(service.precio * 100),
      currency: 'mxn',
      metadata: {
        servicioId,
        mascotaId
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-invoice', async (req, res) => {
  try {
    const { paymentIntentId, servicioId, mascotaId } = req.body;
    
    // Get payment details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Generate XML invoice using template
    const xmlInvoice = generateXMLInvoice({
      amount: paymentIntent.amount / 100,
      servicioId,
      mascotaId,
      paymentId: paymentIntentId,
      date: new Date()
    });

    res.json({ xmlInvoice });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
