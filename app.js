const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const host= process.env.host;
const user = process.env.user;
const password = process.env.password;


//Create connection with mysql

const db = mysql.createConnection({
    host : host,
    user : "dbuser",
    password : "Csye6225password",
    database: 'csye6225'
});

//Connect
db.connect((error) => {
    if(!error){
        console.log("DB Connection Established!");
       
    }
    else{
        console.log("DB Connection Failed \n Error: " +JSON.stringify(error,undefined,2));
    }
});


//console.log(JSON.stringify(db));


const userRoutes = require('./api/routes/user_details');
const billRoutes = require('./api/routes/user_bill');


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



//Routes which should handle requests
app.use('/v1/user', userRoutes);
app.use('/v1/bill', billRoutes);

app.use((req, res, next) =>{
    const error = new Error('Not Found');
    error.status(404);
    next(error);
})

app.use((error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        error:{
            message: error.message
        }
      
    });

});

db.query("CREATE TABLE IF NOT EXISTS user_details (id varchar(100), first_name varchar(30), last_name varchar(30), password varchar(100), email_address varchar(50), account_created datetime, account_updated datetime)", (err, res) => {
    console.log(err, res);
    //console.log(res.rows);
    console.log("User Table Created");
    //pool.end();
    });

db.query("CREATE TABLE IF NOT EXISTS Bill (id varchar(50), created_ts varchar(50), updated_ts varchar(50), owner_id varchar(50),vendor varchar(50), bill_date date, due_date date, amount_due double, categories varchar(50), paymentStatus enum('paid', 'due', 'past_due', 'no_payment_required'))", (err, res) => {
    console.log(err, res);
    //console.log(res.rows);
    console.log("Bill Table Created");
    //pool.end();
    });

db.query("CREATE TABLE IF NOT EXISTS File (file_name varchar(30), id varchar(50), url varchar(50), upload_date date, billid varchar(50), metadata varchar(300))", (err, res) => {
    console.log(err, res);
    //console.log(res.rows);
    console.log("File Table Created");
    //pool.end();
    });


    

module.exports = app;