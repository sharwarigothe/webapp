NAME: Sharwari Gothe<BR>
CSYE6225 - Spring 2020

This application is build using nodejs and mysql server. To run this application locally, following are the steps:
- Clone and download this application from github using SSH format link
- The SSH key is set and will not ask for username or password
- Go on the terminal in the local repository folder and give command, node server.js
- This will run the application on localhost:3000 which carries out REST API Call; POST, PUT, GET and DELETE on the Bill Tracking Application
- Deploy commands for web application are : 
    - export AWS_PROFILE=prod
    - git checkout -b branch
    - git status
    - git add .
    - git commit -m "YOUR COMMIT MESSAGE"
    - git push sharwari <BRANCH_NAME>


- After sshing into the new instance
    -  ssh -i ~/.ssh/keypairprodus2 ubuntu@13.59.147.163

- scp the webapp into the new instance
    - scp -r webapp ubuntu@3.93.163.178:~/

- Inside the webapp follow these commands-
    - Install nodejs with these commands
        - sudo apt-get install curl
        - curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
        - sudo apt-get install -y nodejs

- CICD
    - The appspec.yml file is created in the root repository
    - The codedeploy folder contains the applicationStop.sh, afterInstall.sh and applicationStart.sh file
    - The application will be pushed into git branch. 
    - The web application is zipped and sent to S3 bucket.
    - The complete CICD process is executed and the appplication runs on the EC2 instance without manually sshing into the EC2 instance 
    - trying prod


