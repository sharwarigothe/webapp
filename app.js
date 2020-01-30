const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');

//Create connection with mysql

const db = mysql.createConnection({
    host : 'localhost',
    user : 'sharwari',
    password : 'password',
    database: 'UserDetails'
});

//Connect
db.connect(() => {
    // if(err)
    //     {console.error(err);
          
    //     }else{
    
    // console.log('MySql Connected');
    //     }
});



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

module.exports = app;