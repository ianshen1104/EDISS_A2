#!/bin/sh
cd crm-service
npm install
docker build -t crm-service . 