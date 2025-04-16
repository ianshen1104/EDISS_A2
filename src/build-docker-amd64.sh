#!/bin/bash

# Script to build all Docker images for the microservices targeted for AMD64 architecture

# Ensure buildx is set up
docker buildx inspect --bootstrap

echo "Building Book Service image for AMD64..."
docker buildx build --platform linux/amd64 -t book-service:amd64-v2 --load ./book-service

echo "Building Customer Service image for AMD64..."
docker buildx build --platform linux/amd64 -t customer-service:amd64-v2 --load ./customer-service

echo "Building Web BFF image for AMD64..."
docker buildx build --platform linux/amd64 -t web-bff:amd64-v2 --load ./web-bff

echo "Building Mobile BFF image for AMD64..."
docker buildx build --platform linux/amd64 -t mobile-bff:amd64-v2 --load ./mobile-bff

echo "All AMD64 images built successfully!"
echo "Run 'docker images' to see the created images."
echo ""
echo "To push to Docker Hub, first tag with your Docker Hub username:"
echo "docker tag book-service:amd64-v2 yourusername/book-service:amd64-v2"
echo "docker tag customer-service:amd64-v2 yourusername/customer-service:amd64-v2"
echo "docker tag web-bff:amd64-v2 yourusername/web-bff:amd64-v2"
echo "docker tag mobile-bff:amd64-v2 yourusername/mobile-bff:amd64-v2"
echo ""
echo "Then push:"
echo "docker push yourusername/book-service:amd64-v2"
echo "docker push yourusername/customer-service:amd64-v2"
echo "docker push yourusername/web-bff:amd64-v2"
echo "docker push yourusername/mobile-bff:amd64-v2" 