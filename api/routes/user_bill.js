const express = require('express');
const router = express.Router();
var uuid = require('uuid');
const uuidv1 = require("uuid/v1");
const mysql = require('mysql');
const app = require("../../app");
const bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
const multer = require('multer');
var fs  = require('fs');
const host=process.env.host;
const user = process.env.user;
const password = process.env.password;
const awssecretaccesskey = process.env.awssecretaccesskey;
const awsaccesskeyid = process.env.awsaccesskeyid;
const region = process.env.region;
const ImageS3Bucket = process.env.ImageS3Bucket;
const aws = require('aws-sdk');
//const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new aws.S3();
const SDC = require('statsd-client'), sdc = new SDC({host: 'localhost', port: 8125});
const logger = require('../../config/winston');

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

aws.config.update({

    secretAccessKey: awssecretaccesskey,
    accessKeyId: awsaccesskeyid,
    region: region
});

// const storage = multer.diskStorage({
//     destination: function(req, file, cb){
//         cb(null,'./uploads')
//     },
//     filename: function(req,file,cb){
//         cb(null,new Date().toString()+ file.originalname);
//     }
// })


//var upload = multer({storage: storage, fileFilter : fileFilter});


router.post("/",(req,res,next)=>{

   

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_POST LOG");
    sdc.increment('BILL_POST counter');


    var date_ob=new Date();
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



// prints date & time in YYYY-MM-DD HH:MM:SS format
const timestamp=(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

const created_ts = timestamp;
const updated_ts = timestamp;


console.log(timestamp); 
//const u1 = uuidd();
const u1 = uuidv1();
const id = u1;
const bill={
        

        vendor: req.body.vendor,
        bill_date: req.body.bill_date,
        due_date: req.body.due_date,
        amount_due: req.body.amount_due,
        categories: req.body.categories,
        paymentStatus: req.body.paymentStatus

    };

    var stringObj = JSON.stringify(bill.categories);
    console.log(stringObj);
    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
        // Get the username and password
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");

    
        var username1 = header[0];
        var password1 = header[1];
        console.log(username1);
        console.log(password1);

        var date_regex = /^(?:(?:(?:(?:(?:[1-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:[2468][048]|[13579][26])00))(\/|-|\.)(?:0?2\1(?:29)))|(?:(?:[1-9]\d{3})(\/|-|\.)(?:(?:(?:0?[13578]|1[02])\2(?:31))|(?:(?:0?[13-9]|1[0-2])\2(?:29|30))|(?:(?:0?[1-9])|(?:1[0-2]))\2(?:0?[1-9]|1\d|2[0-8])))))$/;
        var validdate = date_regex.test(bill.bill_date);
        var validdue = date_regex.test(bill.due_date);

        db.query(`Select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "`+username1+`"`, function(error, results){
            console.log(results);
            if(error){
                throw error;
            }

            else if(results.length>0){
              var pa = results[0].password;
                var uuid = results[0].id;
                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();

                        if(Number(bill.amount_due< 0.01)|| (Number(bill.amount_due > 20000))){
                           res.status(400).json({error: "The amount due is either less than minimum amount or greater than the maximum amount"});
                       }
                       if(Number(bill.amount_due === undefined)){
                        res.status(400).json({error: "amount due empty"});
                       }
                       else if(bill.paymentStatus === undefined){
                        res.status(400).json({error: "paymentStatus empty"});
                       }
                    
                    else if(!validdate){
                        res.status(400).json({error: "Bill_date not valid"});
                    }
                    else if(!validdue){
                        res.status(400).json({error: "Due date not valid"});
                    }

                       else if(bill.paymentStatus == "paid" || bill.paymentStatus == "due" || bill.paymentStatus == "past_due" || bill.paymentStatus == "no_payment_required"){
                       
                       db.query("INSERT INTO Bill (id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus) VALUES ('"+id+"','"+created_ts+"','"+updated_ts+"','"+uuid+"','"+bill.vendor+"','"+bill.bill_date+"','"+bill.due_date+"','"+bill.amount_due+"','"+stringObj+"','"+bill.paymentStatus+"')",function(error,ress){
                        console.log(ress);
                        if(error){
                            console.log("error in insert");
                            throw error;
                        }
                        

                        else if(!bill.vendor || !bill.bill_date || !bill.due_date || !bill.amount_due || !bill.categories || !bill.paymentStatus){
                            res.status(400).json({error: "Please enter required fields"});
                        }

                        

                        else{
                        logger.info("Bill with id '"+u1+"' inserted successfully");
                        var n4 = d.getMilliseconds();
                        var duration1 = (n4-n3);
                        sdc.timing("Post Bill DB Duration",duration1);
                        logger.info("Post Bill DB duration "+duration1);
                        res.status(200).json({message: "Bill inserted",
                        id: u1,
                        created_ts : timestamp,
                        updates_ts : timestamp,
                        owner_id: uuid,
                        vendor: bill.vendor,
                        bill_date:bill.bill_date,
                        due_date: bill.due_date,
                        amount_due: bill.amount_due,
                        categories: bill.categories,
                        paymentStatus: bill.paymentStatus
                        });
                    }
                    });
                }
                else{
                    logger.error("Please enter valid payment status");
                    res.status(400).json({error: "Enter valid payment status"});
                }
                    }
                    else{
                        logger.error("Please enter valid password");
                        res.status(400).json({error: "Password does not match"});
                    }
                })

            }
            else{
                logger.error("User Does not exist");
                res.status(400).json({error: "User Does not exist"});
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Post Bill Time",duration);
    logger.info("Post Bill duration "+duration);
});

router.get("/:id",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_GET LOG");
    sdc.increment('BILL_GET counter');

    const id = req.params.id;
    console.log(id);

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                throw error;
            }
            else if(results.length >0){
                var pa = results[0].password;
                var uuid = results[0].id;

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();
                        db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus from Bill where id = "${id}"`,function (error,resulte){
                          
                            if(error){
                                throw error;
                            }
                            if(resulte == false){
                                res.status(404).json({error: "bill id does not exist"});
                                console.log("Wrong id");
                            }
                            else if(resulte[0].owner_id == results[0].id){  
                                logger.info("BILL_GET LOG");
                                var n4 = d.getMilliseconds();
                                var duration1 = (n4-n3);
                                sdc.timing("GET BILL DB Duration",duration1);
                                logger.info("GET BILL DB duration "+duration1);
                                var cat = JSON.parse(resulte[0].categories);
                                res.status(200).json({
                                    id: id,
                                    created_ts: resulte[0].created_ts,
                                    updated_ts: resulte[0].updated_ts,
                                    owner_id: resulte[0].owner_id,
                                    vendor: resulte[0].vendor,
                                    bill_date: resulte[0].bill_date,
                                    due_date: resulte[0].due_date,
                                    amount_due: resulte[0].amount_due,
                                    categories: cat,
                                    paymentStatus: resulte[0].paymentStatus
                            
                                })
                            }
                            else{
                                res.status(401).json({error: "UNAUTHORIZED, Cannot fetch other users bill"});
                            }
                          
  
                        });
                    }
                    else{
                        res.status(404).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Get Bill Time",duration);
    logger.info("GET Bill duration "+duration);
});


//GET ALL BILLS

router.get("/",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_ALL_GET LOG");
    sdc.increment('BILL_ALL_GET counter');

   //const urlid = req.params.id;
    //console.log(id);

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                throw error;
            }
            else if(results.length >0){
                var pa = results[0].password;
                var uuid = results[0].id;
                console.log(uuid);
            

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();
                        //db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories from Bill where id = "${id}"`,function (error,resulte,rows,fields){
                            db.query(`Select * from Bill where owner_id = "${uuid}"`,function (error,resulte,rows,fields){  
                            if(error){
                                throw error;
                            }
                           
                            else{
                                logger.info("BILL_ALL_GET LOG");
                                
                                var n4 = d.getMilliseconds();
                                var duration1 = (n4-n3);
                                sdc.timing("GET ALL-BILL DB Duration",duration1);
                                logger.info("GET ALL-BILL DB duration "+duration1);
                                console.log(resulte);
                                res.status(200).json({message:"all values",
                                data : resulte
                                           
                                    
                                     
                            });

                          
                            }
                          
  
                        });
                    }
                    else{
                        logger.error("User does not exist");
                        res.status(400).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Get BILLS time",duration);
    logger.info("GET ALL BILLS duration "+duration);
});

//GET BILL DUE EMAIL

router.get("/due/",(req,res)=>{

   // const x = req.params.x;
    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_ALL_GET LOG");
    sdc.increment('BILL_ALL_GET counter');
    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, resultsemail,row){
            if(error){
                throw error;
            }
            else if(resultsemail.length >0){
                var pa = resultsemail[0].password;
                var uuid = resultsemail[0].id;
                console.log(uuid);

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){

                        var n3 = d.getMilliseconds();

                        var today = new Date();
                        var newdate = new Date();
                        newdate.setDate(today.getDate() + 10);

                        logger.info("today: "+today);
                        logger.info("newdate: "+newdate);
                        
                        db.query(`Select * from Bill where owner_id = "${uuid}"`,function (error,resultdate,rows,fields){
                            logger.info("due date: "+resultdate[0].due_date);
                            if(error){
                                throw error;
                            }
                            else if(resultdate[0].due_date < newdate){
                                logger.info("BILL_ALL_DUE_GET LOG");
                                //logger.info("due date: "+resultdate[0].due_date);
                                
                                var n4 = d.getMilliseconds();
                                var duration1 = (n4-n3);
                                sdc.timing("GET ALL-DUE-BILL DB Duration",duration1);
                                logger.info("GET ALL-DUE-BILL DB duration "+duration1);
                                
                                
                                res.status(200).json({message:"all values",
                                data : resultdate
                            });
                            }
                            else{
                                res.status(200).json({message:"no bills"})
                            }
                        });
                    }
                    else{
                        logger.error("User does not exist");
                        res.status(400).json({error: "User does not exist"});
                    }
                });


            }    
        }); 
        
    }

});



