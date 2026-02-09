const { logError, formatDate } = require('../../utils/logging');

async function handleLinkPaymentPaid(event) {
  try {
    const link = event; // event is already the link object
    console.log(`[${formatDate()}] - 🔗 DEBUG: Link payment event received`);
    console.log(`[${formatDate()}] - 🔗 Link payment paid: ${link.id}`);

    // Extract order ID from description
    const description = link.attributes.description;
    const orderIdMatch = description.match(/Order (ORD-\w+-\w+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (orderId) {
    console.log(`[${formatDate()}] - 🎯 Extracted order ID from description: ${orderId}`);
    } else {
      logError('❌ Could not extract order ID from payment link description');
    }
  } catch (error) {
    logError(`❌ Error handling link payment paid: ${error.message}`);
  }
}

module.exports = { handleLinkPaymentPaid };
