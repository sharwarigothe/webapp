const express = require('express');
const router = express.Router();
var uuid = require('uuid');
const uuidv1 = require("uuid/v1");
const mysql = require('mysql');
const app = require("../../app");
const bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
// const saltRounds = 10;
var Enum = require('enum');
const multer = require('multer');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

const db = mysql.createConnection({
    host : 'localhost',
    user : 'sharwari',
    password : 'password',
    database: 'UserDetails'
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

router.post("/",(req,res,next)=>{

    var myEnum = new Enum(['paid', 'due', 'past_due', 'no_payment_required']);

    var d = new Date();
    var n = d.getMilliseconds();
  


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

                        if(Number(bill.amount_due< 0.01)|| (Number(bill.amount_due > 20000))){
                           res.status(400).json({error: "The amount due is either less than minimum amount or greater than the maximum amount"});
                       }
                       if(Number(bill.amount_due === undefined)){
                        res.status(400).json({error: "amount due empty"});
                       }
                       else if(bill.paymentStatus === undefined){
                        res.status(400).json({error: "paymentStatus empty"});
                       }
                    //    else if(bill.paymentStatus != myEnum){
                    //        res.status(400).json({error: "Invalid paymentstatus"});
                    //    }

                    //    else if(bill.paymentStatus != "paid" || bill.paymentStatus != "due"){
                    //     res.status(400).json({error: "payment status not paid or due"});
                    //    }

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

                        // else if(bill.paymentStatus != myEnum){
                        //     res.status(400).json({error: "Please Enter valid paymentStatus"});
                        // }
                        // else if(bill.paymentStatus != "paid" || bill.paymentStatus != "due" || bill.paymentStatus != "past_due" || bill.paymentStatus != "no_payment_required"){
                        //     res.status(400).json({message: "Please enter the correct value in paymentStatus"});
                        // }
                      

                        else{
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
                    res.status(400).json({error: "Enter valid payment status"});
                }
                    }
                    else{
                        res.status(400).json({error: "Password does not match"});
                    }
                })

            }
            else{
                res.status(400).json({error: "User Does not exist"});
            }
        });
    }
});

