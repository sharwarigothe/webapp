const express = require('express');
const router = express.Router();
var uuid = require('uuid');
const uuidv1 = require("uuid/v1");
const mysql = require('mysql');
const app = require("../../app");
const bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
const saltRounds = 10;
const host=process.env.host;
const user = process.env.user;
const password = process.env.password;
const logger = require('../../config/winston');
const SDC = require('statsd-client'), sdc = new SDC({host: 'localhost', port: 8125});



router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

const db = mysql.createConnection({
    host : host,
    user : user,
    password : password,
    database: 'csye6225'
});

//Connect
db.connect((error) =>{
    if(!error){
        console.log("DB Connection Established!");
       
    }
    else{
        console.log("DB Connection Failed \n Error: " +JSON.stringify(error,undefined,2));
    }
});

//CloudWatch


//POST Request

router.post('/', function(req, res, next) {

    const u = uuidv1();
    const uuid = u;
    const id = uuid;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const password = req.body.password;
    const email_address = req.body.email_address;


    var d = new Date();
    var n = d.getMilliseconds();


    // logger.info("USER_POST LOG");
    // sdc.increment('USER_POST_counter');
    // sdc.timing('some.timer');

    logger.info("USER_POST LOG");
    sdc.increment('USER_POST_counter');
    sdc.timing('some.timer');
    


    var date_ob = new Date();
   
let date = ("0" + date_ob.getDate()).slice(-2);

// // current month
 let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// // current year
 let year = date_ob.getFullYear();

// // current hours
 let hours = date_ob.getHours();

// // current minutes
 let minutes = date_ob.getMinutes();

// // current seconds
 let seconds = date_ob.getSeconds();

let Milliseconds = d.getMilliseconds();

// prints date & time in YYYY-MM-DD HH:MM:SS format
const timestamp=(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
console.log(timestamp); 
  
    
const account_created = timestamp;
const account_updated = timestamp;

const emailregex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
const passwordregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;


var validemail = emailregex.test(email_address);
var validpassword = passwordregex.test(password);

db.query(`select * from user_details where email_address = "${email_address}"`,function(error, resulte){
    //console.log("hgfd"+resulte.length);
    if(resulte.length > 0){
        console.log("hgfd"+resulte.length);
        console.log(resulte);
        res.status(400).send({error: 'Email already exists'});
    }
    else if(!validemail){
        res.status(401).
            json({ messege:"please enter a valid email",});
    
        }
        
        else if(!validpassword){
                res.status(401).json({error: "please enter strong password"});
             }
        
       
        else{
            console.log("getting res time");
            sdc.timing('USER_response_time');
            bcrypt.hash(password, saltRounds, function(err,hash) {
               // db.query(`INSERT INTO user_details (id, first_name, last_name, password, email_address, account_created, account_updated) values (?,?,?,?,?,?,?)`,[uuid, first_name, last_name, hash, email_address, account_created, account_updated],function(error, results, row){
                let abhash = hash;
                console.log("jffu"+abhash);
            db.query(`INSERT INTO user_details (id, first_name, last_name, password, email_address, account_created, account_updated) values ("${uuid}","${first_name}", "${last_name}", "${abhash}","${email_address}", "${account_created}","${account_updated}")`,function(error, results, row){
                var n3 = d.getMilliseconds();
                if(error){
                logger.error(err);
                res.status(400).send({error: 'Something went wrong in POST'});
            }
            else if(email_address == results.email_address){
                res.status(400).send({error: 'exist'});
                logger.error(err);
                throw error;
            }
            else{
                var n4 = d.getMilliseconds();
                var duration1 = (n4-n3);
                sdc.timing("Post User DB Duration",duration1);
                logger.info("Post User DB duration "+duration1);
                res.status(201).json({id, first_name, last_name, email_address, account_created, account_updated});
            }
        });
        //console.log(hash);
    });
    }
});
var n1 = d.getMilliseconds();
var duration = (n1-n);
sdc.timing("Post User Time Duration",duration);
logger.info("Post duration "+duration);

});


//GET Request

router.get('/self', function(req, res, next) {

    const id=req.params.id;
  //  const uuid = id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email_address = req.body.email_address;

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("USER_GET LOG");
    sdc.increment('USER_GET counter');
    
    
   
       // res.render('index', {title: 'Hello fine users'});
       if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1)
        console.log(password1)

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                res.status(500).send({error: 'Something went wrong in GET'})
            }
            else if(results.length > 0){
                var pa = results[0].password;
                console.log("hgfd"+pa);
                bcrypt.compare(password1, pa, (error, result) => {

                    // pool.query("SELECT email, firstname, lastname FROM users where email = '"+username1+"' and PASSWORD='"+password1+"'", (error, results) => {
                         if(result == true){
                            // console.log("checksfe"+results.rows[0]);
    
                            // res.status(200).json({results})
    
                            logger.info("the User with username '"+username1+"' retrieved");
                                 res.status(200).json({
                                     EMAIL: results[0].email_address,
                                     FIRST_NAME: results[0].first_name,
                                     LAST_NAME: results[0].last_name,
                                     Created_Time: results[0].account_created,
                                     Updated_Time:results[0].account_updated
    
    
                                 })
                     }
                     
                             
                             else{
                                 console.log("checksfe"+results);
                                 logger.error("Please enter valid username and password");
                                 res.status(401).json({
                                    message:"invalid username or password"
                                 })
                             }
                     
                            
                            
                         });
            }
            else{
                res.status(401).json({
                                 
                    message:"invalid username or password"
                })
            }
           // res.status(200).json({results})
        });

       }
    
    // db.query( `select id, first_name, last_name, email_address, account_created, account_updated from user_details where id = "${id}"`,function(error, results,row){
    //     if(error){
    //         res.status(500).send({error: 'Something went wrong in GET'})
    //     }
    //     res.status(200).json({results})
    // })
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Get User Time Duration",duration);
    });