router.delete("/:id",(req,res)=>{

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_DEL LOG");
    sdc.increment('BILL_DEL counter');

    const id=req.params.id;
    console.log("ID:"+id);
    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
     
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var usernameREQ = header[0];
        var passwordREQ = header[1];

        db.query("SELECT  * from Bill where id = '"+id+"'", (error, results) => {
        if(error){
            throw error;
        }
        else if(results.length>0){
            ownerID=results[0].owner_id;
            console.log("OWNER ID :"+ownerID);
            db.query("SELECT  * FROM user_details where email_address = '"+usernameREQ+"'", (error, results2) => {
                if(error){
                    throw error;
                }
                else if(results2.length >0) {
                  
                    var pa = results2[0].password;
                  
                    bcrypt.compare(passwordREQ, pa, (error, result) => {
                        if(error){
                            throw error;
                        }
                        if(result == true){
                            var n3 = d.getMilliseconds();
                            if( results2[0].id==ownerID){
                              

                                db.query("DELETE FROM Bill where id = '"+id+"'", (error, results2) => {
                                    if(error){
                                        throw error;
                                    }
                                    else{
                                        db.query("SELECT * from File where billid = '"+id+"'", (error, result31) =>{
                                            if(error){
                                                throw error;
                                            }
                                            else if(result31.length>0){
                                                db.query("Delete from File where billid = '"+id+"'", (error, result3) =>{
                                           
                                                    if(error){
                                                        throw error;
                                                    }
        
                                                  else{
                                                    logger.info("DELETE API SUCCESS");
                                                    var n4 = d.getMilliseconds();
                                                    var duration1 = (n4-n3);
                                                    sdc.timing("DELETE BILL DB Duration",duration1);
                                                    logger.info("DELETE BILL DB and from S3 bucket duration "+duration1);
                                                    const s3 = new aws.S3();
                                                    var params = { Bucket: ImageS3Bucket, Key: id }
                                                    s3.deleteObject(params, function (err, data) {
                                                        if (err) {
                                                            return res.send({ "error": err });
                                                        }
                                                      //  res.send({ data });
                                                      res.status(200).json({ messege:"Bill and Attachment DELETED SUCCESSFULLY"})
                                                    });
                                                  }
                                                 
                                                   
                                               
                                                });
                                            }
                                            // var filePath = result31[0].url;
                                            
                                            // console.log(filePath);

                                            // if (fs.existsSync(filePath)) {
                                            //     fs.unlinkSync(filePath);
                                            // }
                                            // else{
                                            //     console.log("file already deleted from folder");
                                                
                                            // }
                                        

                                        
                                    });
                                       
                                    }
                                });
                            
                                
                                
                            }
                            else{
                             
                                res.status(401).
                                        json({ messege:"You Cannot delete this bill"});
                                         
                            }
                        }
                        if(result == false){
                         
                            res.status(401).
                            json({ message:"Password does not match"});
                        }
                    })
                    
                    }
                    else if(results2.length <1) {
                      
                        res.status(401).
                        json({ messege:"Email id does not match"});
                    }
    });
    }
    else if(results.length==0){
        console.log("invalid bill id");
        res.status(404).
         json({ messege:"Bill Not Found"});
    }
});
    }
   var n1 = d.getMilliseconds();
   var duration = (n1-n);
   sdc.timing("Delete Bill Time",duration);
});


