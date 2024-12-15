// Gestion des webhooks Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handleSuccessfulPayment(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            await handleFailedPayment(event.data.object);
            break;
    }

    res.json({received: true});
};

async function handleSuccessfulPayment(paymentIntent) {
    const donation = await db.getDonationByPaymentIntent(paymentIntent.id);
    await db.updateDonationStatus(donation.id, 'completed');
    await emailService.sendThankYouEmail(donation.email);
} 