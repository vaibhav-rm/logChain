# LogChain 🔗

A blockchain-anchored log integrity system that provides tamper-proof verification of server logs using Merkle trees and Ethereum smart contracts.

## 📋 Overview

LogChain ensures the integrity of server logs by:
- Computing Merkle roots from log batches
- Anchoring these roots to a blockchain (Ethereum)
- Providing cryptographic verification to detect any tampering
- Offering a web dashboard for managing devices, batches, and verification

## ✨ Features

- **Blockchain Anchoring**: Merkle roots are permanently stored on Ethereum blockchain
- **Cryptographic Verification**: Verify log integrity using Merkle proofs
- **Device Management**: Register and monitor multiple server devices
- **Batch Tracking**: View and manage log batches with their anchoring status
- **Real-time Dashboard**: Beautiful web interface for monitoring your log chain
- **JWT Authentication**: Secure user authentication and authorization
- **Smart Contract Integration**: Ethereum smart contract for immutable storage

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database for storing batches, users, and devices
- **Web3.py** - Ethereum blockchain interaction
- **JWT** - Token-based authentication
- **Py-Solc-X** - Solidity compiler integration

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Blockchain
- **Solidity** - Smart contract language
- **Ethereum** - Blockchain network

### Client Agent
- **Python** - Log collection and Merkle tree computation

## 🏗️ Architecture

```
┌─────────────────┐
│  Client Agent   │ → Reads logs, computes Merkle roots
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Backend API    │ → Stores batches, manages devices
│  (FastAPI)      │ → Anchors roots to blockchain
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌──────────────┐
│ MongoDB│  │  Ethereum   │
│        │  │  Blockchain │
└────────┘  └──────────────┘
         │
         ↓
┌─────────────────┐
│  Frontend UI    │ → Dashboard, device management
│  (React + Vite) │ → Batch viewing & verification
└─────────────────┘
```

## 📁 Project Structure

```
logChain/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI routes and app setup
│   │   ├── auth.py          # JWT authentication
│   │   ├── db.py            # MongoDB connection
│   │   ├── eth.py           # Ethereum/Web3 integration
│   │   ├── models.py        # Pydantic models
│   │   ├── schemas.py       # API request/response schemas
│   │   └── utils.py         # Utility functions
│   ├── contracts/
│   │   └── LogAnchor.sol    # Ethereum smart contract
│   ├── requirements.txt     # Python dependencies
│   └── run.sh              # Backend startup script
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/            # API client modules
│   │   │   ├── auth.js     # Authentication API
│   │   │   ├── batches.js  # Batch management API
│   │   │   ├── config.js   # API configuration
│   │   │   └── devices.js  # Device management API
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app component
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── logChain-client/         # Python client agent
    ├── client.py           # Main client logic
    └── requirements.txt     # Client dependencies
```

## 🚀 Prerequisites

- **Python 3.13+** (for backend and client)
- **Node.js 18+** and npm (for frontend)
- **MongoDB** (running locally or remote instance)
- **Ethereum node** (local or Infura/Alchemy endpoint)
- **MetaMask** or similar (for deploying contracts, optional)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd logChain
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env  # Or create manually
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional, for custom API URL)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

### 4. Client Agent Setup

```bash
cd logChain-client

# Install dependencies
pip install -r requirements.txt
```

## ⚙️ Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=logchain

# JWT Authentication
SECRET_KEY=your-secret-key-here

# Ethereum/Web3
PRIVATE_KEY=your-ethereum-private-key
RPC_URL=http://127.0.0.1:8545  # Or use Infura/Alchemy
CONTRACT_ADDRESS_FILE=./deployed_contract_addr.txt

# Optional
CONTRACT_ADDRESS_FILE=./deployed_contract_addr.txt
```

### Frontend (.env)

Create a `.env` file in the `frontend/` directory (optional):

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Client Agent

Set environment variables or modify `client.py`:

```env
DEVICE_ID=your-device-id
BACKEND_URL=http://127.0.0.1:8000
LOG_DIR=./logs
```

## 🏃 Running the Project

### 1. Start MongoDB

Make sure MongoDB is running:

```bash
# Using systemd (Linux)
sudo systemctl start mongodb

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Deploy Smart Contract (First Time Only)

```bash
cd backend
python deploy_and_run.py
```

This will compile and deploy the contract, saving the address to `deployed_contract_addr.txt`.

### 3. Start Backend

```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the run script
./run.sh
```

Backend will be available at `http://localhost:8000`

API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173` (or the port Vite assigns)

### 5. Run Client Agent (Optional)

```bash
cd logChain-client

# Create logs directory with sample logs
mkdir -p logs
echo "Sample log entry" > logs/system.log

# Run the client
python client.py
```

## 📡 API Endpoints

### Authentication

- `POST /signup` - Register new user
- `POST /login` - Login (returns JWT token)

### Devices

- `GET /devices` - List user's devices (requires auth)
- `POST /devices` - Register new device (requires auth)

### Batches

- `GET /batches` - List user's batches (requires auth)
- `GET /batches/{batch_id}` - Get batch details
- `POST /batches` - Create new batch (requires auth)
- `POST /batches/{batch_id}/anchor` - Anchor batch to blockchain
- `GET /batches/{batch_id}/verify` - Verify batch on-chain
- `GET /onchain/total` - Get total anchored batches

All authenticated endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## 🎯 Usage

### 1. Create Account

1. Navigate to `http://localhost:5173/signup`
2. Enter email and password
3. You'll be logged in automatically and redirected to the dashboard

### 2. Register a Device

1. Go to the Devices page
2. Click "Add Device"
3. Enter device ID and name
4. Use this device ID in your client agent

### 3. Start Log Collection

1. Configure the client agent with your device ID
2. Point it to your log directory
3. The agent will:
   - Read logs periodically
   - Compute Merkle roots
   - Send batches to the backend
   - Optionally anchor batches to blockchain

### 4. View and Verify Batches

1. Go to the Logs page
2. View all your batches
3. Click "View Details" to see batch information
4. Use "Verify Batch" to check on-chain status

## 🔐 Security Notes

- Never commit `.env` files or private keys to version control
- Use strong `SECRET_KEY` values in production
- Consider using environment-specific configurations
- Protect your Ethereum private keys
- Use HTTPS in production
- Implement rate limiting for production APIs

## 🧪 Development

### Backend Development

```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Linting

```bash
# Frontend
cd frontend
npm run lint
```

## 📝 API Documentation

When the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive API documentation with request/response schemas.

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Check connection string in .env
# Default: mongodb://127.0.0.1:27017
```

### Ethereum Connection Issues

- Ensure your Ethereum node is running (or use Infura/Alchemy)
- Verify `RPC_URL` in `.env` is correct
- Check that your private key has test ETH (for testnets)

### Frontend Can't Connect to Backend

- Verify backend is running on port 8000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check CORS settings in backend (already configured for `*`)

### Contract Not Deployed

```bash
cd backend
python deploy_and_run.py
```

This will deploy the contract and save the address.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Vaibhav**

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- React team for the powerful UI library
- Ethereum Foundation for blockchain infrastructure
- All open-source contributors

---

**Note**: This is a development project. Use at your own risk in production environments. Ensure proper security measures and testing before deploying.