//PUT

router.put("/:id",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_PUT LOG");
    sdc.increment('BILL_PUT counter');
  

    var date_ob=new Date();
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



// prints date & time in YYYY-MM-DD HH:MM:SS format
const timestamp=(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
console.log(timestamp); 
var updated_ts = timestamp;
    const bill={
                               
            vendor: req.body.vendor,
            bill_date: req.body.bill_date,
            due_date: req.body.due_date,
            amount_due: req.body.amount_due,
            categories: req.body.categories,
            paymentStatus: req.body.paymentStatus
        
        
         };
         console.log(bill.amount_due+"ffffffffffffffffffffffffffff");
         var stringObj = JSON.stringify(bill.categories);
            const id=req.params.id;
            console.log(" ID:"+id);

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                throw error;
            }
            else if(results.length >0){
                var pa = results[0].password;
                var uuid = results[0].id;

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();
                        db.query(`Select * from Bill where id = "${id}"`, function(error, ress){

                            if(error){
                                throw error;
                            }
                            else if(results[0].id != ress[0].owner_id){
                                    res.status(400).json({message : "You cannot update other users bill"});
                            }
                            else if(Number(bill.amount_due< 0.01)|| (Number(bill.amount_due > 20000))){
                                res.status(400).json({error: "The amount due is either less than minimum amount or greater than the maximum amount"});
                            }
                            else if(Number(bill.amount_due === undefined)){
                                res.status(400).json({error: "amount due empty"});
                               }
                               else if(bill.paymentStatus === undefined){
                                res.status(400).json({error: "paymentStatus empty"});
                               }
                               else if(!bill.vendor || !bill.bill_date || !bill.due_date || !bill.amount_due || !bill.categories || !bill.paymentStatus){
                                res.status(400).json({error: "Please enter required fields"});
                            }
                            


                            else if(ress.length>0){

                                if(bill.paymentStatus == "paid" || bill.paymentStatus == "due" || bill.paymentStatus == "past_due" || bill.paymentStatus == "no_payment_required"){
                                db.query("UPDATE Bill SET  updated_ts='"+updated_ts+"',vendor='"+bill.vendor+"',bill_date='"+bill.bill_date+"',due_date='"+bill.due_date+"',amount_due='"+bill.amount_due+"',categories='"+stringObj+"',paymentStatus='"+bill.paymentStatus+"' where id = '"+id+"'",function (error,resulte){
                                    //var ownerid = ress[0].owner_id;
                            
                                    if(error){
                                        throw error;
                                    }
                                    
                                     
                                
                                    else{
                                        logger.info("PUT BILL API SUCCESS");
                                        var n4 = d.getMilliseconds();
                                        var duration1 = (n4-n3);
                                        sdc.timing("PUT BILL DB Duration",duration1);
                                        logger.info("PUT BILL DB duration "+duration1);
                                        res.status(200).json({
                                            Id : ress[0].id,
                                            created_ts : ress[0].created_ts,
                                            updated_ts : updated_ts,
                                            Ownerid : ress[0].owner_id,
                                            Vendor : bill.vendor,
                                            bill_date : bill.bill_date,
                                            Due_date : bill.due_date,
                                            amount_due : bill.amount_due,
                                            Categories : bill.categories,
                                            paymentStatus : bill.paymentStatus,
                                            message: "Updated"});
                                    }
                                  
          
                                });
                            }
                            else{
                                logger.error("Enter valid payment status");
                                res.status(400).json({error: "Enter valid payment status"});
                            }
                            }
                            else{
                                logger.error("Bill not found");
                                res.status(404).json({error: "Bill not found"});
                            
                            }
                        })
                    
                    }
                    else{
                        logger.error("User does not exist");
                        res.status(401).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Put Bill Time",duration);
    logger.info("PUT Bill duration "+duration);
});


