const { Kafka } = require('kafkajs');

// Create Kafka client
const kafka = new Kafka({
  clientId: 'customer-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

// Create producer instance
const producer = kafka.producer();

// Initialize producer connection
let isConnected = false;
async function connectProducer() {
  if (!isConnected) {
    try {
      await producer.connect();
      isConnected = true;
      console.log('Connected to Kafka');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }
}

/**
 * Publish a customer registered event to Kafka
 * @param {Object} customer - The customer data to publish
 * @returns {Promise} Promise representing the publish operation
 */
async function publishCustomerRegistered(customer) {
  try {
    // Ensure producer is connected
    await connectProducer();
    
    // Send the message
    await producer.send({
      topic: 'weiyuans.customer.evt',
      messages: [
        { 
          value: JSON.stringify(customer) 
        }
      ]
    });
    
    console.log(`Published customer registered event for: ${customer.userId}`);
    return true;
  } catch (error) {
    console.error('Failed to publish customer registered event:', error);
    // Don't throw the error to prevent disrupting the API response flow
    // Just log it and return false to indicate failure
    return false;
  }
}

// Handle application shutdown
process.on('SIGTERM', async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  }
  process.exit(0);
});

module.exports = {
  connectProducer,
  publishCustomerRegistered
}; 