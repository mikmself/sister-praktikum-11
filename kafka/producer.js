import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'web-producer',
    brokers: ['localhost:9092'],
});

const producer = kafka.producer();
await producer.connect();

export const sendMessage = async (mahasiswa) => {
    await producer.send({
        topic: 'web-messages',
        messages: [{ value: JSON.stringify(mahasiswa) }],
    });
};

export const sendStatusUpdate = async (mahasiswaUpdate) => {
    await producer.send({
        topic: 'status-updates',
        messages: [{ value: JSON.stringify(mahasiswaUpdate) }],
    });
}; 