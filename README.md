# aQRo: QR-Coded Reusable Food and Beverage Containers for the Circular Economy

## Project Overview

aQRo is a mobile application supporting reusable food and beverage containers to promote a circular economy within pansiterias in Tuguegarao food services. The initiative addresses the critical issue of plastic and paper pollution from single-use packaging in the hospitality industry.


### Frontend
- React Native
- Redux 
- React Navigation
- Expo
- React Native Camera for QR scanning

### Backend
- Node.js
- Express.js
- Passport.js 
- Socket.io 

### Database
- MongoDB
- Mongoose ODM

### Containerization
- Docker
- Docker Compose

## Prerequisites

- Node.js (v14 or later)
- MongoDB
- Docker Desktop
- WSL 2 enabled
- Expo CLI
- Git

## Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/wabbit12/aqro-initital-testing
   cd aqro-initital-testing
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. Create `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://your_mongodb_host/your_db_name
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

2. Configure app.json in the frontend directory as needed for your Expo app

### Running the Application

#### Using Docker (recommended)
```bash
# From the project root
docker-compose up
```

#### Manual Start
1. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend application
   ```bash
   cd frontend
   npx expo start --web ('to view in web')
   ```


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/example-feature`)
3. Commit your changes (`git commit -m 'Add some example feature'`)
4. Push to the branch (`git push origin feature/example-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