//POST FILE TO BILL

router.post("/:id/file",function(req, res){
   
    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_FILE_POST LOG");
    sdc.increment('BILL_FILE_POST counter');
  //console.log(req.file);
  var meta_data = JSON.stringify(req.file);
 
  console.log(meta_data);
    const Billid = req.params.id;

  
    var date_ob=new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
// // current month
 let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// // current year
 let year = date_ob.getFullYear()



// prints date & time in YYYY-MM-DD HH:MM:SS format
const timestamp=(year + "-" + month + "-" + date);
console.log(timestamp); 
var uploadDate = timestamp;

const fileFilter = (req,file,cb)=>{
    if(file.mimetype ==='image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf'){
        cb(null,true)
    }
    else{
        cb(new Error('invalid mime type, only  pdf, jpg, jpeg and png are accepted'),false);
    }
}




const upload = multer({
    fileFilter,
  storage: multerS3({
    s3: s3,
    bucket: ImageS3Bucket,
    metadata: function (req, file, cb) {
        console.log(file);
        fileloc = JSON.stringify(file);
       //fileloc=file;
      cb(null, {fieldName: file.fieldname});
    },
     key: function (req, file, cb) {
       cb(null, Billid)
     }
  })
})


const singleupload = upload.single('BillFile');

//const filename = req.file.originalname;
//const filepath = req.file.path;

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                throw error;
            }
            else if(results.length >0){
                var pa = results[0].password;
                var uuid = results[0].id;

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();
                        db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus from Bill where id = "${Billid}"`,function (error,resulte){
                          
                            if(error){
                                throw error;
                            }
                            if(resulte == false){
                                res.status(404).json({error: "bill id does not exist"});
                                console.log("Wrong id");
                            }
                            else if(resulte[0].owner_id == results[0].id){  
                                const fileId = uuidv1();
                                singleupload(req,res,function(err){
                                    if(err){
                                        return res.status(400).send({errors:[{title:'File upload error',detail:err.message}]});
                                    }
                                    
                                        db.query("Select * from File where billid = '"+Billid+"'", function(error, billresult){
                                            if(error){
                                                throw error;
                                            }
                                            if(billresult.length > 0){
                                                
                                                res.status(400).json({error: "Attachment already exists. Cannot add multiple files"});
                                                console.log(billresult[0].url);
                                               // var filePath = billresult[0].url; 
                                                //fs.unlink(filepath, function(err){
                                                  //  if(err){
                                                    //    throw err;
                                                //     }
                                                //     console.log("File not uploaded");
                                                // });
                                            }
                                            else if(req.path = ""){
                                                res.status(400).json({error: "Please attach file"});
                                            }
                                            else{
                                                db.query("INSERT INTO File (file_name, id, url, upload_date, billid, metadata) values ('"+req.file.originalname+"', '"+fileId+"', '"+req.file.location+"', '"+uploadDate+"', '"+Billid+"', '"+fileloc+"')", function(error, results){

                                                    if(error){
                                                        throw error;
                                                    }
                                                    else{

                                                        db.query("UPDATE Bill SET attachment= '"+fileloc+"' where id = '"+Billid+"'", function(error, results){
                                                            if(error){
                                                                throw error;
                                                            }
                                                       
                                                        logger.info("File with id '"+fileId+"'added successfully");
                                                        var n4 = d.getMilliseconds();
                                                        var duration1 = (n4-n3);
                                                        sdc.timing("Post FILE DB Duration",duration1);
                                                        logger.info("Post FILE DB duration "+duration1);
                                                        res.status(200).json({message :"File attached successfully",
                                                        file_name: req.file.originalname,
                                                        id: fileId,
                                                        url: req.file.path,
                                                        upload_date: uploadDate
                                            });
                                        });
                                
                                                    }
                                                });
                                            }
                                        })
                                   
                                
                                    });
                          
                            }
                            else{
                                res.status(401).json({error: "UNAUTHORIZED, Cannot attach file to other users bill"});
                            }
                          
  
                        });
                    }
                    else{
                        res.send(404).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Post File to S3",duration);
    logger.info("POST FILE to S3 duration"+duration);
});
//GET FILE

router.get("/:billId/file/:fileId",function(req, res){


    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("FILE_GET LOG");
    sdc.increment('FILE_GET counter');

    console.log(req.file);
    const Billid = req.params.billId;
    const FileId = req.params.fileId;
    

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0){
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var username1 = header[0];
        var password1 = header[1];
        
        console.log(username1);
        console.log(password1);

        db.query( `select id, first_name, last_name, password, email_address, account_created, account_updated from user_details where email_address = "${username1}"`,function(error, results,row){
            if(error){
                throw error;
            }
            else if(results.length >0){
                console.log("USername matched");
                var pa = results[0].password;
                var uuid = results[0].id;

                bcrypt.compare(password1, pa, (error, result) => {
                    if(result==true){
                        var n3 = d.getMilliseconds();
                        console.log("password matched");
                        db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus from Bill where id = "${Billid}"`,function (error,resulte){
                          
                            if(error){
                                throw error;
                            }
                            if(resulte == false){
                                res.status(404).json({error: "Bill id does not exist"});
                                console.log("Wrong id");
                            }
                            else if(resulte[0].owner_id == results[0].id){  
                            console.log("bill belongs to the user");
                                db.query(`Select file_name, id, url, upload_date, billid FROM File WHERE id = "${FileId}"`, function(error, fileresults){

                                    if(error){
                                        throw error;
                                       }
                                       else if(fileresults == false){
                                        res.status(404).json({error: "File does not exist"});
                                        console.log("Wrong file id");
                                       }
                                    else if(fileresults[0].billid == resulte[0].id){
                                        console.log("file belongs to the bill");
                                        logger.info('FILE receive successfully');
                                        var n4 = d.getMilliseconds();
                                        var duration1 = (n4-n3);
                                        sdc.timing("GET FILE DB Duration",duration1);
                                        logger.info("GET FILE DB duration "+duration1);
                                        res.status(200).json({
                                        file_name: fileresults[0].file_name,
                                        id: FileId,
                                        url: fileresults[0].url,
                                        upload_date: fileresults[0].upload_date
                                      });
                    
                                        }
                                        else{
                                            logger.error("Cannot fetch other users file");
                                            res.status(401).json({error: "You cannot fetch file from other bill"});
                                        }
                                    });
                          
                            }
                           
                            else{
                                console.log("invalid user");
                                res.status(401).json({error: "UNAUTHORIZED, Cannot fetch other users file"});
                            }
                          
  
                        });
                    }
                    else if(result == false){
                        console.log("wrong password");
                        res.status(404).json({error: "Password does not match"});
                    }
                });
            }
            else{
                console.log("username did not match. user does not exist");
                res.status(404).json({error: "User does not exist"});
            }
        });
    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Get File from S3 Time",duration);
    logger.info("Get FILE from S2 time"+duration);
})


