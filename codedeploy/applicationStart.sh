   
#!/bin/bash

cd home/ubuntu
ls --all
ls --all
sudo npm install aws-sdk
sudo npm install multer-s3
pm2 start server.js -f