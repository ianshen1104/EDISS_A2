#!/bin/bash

# Script to build all Docker images for the microservices

echo "Building Book Service image..."
docker build -t book-service ./book-service

echo "Building Customer Service image..."
docker build -t customer-service ./customer-service

echo "Building Web BFF image..."
docker build -t web-bff ./web-bff

echo "Building Mobile BFF image..."
docker build -t mobile-bff ./mobile-bff

echo "All images built successfully!"
echo "Run 'docker images' to see the created images." 