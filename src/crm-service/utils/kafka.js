const { Kafka } = require('kafkajs');
const { sendWelcomeEmail } = require('./email');

// Create Kafka client
const kafka = new Kafka({
  clientId: 'crm-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

// Create consumer instance
const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'weiyuans-crm-service'
});

// Flag to track connection status
let isConnected = false;

/**
 * Connect the Kafka consumer and subscribe to the customer events topic
 */
async function connectConsumer() {
  if (!isConnected) {
    try {
      console.log(`Attempting to connect to Kafka brokers: ${process.env.KAFKA_BROKERS}`);
      await consumer.connect();
      
      const topic = process.env.KAFKA_TOPIC || 'weiyuans.customer.evt';
      console.log(`Subscribing to topic: ${topic}`);
      
      await consumer.subscribe({ 
        topic: topic,
        fromBeginning: true 
      });
      
      isConnected = true;
      console.log('Connected to Kafka and subscribed to topic');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }
}

/**
 * Start consuming messages from the Kafka topic
 */
async function startConsumer() {
  await connectConsumer();
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(`Received message from topic: ${topic}, partition: ${partition}`);
        
        // Parse the customer data from the message
        const rawMessage = message.value.toString();
        console.log(`Raw message: ${rawMessage}`);
        
        const customerData = JSON.parse(rawMessage);
        console.log(`Processed customer data: ${JSON.stringify(customerData)}`);
        console.log(`Received customer registration event for: ${customerData.userId}`);

        // Send welcome email to the customer
        const emailSent = await sendWelcomeEmail(customerData);
        if (emailSent) {
          console.log(`Welcome email successfully sent to ${customerData.userId}`);
        } else {
          console.error(`Failed to send welcome email to ${customerData.userId}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });

  console.log('Kafka consumer started. Listening for customer events...');
  console.log(`Group ID: ${process.env.KAFKA_GROUP_ID || 'weiyuans-crm-service'}`);
  console.log(`Topic: ${process.env.KAFKA_TOPIC || 'weiyuans.customer.evt'}`);
}

// Handle application shutdown
process.on('SIGTERM', async () => {
  if (isConnected) {
    await consumer.disconnect();
    console.log('Disconnected from Kafka');
  }
  process.exit(0);
});

module.exports = {
  startConsumer
}; 