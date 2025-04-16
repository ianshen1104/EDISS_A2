#!/bin/bash

# This script tags and pushes the AMD64 images to Docker Hub
# Replace 'DOCKERHUB_USERNAME' with your actual Docker Hub username

DOCKERHUB_USERNAME="ianshencmu"

# Check if username has been updated
if [ "$DOCKERHUB_USERNAME" == "REPLACE_WITH_YOUR_USERNAME" ]; then
  echo "ERROR: Please edit this script first and replace REPLACE_WITH_YOUR_USERNAME with your actual Docker Hub username"
  exit 1
fi

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Tag all images with Docker Hub username
echo "Tagging images with $DOCKERHUB_USERNAME..."

docker tag book-service:amd64-v2 $DOCKERHUB_USERNAME/book-service:amd64-v2
docker tag customer-service:amd64-v2 $DOCKERHUB_USERNAME/customer-service:amd64-v2
docker tag web-bff:amd64-v2 $DOCKERHUB_USERNAME/web-bff:amd64-v2
docker tag mobile-bff:amd64-v2 $DOCKERHUB_USERNAME/mobile-bff:amd64-v2

# Push all images to Docker Hub
echo "Pushing images to Docker Hub..."

docker push $DOCKERHUB_USERNAME/book-service:amd64-v2
docker push $DOCKERHUB_USERNAME/customer-service:amd64-v2
docker push $DOCKERHUB_USERNAME/web-bff:amd64-v2
docker push $DOCKERHUB_USERNAME/mobile-bff:amd64-v2

echo "All images pushed to Docker Hub successfully!"
echo ""
echo "To pull these images on your EC2 instances, use:"
echo "docker pull $DOCKERHUB_USERNAME/book-service:amd64-v2"
echo "docker pull $DOCKERHUB_USERNAME/customer-service:amd64-v2"
echo "docker pull $DOCKERHUB_USERNAME/web-bff:amd64-v2" 
echo "docker pull $DOCKERHUB_USERNAME/mobile-bff:amd64-v2" 