router.get("/:id",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();

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
                        db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus from Bill where id = "${id}"`,function (error,resulte){
                          
                            if(error){
                                throw error;
                            }
                            if(resulte == false){
                                res.status(404).json({error: "bill id does not exist"});
                                console.log("Wrong id");
                            }
                            else if(resulte[0].owner_id == results[0].id){  
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
});


//GET ALL BILLS

router.get("/",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();

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
                        //db.query(`Select id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories from Bill where id = "${id}"`,function (error,resulte,rows,fields){
                            db.query(`Select * from Bill where owner_id = "${uuid}"`,function (error,resulte,rows,fields){  
                            if(error){
                                throw error;
                            }
                            // if(resulte[0].owner_id == results[0].id){  
                            //     var cat = JSON.parse(resulte[0].categories);
                            //     res.status(200).json({
                            //         id: id,
                            //         created_ts: resulte.created_ts,
                            //         updated_ts: resulte.updated_ts,
                            //         owner_id: resulte.owner_id,
                            //         vendor: resulte.vendor,
                            //         bill_date: resulte.bill_date,
                            //         due_date: resulte.due_date,
                            //         amount_due_due: resulte.amount_due_due,
                            //         categories: cat
                            
                            //     })
                            // }
                            else{
                                //var resultJson = JSON.stringify(resulte);
                                //console.log(resulte);
                                // var jsonobj = resulte;
                                // console.log(jsonobj);
                            //    jsonobj2 = JSON.stringify(resulte);
                        
                               // console.log(resulte.rows);
                                //console.log(resultJson);
                                
                                console.log(resulte);
                                res.status(200).json({message:"all values",
                                

                                            data : resulte
                                            // created_ts: resulte.created_ts,
                                            // updated_ts: resulte.updated_ts,
                                            // owner_id: resulte.owner_id,
                                            // vendor: resulte.vendor,
                                            // bill_date: resulte.bill_date,
                                            // due_date: resulte.due_date,
                                            // amount_due_due: resulte.amount_due_due,
                                            // categories: resulte.categories
                                    
                                     
                            });

                          
                            }
                          
  
                        });
                    }
                    else{
                        res.status(400).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
});




router.delete("/:id",(req,res)=>{


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
                            if( results2[0].id==ownerID){
                              

                                db.query("DELETE FROM Bill where id = '"+id+"'", (error, results2) => {
                                    if(error){
                                        throw error;
                                    }

                                });

                                res.status(200).
                                        json({ messege:"Bill DELETED SUCCESSFULLY"})
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
   

})


//PUT

router.put("/:id",function(req,res){

    var d = new Date();
    var n = d.getMilliseconds();
  

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
                                res.status(400).json({error: "Enter valid payment status"});
                            }
                            }
                            else{
                                res.status(404).json({error: "Bill not found"});
                            
                            }
                        })
                    
                    }
                    else{
                        res.status(401).json({error: "User does not exist"});
                    }
                });
            }
        });
    }
});

//POST FILE TO BILL


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,'./uploads')
    },
    filename: function(req,file,cb){
        cb(null,new Date().toString()+ file.originalname);
    }
})
const fileFilter = (req,file,cb)=>{
    if(file.mimetype ==='image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf'){
        cb(null,true)
    }
    else{
        cb(new Error('invalid mime type, only jpeg and png are accepted'),false);
    }
}

var upload = multer({storage: storage, fileFilter : fileFilter});

router.post("/:id/file",upload.single('BillFile'),function(req, res){
    
  //console.log(req.file);
  var meta_data = JSON.stringify(req.file);

  console.log(meta_data);
    const Billid = req.params.id;

    const filename = req.file.originalname;
    const filepath = req.file.path;

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

                                    
                                        db.query("Select * from File where billid = '"+Billid+"'", function(error, billresult){
                                            if(error){
                                                throw error;
                                            }
                                            if(billresult.length > 0){
                                                res.status(400).json({error: "Attachment already exists. Cannot add multiple files"})
                                            }
                                            else{
                                                db.query("INSERT INTO File (file_name, id, url, upload_date, billid, metadata) values ('"+filename+"', '"+fileId+"', '"+filepath+"', '"+uploadDate+"', '"+Billid+"', '"+meta_data+"')", function(error, results){

                                                    if(error){
                                                        throw error;
                                                    }
                                                    else{
                
                                                        res.status(200).json({message :"File attached successfully",
                                                        file_name: req.file.originalname,
                                                        id: fileId,
                                                        url: req.file.path,
                                                        upload_date: uploadDate
                                            });
                                
                                                    }
                                                });
                                            }
                                        })
                                   
                                

                                

                                
                          
                          
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

})

//GET FILE

router.get("/:billId/file/:fileId",function(req, res){
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
                                        res.status(200).json({
                                        file_name: fileresults[0].file_name,
                                        id: FileId,
                                        url: fileresults[0].url,
                                        upload_date: fileresults[0].upload_date
                                      });
                    
                                        }
                                        else{
                                            console.log("trying if it broke here. the file is not attached to the bill");
                                            res.status(401).json({error: "You cannot fetch file from other bill"});
                                        }
                                    });
                          
                            }
                           
                            else{
                                console.log("invalud user");
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

})


router.delete("/:billId/file/:fileId",(req,res)=>{

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
                                console.log("password matched");
                                if( results2[0].id==ownerID){
                                  if(fileresult[0].billid == results[0].id){
                                    db.query(`DELETE FROM File where id = "${Fileid}"`, (error, results2) => {
                                        if(error){
                                            throw error;
                                        }
                                        else{
                                            var filePath = fileresult[0].url; 
                                            fs.unlinkSync(filePath);
                                        }
                                            
                                        
                                        
    
                                    });
                                    
                                    console.log("file matched with bill id");
                                            res.status(200).
                                            json({ messege:"File DELETED SUCCESSFULLY"})
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
   

})





module.exports = router;