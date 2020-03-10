#!/bin/bash
cd home/ubuntu
pwd
echo "starting pm2"
pm2 start server.js -f
echo "error"