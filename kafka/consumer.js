import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'web-consumer',
    brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'web-group' });

export const startConsumer = async (onNewMahasiswa, onStatusUpdate) => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'web-messages', fromBeginning: false });
    await consumer.subscribe({ topic: 'status-updates', fromBeginning: false });
    
    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const text = message.value.toString();
            try {
                const data = JSON.parse(text);
                
                if (topic === 'web-messages') {
                    onNewMahasiswa(data); // kirim objek JSON ke WebSocket untuk mahasiswa baru
                } else if (topic === 'status-updates') {
                    onStatusUpdate(data); // kirim update status ke WebSocket
                }
            } catch (err) {
                console.error(' Gagal parse pesan Kafka:', err.message);
            }
        },
    });
}; 