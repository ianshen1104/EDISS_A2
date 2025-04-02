#!/bin/bash

# Start all services in the background

# Start Book Service
echo "Starting Book Service on port 3000..."
cd book-service
npm install &> /dev/null
node app.js &
BOOK_PID=$!
cd ..

# Start Customer Service
echo "Starting Customer Service on port 3001..."
cd customer-service
npm install &> /dev/null
node app.js &
CUSTOMER_PID=$!
cd ..

# Wait a bit for backend services to start
sleep 2

# Start Web BFF
echo "Starting Web BFF on port 8080..."
cd web-bff
npm install &> /dev/null
node app.js &
WEB_PID=$!
cd ..

# Start Mobile BFF
echo "Starting Mobile BFF on port 8081..."
cd mobile-bff
npm install &> /dev/null
node app.js &
MOBILE_PID=$!
cd ..

echo "All services started!"
echo "- Book Service: http://localhost:3000"
echo "- Customer Service: http://localhost:3001"
echo "- Web BFF: http://localhost:8080"
echo "- Mobile BFF: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "kill $BOOK_PID $CUSTOMER_PID $WEB_PID $MOBILE_PID; exit" INT
wait 