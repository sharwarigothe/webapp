#!/bin/bash
cd /home/ubuntu
pwd
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/cloudwatch-agent-config.json -s
ls --all
pm2 start server.js -f

