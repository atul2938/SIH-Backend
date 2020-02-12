const express = require('express');
const bodyParser = require('body-parser');
const app = express();

var myID='dashmesh15.2@gmail.com';
var myPass='hathway123';
var nodemailer = require('nodemailer'); 
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
	  user: myID,
	  pass: myPass
	}
  });

app.use(express.static(__dirname+"/"));

app.get("/report", function (req, res) {
	res.sendFile(__dirname+"/webpage.html");

});

app.get("/insertpage", function (req, res) {
	res.sendFile(__dirname+"/forms.html");

});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended:true
}));

app.listen(process.env.PORT || 8080, function () {
	console.log("server started listening at port: 8080");
});

app.get('/', function (req, res) {
	res.end();
});

app.post('/', function (req, res) {
	res.end();
});






app.post("/getallcurrentissues", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		GetAllCurrentIssues(client).then(function (response) {
			// successful
			// TURN ON
			createdresp=[]
			for(i=0;i<response.length;i++)
			{
				doc=response[i];
				currentissuesarr=doc["currentissues"];
				if(currentissuesarr.length>0)
				{
					createdresp.push(doc);
				}
				// for(j=0;j<currentissuesarr.length;j++)
				// {
				// 	createdresp.push(currentissuesarr[j]);
				// }
			}
			res.end(JSON.stringify({code:1, information:"GetAllCurrentIssues", data:{createdresp}}));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});


let GetAllCurrentIssues= function GetAllCurrentIssues(client){

	return new Promise(function (resolve, reject) {

		var allCurrent=[];
		var cursor=client.db('hackathon_db').collection('item').find();
		
		vararr= cursor.toArray();
		// console.log("ALL CURRENT : "+vararr);
		resolve(vararr);
	
	});
};











app.post("/reportdata", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	//post parameters
	const params= {};
	params['itemid']= req.body.itemid.trim();
	params["reporteddate"]= new Date();
	params["resolveddate"]= "";
	params["urgent"]= 1;
	params["engineer"]= "";
	params['problemfaced']= req.body.other.trim();


	connectDB(function (err, client) {
		if (err) {
			// console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		ReportData(params,client).then(function (response) {
			//successful
			// TURN ON
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});

});


let ReportData= function ReportData(params,client){

	return new Promise(function (resolve, reject) {

		var mongo = require('mongodb');
		var newlog= {_id: new mongo.ObjectID, reporteddate:params["reporteddate"]
		, resolveddate:params["resolveddate"], urgent:params["urgent"]
		, engineer:params["engineer"], problemfaced:params["problemfaced"]};
		var o_id = new mongo.ObjectID(params["itemid"]);

		var myquery= { _id: o_id};
		console.log("Inserted Log - "+newlog);
		var newvalues= { $push: { currentissues: newlog   } };
		client.db('hackathon_db').collection('item').updateOne(myquery, newvalues, function(err, res) {
			  if (err) throw err;
		});
		resolve({code:1,information:"Added Log"});
	});
};









app.post("/insertitem", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");



	//post parameters
	const params= {};
	useraccount=req.body.emailid.trim();
	params['sn']= req.body.sn.trim();
	params['doi']= new Date();
	params['lastrepaired']= "";
	params['nextperiodicrepair']= req.body.nextperiodicrepair.trim();
	params['logs']= [];
	params['currentissues']= [];
	params['name']= req.body.name.trim();

	// useraccount= req.query.emailid.trim();
	// params['sn']= req.query.sn.trim();
	// params['doi']= req.query.doi.trim();
	// params['lastrepaired']= req.query.lastrepaired.trim();
	// params['nextperiodicrepair']= req.query.nextperiodicrepair.trim();
	// params['logs']= []
	// params['currentissues']= []
	// params['name']= req.query.name.trim();

	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		InsertItem(params,client).then(function (response) {
			//successful
			// TURN ON
			SendMail(useraccount,response["_id"],response["name"])
			res.end(JSON.stringify({code:1,information:"Inserted an item",data:response}));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});


let SendMail= function SendMail(toemailid,itemid,itemname)
{
	var mylink="http://192.168.58.77:8080/report?id="+itemid+"&size=250x250"
	var mailOptions = {
		from: myID,
		to: toemailid,
		subject: 'QR code for '+itemname,
		html: ' <a href="api.qrserver.com/v1/create-qr-code/?data='+mylink+'&size=250x250"> <b> Click Here !!! </b> </a>'
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
		console.log(error);
		} else {
		console.log('Email sent: ' + info.response);
		}
	}); 
}


