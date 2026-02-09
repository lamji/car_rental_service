const paymongo = require('@api/paymongo');

/**
 * @desc    GCash Payment - Full flow (Create Intent → Create Method → Attach)
 * @route   POST /api/payments/gcash
 * @access  Private
 */
exports.gcashPayment = async (req, res) => {
  const { amount, description, billing, returnUrl, metadata } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount is required and must be greater than 0',
    });
  }

  if (!returnUrl) {
    return res.status(400).json({
      success: false,
      message: 'Return URL is required for GCash payments',
    });
  }

  try {
    // Step 1: Create Payment Intent (using fetch from official docs)
    console.log("📦 Step 1: Creating Payment Intent...");
    
    const intentOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            payment_method_allowed: ['gcash'],
            payment_method_options: { card: { request_three_d_secure: 'any' } },
            currency: 'PHP',
            capture_type: 'automatic',
            description: description || 'GCash Payment',
            ...(metadata && { metadata: metadata })
          }
        }
      })
    };

    const intentResponse = await fetch('https://api.paymongo.com/v1/payment_intents', intentOptions);
    const intentData = await intentResponse.json();
    
    if (!intentResponse.ok) {
      throw new Error(intentData.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    console.log('✅ Payment Intent created:', intentData);
    const paymentIntentId = intentData.data.id;
    const clientKey = intentData.data.attributes.client_key;

    // Step 2: Create Payment Method (using fetch from official docs)
    console.log("📦 Step 2: Creating Payment Method...");
    
    const methodOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'gcash',
            billing: billing || null
          }
        }
      })
    };

    const methodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', methodOptions);
    const methodData = await methodResponse.json();
    
    if (!methodResponse.ok) {
      throw new Error(methodData.errors?.[0]?.detail || 'Failed to create payment method');
    }

    console.log('✅ Payment Method created:', methodData);
    const paymentMethodId = methodData.data.id;

    // Step 3: Attach Payment Method to Payment Intent (using fetch from official docs)
    console.log("📦 Step 3: Attaching Payment Method to Payment Intent...");
    
    const attachOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: returnUrl
          }
        }
      })
    };

    const attachResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, attachOptions);
    const attachData = await attachResponse.json();
    
    if (!attachResponse.ok) {
      throw new Error(attachData.errors?.[0]?.detail || 'Failed to attach payment method');
    }

    console.log('✅ Payment Method attached:', attachData);
    
    // Get the redirect URL for GCash authorization
    const nextAction = attachData.data.attributes.next_action;
    const checkoutUrl = nextAction?.redirect?.url || null;

    return res.status(200).json({
      success: true,
      message: 'GCash payment initiated successfully',
      data: {
        paymentIntentId: paymentIntentId,
        paymentMethodId: paymentMethodId,
        clientKey: clientKey,
        status: attachData.data.attributes.status,
        amount: amount,
        currency: 'PHP',
        checkoutUrl: checkoutUrl,
        returnUrl: returnUrl,
      },
    });
  } catch (error) {
    console.error('❌ GCash payment error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || error.message || 'GCash payment failed',
      errors: error.response?.data?.errors || null,
    });
  }
};