//PUT Request

    router.put('/self', function(req, res, next) {

        var d = new Date();
        var n = d.getMilliseconds();
        logger.info("USER_PUT LOG");
        sdc.increment('USER_PUT counter');

        if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
            // Get the username and password
            var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
            header = header.split(":");
        
            var usernameREQ = header[0];
            var passwordREQ = header[1];
            
            console.log(usernameREQ)
            console.log(passwordREQ)
         //   db.query( `select id, first_name, last_name, password, email_address, account_created, account_updl_address = "${username}"`,function(error, results,row){
            db.query(`SELECT * FROM user_details where email_address = "${usernameREQ}"`,function(error, results)  {
                if(error){
                    throw error;
                }
                else if(results.length >0) {
                   
                    var pa = results[0].password;
                
                    bcrypt.compare(passwordREQ, pa, (error, result) => {
                        console.log("gfd"+results[0].email_address);
                        if(result == true){
                                 console.log("VERIFIED");
                                 var d = new Date();
                                 var n = d.getMilliseconds();
                             
                             // // current month
                                 var date_ob = new Date();
                             
                                 //
                                
                             let date = ("0" + date_ob.getDate()).slice(-2);
                             
                              let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                             
                             // // current year
                              let year = date_ob.getFullYear();
                             
                             // // current hours
                              let hours = date_ob.getHours();
                             
                             // // current minutes
                              let minutes = date_ob.getMinutes();
                             
                             // // current seconds
                              let seconds = date_ob.getSeconds();
                             
                             let milliseconds = d.getMilliseconds();
                             
                             // prints date & time in YYYY-MM-DD HH:MM:SS format
                             const timestamp=(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
                             console.log(timestamp); 
                               
                             
                             const account_updated = timestamp; 
                             
                             const first_name = req.body.first_name;
                             const last_name = req.body.last_name;
                             const password = req.body.password;
                             const email_address=req.body.email_address;
                            
                                                
                                    const passregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
                             
                                    var validpass = passregex.test(password);
                                    if(!validpass){
                                                res.status(401).
                                                json({ messege:"please enter a strong password",});
                                                 }
                                    else if((password=="") || (first_name=="") || (last_name=="")){
                                                res.status(401).
                                                json({ messege:"please enter all the fields",});
                                                 }
                                
                                    else if(email_address == usernameREQ){
                                        bcrypt.hash(password,saltRounds,function(err,hash){
                                            db.query( `UPDATE user_details SET first_name ="${first_name}", last_name = "${last_name}",password = "${hash}", account_updated = "${account_updated}"  WHERE email_address = "${usernameREQ}"`,function(error, results1){
                                           
                                                if(error){
                                                    throw error
                                                }                                                    
                                                     res.status(200).json({
                                                             message:"User Updated successfully",
                                                                first_name: first_name,
                                                                LAST_NAME: last_name,
                                                                EMAIL: results[0].email_address,
                                                                Created_Time: results[0].account_created,
                                                                Updated_Time:account_updated
                                                         });
                                                        });          
                                                
            
          
                                                    });
        
                                        }
                                        else{
                                            res.status(400).json({error: "Email addresses should match"});
                                        }
                             }
                             else{
                                res.status(401).json({
                                                     
                                    message:"invalid username or password"
                                })
                            }
                    });
                }
                else{
                    res.status(401).
                    json({ messege:"This user does not exists",});
                     }
            });
        }
        
        var n1 = d.getMilliseconds();
        var duration = (n1-n);
        sdc.timing("Put User time duration",duration);
});

module.exports = router;