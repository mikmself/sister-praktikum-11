import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sendMessage, sendStatusUpdate } from './kafka/producer.js';
import { startConsumer } from './kafka/consumer.js';

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

// In-memory storage for student data (in production, use a database)
const students = new Map();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/consumer', (req, res) => res.render('consumer'));
app.get('/mahasiswa-diterima', (req, res) => res.render('mahasiswa-diterima'));
app.get('/mahasiswa-ditolak', (req, res) => res.render('mahasiswa-ditolak'));

// Handle form POST - Add new student (legacy endpoint)
app.post('/send', async (req, res) => {
    try {
        const { nim, nama, email, notelpon, prodi } = req.body;
        const mahasiswa = { 
            nim, 
            nama, 
            email, 
            notelpon, 
            prodi, 
            status: null, // Initially null (pending)
            timestamp: new Date().toISOString()
        };
        
        // Store in memory
        students.set(nim, mahasiswa);
        
        // Send to Kafka
        await sendMessage(mahasiswa);
        
        console.log(`✅ Data mahasiswa baru dikirim: ${nim} - ${nama}`);
        res.redirect('/?success=true');
    } catch (error) {
        console.error('❌ Error sending student data:', error);
        res.redirect('/?error=true');
    }
});

// Handle AJAX form submission - Add new student
app.post('/submit', async (req, res) => {
    try {
        const { nim, nama, email, notelpon, prodi } = req.body;
        
        // Check if student ID already exists
        if (students.has(nim)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID already exists' 
            });
        }
        
        const mahasiswa = { 
            nim, 
            nama, 
            email, 
            notelpon, 
            prodi, 
            status: null, // Initially null (pending)
            timestamp: new Date().toISOString()
        };
        
        // Store in memory
        students.set(nim, mahasiswa);
        
        // Send to Kafka
        await sendMessage(mahasiswa);
        
        console.log(`✅ Data mahasiswa baru dikirim: ${nim} - ${nama}`);
        res.json({ 
            success: true, 
            message: 'Application submitted successfully',
            data: mahasiswa
        });
    } catch (error) {
        console.error('❌ Error sending student data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit application. Please try again.' 
        });
    }
});

// Handle status update (Accept/Reject)
app.post('/update-status', async (req, res) => {
    try {
        const { nim, status } = req.body;
        
        if (!students.has(nim)) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        const student = students.get(nim);
        const updatedStudent = {
            ...student,
            status: status,
            updatedAt: new Date().toISOString()
        };
        
        // Update in memory
        students.set(nim, updatedStudent);
        
        // Send status update to Kafka
        await sendStatusUpdate(updatedStudent);
        
        console.log(`✅ Status mahasiswa diupdate: ${nim} - ${status.toUpperCase()}`);
        res.json({ success: true, message: `Student ${status}` });
    } catch (error) {
        console.error('❌ Error updating student status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API endpoint to get all students by status
app.get('/api/students/:status?', (req, res) => {
    const { status } = req.params;
    const allStudents = Array.from(students.values());
    
    if (!status) {
        return res.json(allStudents);
    }
    
    const filteredStudents = allStudents.filter(student => {
        if (status === 'pending') return student.status === null;
        return student.status === status;
    });
    
    res.json(filteredStudents);
});

// API endpoint to get statistics
app.get('/api/stats', (req, res) => {
    const allStudents = Array.from(students.values());
    const stats = {
        pending: allStudents.filter(s => s.status === null).length,
        accepted: allStudents.filter(s => s.status === 'diterima').length,
        rejected: allStudents.filter(s => s.status === 'ditolak').length,
        total: allStudents.length
    };
    res.json(stats);
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected via WebSocket:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
    
    // Send current pending students to newly connected clients on consumer page
    socket.on('request-pending-students', () => {
        const pendingStudents = Array.from(students.values()).filter(s => s.status === null);
        pendingStudents.forEach(student => {
            socket.emit('new-mahasiswa', student);
        });
    });
});

// Start Kafka consumer and handle messages
startConsumer(
    // Handle new student data
    (mahasiswa) => {
        console.log('📨 Received new student from Kafka:', mahasiswa.nim);
        // Broadcast new student to all clients (will appear in pending list)
        io.emit('new-mahasiswa', mahasiswa);
    },
    // Handle status updates
    (statusUpdate) => {
        console.log('📨 Received status update from Kafka:', statusUpdate.nim, '-', statusUpdate.status);
        // Broadcast status update to all clients
        io.emit('status-update', statusUpdate);
    }
);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Web server berjalan di http://localhost:${PORT}`);
    console.log(`📋 Producer: http://localhost:${PORT}/`);
    console.log(`📊 Consumer Pending: http://localhost:${PORT}/consumer`);
    console.log(`✅ Mahasiswa Diterima: http://localhost:${PORT}/mahasiswa-diterima`);
    console.log(`❌ Mahasiswa Ditolak: http://localhost:${PORT}/mahasiswa-ditolak`);
}); 