let InsertItem= function InsertItem(params,client){
	return new Promise(function (resolve, reject) {
		client.db('hackathon_db').collection('item').insertOne({sn:params["sn"],doi:params["doi"],lastrepaired:params["lastrepaired"],nextperiodicrepair:params["nextperiodicrepair"],logs:params["logs"],currentissues:params["currentissues"],name:params["name"]}, function (err, result) {
			if (err!==null) {
				ansjson={}
				ansjson["code"]=-1;
				reject(ansjson);
			}else{
				ansjson= JSON.parse(result);
				createdjson=ansjson["ops"][0];
				resolve(createdjson);
			}
		});
	});
};












app.get("/insertlog", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");



	//post parameters
	// useraccount=req.body.emailid.trim();
	// params['sn']= req.body.sn.trim();
	// loginfo= req.body.info.trim();

	// 5e35ce3627c91a2118b4933a
	// insertlog?emailid=atul17284@iiitd.ac.in&itemid=5e360b70be040b41cc2b10d5&reporteddate=22/1/20&reportedtime=22.10&resolveddate=23/1/20&resolvedtime=10.20&urgent=1&engineer=Amrendra&problemfaced=gas-leakage
	params={};
	params["useraccount"]= req.query.emailid.trim();
	params["itemid"]= req.query.itemid.trim();
	params["reporteddate"]= req.query.reporteddate.trim();
	params["resolveddate"]= req.query.resolveddate.trim();
	params["urgent"]= req.query.urgent.trim();
	params["engineer"]= req.query.engineer.trim();
	params["problemfaced"]= req.query.problemfaced.trim();

	
	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		InsertLog(params,client).then(function (response) {
			//successful
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});


let InsertLog= function InsertLog(params,client){

	return new Promise(function (resolve, reject) {


		// params["reporteddate"]= req.query.reporteddate.trim();
		// params["reportedtime"]= req.query.reportedtime.trim();
		// params["resolveddate"]= req.query.resolveddate.trim();
		// params["resolvedtime"]= req.query.resolvedtime.trim();
		// params["urgent"]= req.query.urgent.trim();
		// params["engineer"]= req.query.engineer.trim();
		// params["problemfaced"]= req.query.issueid.trim();


		var mongo = require('mongodb');
		var newlog= {_id: new mongo.ObjectID, reporteddate:params["reporteddate"]
		, resolveddate:params["resolveddate"], urgent:params["urgent"]
		, engineer:params["engineer"], problemfaced:params["problemfaced"]};
		var o_id = new mongo.ObjectID(params["itemid"]);

		var myquery= { _id: o_id};
		console.log("Inserted Log - "+newlog);
		var newvalues= { $push: { logs: newlog   } };
		client.db('hackathon_db').collection('item').updateOne(myquery, newvalues, function(err, res) {
			  if (err) throw err;
		});
		resolve({code:1,information:"Added Log"});
	});
};










app.post("/resolveissues", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


	params={};

	//post parameters
	params["emailid"]=req.body.emailid.trim();
	params["itemid"]= req.body.itemid.trim();
	params["report"]= req.body.report.trim();
	// params["emailid"]= req.query.emailid.trim();
	// params["itemid"]= req.query.itemid.trim();


	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		ResolveIssues(params,client).then(function (response) {
			//successful
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});



// here
let ResolveIssues= function ResolveIssues(params,client){

	return new Promise(function (resolve, reject) {

		var mongo = require('mongodb');
		var o_id = new mongo.ObjectID(params["itemid"]);

		client.db('hackathon_db').collection('item').findOne({_id:o_id}, function (err, result) {
			if (err!==null) {
				//error
				ansjson= {};
				ansjson["code"]=-1;
				reject(ansjson);
			}
			else{
				if(result==null){
					ansjson= {};
					ansjson["code"]=-2;
					reject(ansjson);
				}
				else{
					logsofitem=result["logs"];
					currentissuesofitem=result["currentissues"];

					console.log(logsofitem)
					console.log("ADADADA")

					
					
					//Updations
					for(var ii=0;ii<currentissuesofitem.length;ii++){
						updatedissue=currentissuesofitem[ii];
						console.log(currentissuesofitem[ii]);
						updatedissue["resolveddate"]= new Date();
						updatedissue["engineer"]= params["emailid"];
						logsofitem.push(updatedissue);
					}
					currentissuesofitem=[];
					
					// var extra={_id=new mongo.ObjectID,reporteddate: new Date(), resolveddate: new Date(), urgent:0,engineer:params['emailid'],problemfaced:params['report']};
					// logsofitem.push(extra);
					// console.log(logsofitem)
					// console.log(currentissuesofitem)
					var mongo = require('mongodb');

					var o_id = new mongo.ObjectID(params["itemid"]);

					var myquery= { _id: o_id};
					var newvalues= { $set: { logs: logsofitem, currentissues: currentissuesofitem  } };
					client.db('hackathon_db').collection('item').updateOne(myquery, newvalues, function(err, res) {
						if (err) throw err;
					});

					resolve({code:1,information:"resolved Issues"});
				}
			}
		});
	});
};












app.get("/getlogs", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");



	//post parameters
	// useraccount=req.body.emailid.trim();
	// params['sn']= req.body.sn.trim();

	params={};
	params["useraccount"]= req.query.emailid.trim();
	params["itemid"]= req.query.itemid.trim();


	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		GetLogs(params,client).then(function (response) {
			//successful
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});

let GetLogs= function GetLogs(params,client){

	return new Promise(function (resolve, reject) {

		var mongo = require('mongodb');
		var o_id = new mongo.ObjectID(params["itemid"]);

		client.db('hackathon_db').collection('item').findOne({_id:o_id}, function (err, result) {
			if (err!==null) {
				//error
				ansjson= {};
				ansjson["code"]=-1;
				reject(ansjson);
			}
			else{
				if(result==null){
					ansjson= {};
					ansjson["code"]=-2;
					reject(ansjson);
				}
				else{
					// console.log(result);
					logss=result["logs"];
					resolve({code:1,information:"Giving Logs of the given itemID",data:logss});
				}
			}
		});
	});
};










app.post("/getitem", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


	params={};
	//post parameters
	params["useraccount"]= req.body.emailid.trim();
	params["itemid"]= req.body.itemid.trim();



	// params["useraccount"]= req.query.emailid.trim();
	// params["itemid"]= req.query.itemid.trim();


	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		GetItem(params,client).then(function (response) {
			//successful
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});


let GetItem= function GetItem(params,client){

	return new Promise(function (resolve, reject) {

		var mongo = require('mongodb');
		var o_id = new mongo.ObjectID(params["itemid"]);

		client.db('hackathon_db').collection('item').findOne({_id:o_id}, function (err, result) {
			if (err!==null) {
				//error
				ansjson= {};
				ansjson["code"]=-1;
				reject(ansjson);
			}
			else{
				if(result==null)
				{
					ansjson= {};
					ansjson["code"]=-2;
					reject(ansjson);
				}
				else
				{
					// console.log(result);
					logss=result;
					resolve({code:1,information:"Giving Logs of the given itemID",data:logss});
				}
			}
		});
	});
};











app.get("/login", function (req, res) {

	res.header("Set-Cookie", "HttpOnly;SameSite=Strict");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	//post parameters
	const params= {};
	// params['emailid']= req.body.emailid.trim();
	// params['name']= req.body.name.trim();

	params['emailid']= req.query.emailid.trim();
	params['name']= req.query.name.trim();

	connectDB(function (err, client) {
		if (err) {
			console.error(err);
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.end("Could not connect to database!");
			return;
		}
		
		//call InsertItem function to insert a new item.
		Login(params,client).then(function (response) {
			//successful
			res.end(JSON.stringify(response));
		}).catch(function (response) {
			//failed
			res.end(JSON.stringify(response));
		});
	});
});


let Login= function Login(params,client){
	return new Promise(function (resolve, reject) {

		client.db('hackathon_db').collection('employee').findOne({emailid:params["emailid"]}, function (err, result) {
			if (err!==null) {
				//figure this out.
				ansjson= {}
				ansjson["code"]=-1;
				reject(ansjson);
			}
			else{
				if(result==null){
					userparams={};
					userparams["emailid"]=params["emailid"];
					userparams["name"]=params["name"];
					userparams["managerflag"]=0; //by default
					userparams["taskhistory"]=[];
					
					// call InsertItem function to insert a new item.
					InsertUser(userparams,client).then(function (response) {
						//successful
						createdjson=response["ops"][0];
						console.log("User Created : "+ createdjson["emailid"]);
						resolve({code:1,information:"Created a new used with given name and emailID",data:createdjson});
					}).catch(function (response) {
						//failed
						console.log("User Creation Failed");
						ansjson= {}
						ansjson["code"]=-1;
						reject(ansjson);
					});
				}
				else
				{
					// User Exists.
					resolve({code:1,information:"Returning user account info",data:result});
				}
			}
		});
	});
};

let InsertUser= function InsertUser(params,client){
	return new Promise(function (resolve, reject) {

		client.db('hackathon_db').collection('employee').insertOne({name:params["name"],managerflag:params["managerflag"],emailid:params["emailid"],taskhistory:params["taskhistory"]}, function (err, result) {
			if (err!==null) {
				//figure this out.
				console.log("user with this email not present");
				ansjson= {}
				ansjson["code"]=-1;
				reject(ansjson);
			}else{
				// console.log(JSON.parse(result));
				ansjson= JSON.parse(result);
				ansjson["code"]=1;
				resolve(ansjson);
			}
		});


	});
};


function connectDB(callback) {
	let mongo=require('mongodb').MongoClient;
	let uri="mongodb+srv://admin:admin@whyred-pwjmq.mongodb.net/test?retryWrites=true&w=majority";
	mongo.connect(uri, { useNewUrlParser: true }, function (mongoError, mongoClient) {
		return callback(mongoError, mongoClient);
	});
}