router.delete("/:billId/file/:fileId",(req,res)=>{


    var d = new Date();
    var n = d.getMilliseconds();
    logger.info("BILL_FILE_DEL LOG");
    sdc.increment('BILL_FILE_DEL counter');

    var fs = require('fs');
    
    const Billid=req.params.billId;
    const Fileid= req.params.fileId;

    console.log("Bill-ID:"+Billid);
    console.log("File-ID:"+Fileid);

    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
     
        var header = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString();
        header = header.split(":");
    
        var usernameREQ = header[0];
        var passwordREQ = header[1];

        console.log(usernameREQ);
        console.log(passwordREQ);

        db.query(`Select * from File where id = "${Fileid}"`, function(error, fileresult){
            console.log("entered file");
            if(error){
                console.log("some error");
                throw error;
            }
            else if(fileresult.length > 0){
                console.log("File id exist");
         db.query(`SELECT  * from Bill where id = "${Billid}"`, (error, results) => {
            if(error){
                throw error;
            }
            else if(results.length>0){
                console.log("Bill id exist");
                ownerID=results[0].owner_id;
                console.log("OWNER ID :"+ownerID);
                db.query("SELECT  * FROM user_details where email_address = '"+usernameREQ+"'", (error, results2) => {
                    if(error){
                        throw error;
                    }
                    else if(results2.length >0) {
                      
                        var pa = results2[0].password;
                      
                        bcrypt.compare(passwordREQ, pa, (error, result) => {
                            if(error){
                                throw error;
                            }
                            if(result == true){
                                var n3 = d.getMilliseconds();
                                console.log("password matched");
                                if( results2[0].id==ownerID){
                                  if(fileresult[0].billid == results[0].id){

                                    const s3 = new aws.S3();
                                    var params = { Bucket: ImageS3Bucket, Key: Billid }
                                    s3.deleteObject(params, function (err, data) {
                                        if (err) {
                                            return res.send({ "error": err });
                                        }
                                      //  res.send({ data });
                                    });
                                
                                    db.query(`DELETE FROM File where id = "${Fileid}"`, (error, results2) => {
                                        if(error){
                                            throw error;
                                        }
                                        else{
                                            
                                         //   var filePath = fileresult[0].url;
                                            //if(filePath.length>0){fs.unlinkSync(filePath);} 
                                           // console.log(filePath);
                                         
                                                // fs.unlink(filePath, function(err,result4){
                                                //     if(err){
                                                //         throw err;
                                                //     }
                                                   
                                                    
                                                // });

                                                // if (fs.existsSync(filePath)) {
                                                //     fs.unlinkSync(filePath);
                                                // }
                                                // else{
                                                //     console.log("file already deleted from folder");
                                                    
                                                // }
                                                var mes = "NULL";
                                                db.query("UPDATE Bill SET  attachment= '"+mes+"' where id = '"+Billid+"'",function (error,resulte){
                                                    if(error){
                                                        throw error;
                                                    }
                                                    else{
                                                        logger.info("File with id '"+Fileid+"' deleted successfully");
                                                        var n4 = d.getMilliseconds();
                                                        var duration1 = (n4-n3);
                                                        sdc.timing("DELETE FILE DB Duration",duration1);
                                                        logger.info("DELETE FILE DB duration "+duration1);
                                                        console.log("file matched with bill id");
                                                        res.status(200).json({ messege:"File DELETED SUCCESSFULLY"})
                                                    }
                                                })
                                               
                                        }

                                    });
                                    
                                   
                                  }
                                  else{
                                      res.status(404).json({error: "cannot delete this file"});
                                  }
                                    
                                   
                                }
                                else{
                                 console.log("You Cannot delete this file");
                                    res.status(401).
                                            json({ messege:"You Cannot delete this file"});
                                             
                                }
                            }
                            if(result == false){
                                console.log("Password does not match");
                                res.status(401).
                                json({ message:"Password does not match"});
                            }
                        })
                        
                        }
                        else if(results2.length <1) {
                          
                            res.status(401).
                            json({ messege:"Email id does not match"});
                        }
        });
        }
        else if(results.length==0){
            console.log("invalid bill id");
            res.status(404).
             json({ messege:"Bill Not Found"});
        }
    });
            }
            else{
                res.status(400).json({error: "file does not exist"})
            }
        })

    }
    var n1 = d.getMilliseconds();
    var duration = (n1-n);
    sdc.timing("Delete File from S3 Time",duration);
    logger.info("Delete File from S3 timer"+duration);
});


module.exports = router;