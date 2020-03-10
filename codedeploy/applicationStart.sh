#!/bin/bash
cd home/ubuntu
echo "starting pm2"
pm2 start server.js -f
echo "error"