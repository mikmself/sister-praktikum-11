# Sistem Messaging Real-time Terdistribusi dengan Apache Kafka dan WebSocket

## Deskripsi

Aplikasi web real-time untuk manajemen data mahasiswa menggunakan Apache Kafka sebagai message broker dan WebSocket untuk komunikasi real-time. Sistem ini memungkinkan:

- ✅ **Input data mahasiswa** melalui form web (Producer)
- 📋 **Melihat data pending** yang menunggu persetujuan
- 🔘 **Accept/Reject mahasiswa** dengan tombol interaktif
- ✅ **Tracking mahasiswa diterima** secara real-time
- ❌ **Tracking mahasiswa ditolak** secara real-time

## Fitur Utama

- **Real-time Updates**: Perubahan status langsung muncul di semua halaman yang terbuka
- **Kafka Integration**: Menggunakan Apache Kafka untuk message queuing yang scalable
- **WebSocket**: Komunikasi bidirectional untuk update real-time
- **Multiple Views**: Halaman terpisah untuk pending, diterima, dan ditolak
- **Modern UI**: Interface yang responsive dan user-friendly

## Struktur Project

```
kafka-web-app/
├── kafka/
│   ├── producer.js    # Kafka producer untuk mengirim pesan
│   └── consumer.js    # Kafka consumer untuk menerima pesan
├── views/
│   ├── index.ejs           # Form input mahasiswa (Producer)
│   ├── consumer.ejs        # Daftar mahasiswa pending
│   ├── mahasiswa-diterima.ejs  # Daftar mahasiswa diterima
│   └── mahasiswa-ditolak.ejs   # Daftar mahasiswa ditolak
├── public/            # Static files (jika ada)
├── index.js          # Main server file
├── package.json      # Dependencies
└── README.md         # Dokumentasi ini
```

## Persyaratan Sistem

- **Node.js** v16 atau lebih baru
- **Apache Kafka** v2.8 atau lebih baru
- **Apache Zookeeper** (biasanya sudah bundled dengan Kafka)
- **Browser modern** dengan dukungan WebSocket

## Cara Menjalankan Project

### 1. Setup Apache Kafka & Zookeeper

#### Opsi A: Menggunakan Docker (Recommended)

Jika Anda sudah memiliki `docker-compose.yml`, jalankan:

```bash
cd /home/mikmprof/Desktop/Praktikum11
docker-compose up -d
```

#### Opsi B: Manual Installation

1. Download Apache Kafka dari https://kafka.apache.org/downloads
2. Extract dan masuk ke folder Kafka
3. Jalankan Zookeeper:
   ```bash
   bin/zookeeper-server-start.sh config/zookeeper.properties
   ```
4. Jalankan Kafka Broker (terminal baru):
   ```bash
   bin/kafka-server-start.sh config/server.properties
   ```

### 2. Setup Project Node.js

1. **Masuk ke folder project:**

   ```bash
   cd /home/mikmprof/Desktop/Praktikum11/kafka-web-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Buat Kafka Topics (opsional, akan dibuat otomatis):**
   ```bash
   # Jika menggunakan manual Kafka installation
   bin/kafka-topics.sh --create --topic web-messages --bootstrap-server localhost:9092
   bin/kafka-topics.sh --create --topic status-updates --bootstrap-server localhost:9092
   ```

### 3. Jalankan Aplikasi

```bash
node index.js
```

Server akan berjalan di: **http://localhost:3000**

## Cara Menggunakan Aplikasi

### 1. Input Data Mahasiswa (Producer)

- Akses: http://localhost:3000/
- Isi form dengan data: NIM, Nama, Email, No Telpon, Prodi
- Klik "Kirim Data Mahasiswa"
- Data akan dikirim ke Kafka dan muncul di halaman pending

### 2. Melihat & Mengelola Data Pending

- Akses: http://localhost:3000/consumer
- Lihat daftar mahasiswa yang statusnya masih pending
- Klik tombol **"Terima"** untuk menerima mahasiswa
- Klik tombol **"Tolak"** untuk menolak mahasiswa
- Data akan langsung berpindah ke halaman yang sesuai

### 3. Melihat Data Mahasiswa Diterima

- Akses: http://localhost:3000/mahasiswa-diterima
- Lihat semua mahasiswa yang telah diterima
- Update real-time setiap ada mahasiswa baru yang diterima

### 4. Melihat Data Mahasiswa Ditolak

- Akses: http://localhost:3000/mahasiswa-ditolak
- Lihat semua mahasiswa yang ditolak
- Update real-time setiap ada mahasiswa yang ditolak

## Testing Real-time Functionality

1. **Buka 4 tab browser:**

   - Tab 1: http://localhost:3000/ (Form input)
   - Tab 2: http://localhost:3000/consumer (Pending)
   - Tab 3: http://localhost:3000/mahasiswa-diterima (Diterima)
   - Tab 4: http://localhost:3000/mahasiswa-ditolak (Ditolak)

2. **Test scenario:**
   - Input data mahasiswa di Tab 1
   - Lihat data muncul real-time di Tab 2 (Pending)
   - Klik "Terima" atau "Tolak" di Tab 2
   - Lihat data berpindah real-time ke Tab 3 atau Tab 4

## API Endpoints

- **GET** `/` - Halaman form input mahasiswa
- **POST** `/send` - Submit data mahasiswa baru
- **GET** `/consumer` - Halaman mahasiswa pending
- **GET** `/mahasiswa-diterima` - Halaman mahasiswa diterima
- **GET** `/mahasiswa-ditolak` - Halaman mahasiswa ditolak
- **POST** `/update-status` - Update status mahasiswa (accept/reject)
- **GET** `/api/students/:status?` - API untuk mendapatkan data mahasiswa

## Troubleshooting

### Kafka Connection Error

```
Error: Connection to localhost:9092 failed
```

**Solusi:** Pastikan Kafka broker sudah berjalan di port 9092

### Module Import Error

```
SyntaxError: Cannot use import statement outside a module
```

**Solusi:** Pastikan `package.json` memiliki `"type": "module"`

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solusi:** Ganti port atau kill process yang menggunakan port 3000:

```bash
lsof -ti:3000 | xargs kill -9
```

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Message Broker**: Apache Kafka
- **Real-time Communication**: Socket.IO (WebSocket)
- **Template Engine**: EJS
- **Frontend**: HTML, CSS, JavaScript

## Struktur Data Mahasiswa

```json
{
  "nim": "123456789",
  "nama": "John Doe",
  "email": "john.doe@example.com",
  "notelpon": "081234567890",
  "prodi": "Teknik Informatika",
  "status": null, // null=pending, "diterima", "ditolak"
  "timestamp": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:30:00.000Z"
}
```

## Pengembangan Lebih Lanjut

- [ ] Implementasi database (MongoDB/PostgreSQL)
- [ ] Authentication & authorization
- [ ] Logging & monitoring
- [ ] Unit testing
- [ ] Docker containerization
- [ ] Load balancing untuk multiple instances

---

**Dibuat untuk Praktikum Sistem Terdistribusi**  
_Universitas AMIKOM Purwokerto_
