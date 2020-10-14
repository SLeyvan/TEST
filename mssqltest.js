require('dotenv').config();
const sql = require('mssql');
const config = require('../config.json');
const alert = require('../lib/netcool-alert');
const DB_Names = ["db_mxoccsqlcmd1", "db_mxoccsqlcmd2", "db_mxoccsqlcmd3", "db_mxoccsqlcmd4", "db_mxoccsqlapex"];
var rows_rje;
var rows_re;
const results = [];
const DB_result  = [];

async function repl_error_monitoring(dbname, callback) {	
	let pool;
	try {
		//PERFORM STRING OPERATIONS TO  INPUT CORRECT DB NAME
		const instance = config["config_" + dbname][0];	
		const DBNAME = dbname.toUpperCase().substring(dbname.indexOf("_") + 1);
		console.log("Checking Replication job from ---> " + DBNAME);
		//ESTABLISH CONNECTION WITH DB AND PERFORM QUERIES
		console.log(instance);
		pool = await new sql.ConnectionPool(instance).connect();
		const repl_job_error = await pool.request().query("exec sp_replmonitorhelpsubscription @publisher = NULL, @publication_type = 0, @mode = 7");
		const repl_error = await pool.request().query("exec sp_replmonitorhelpsubscription @publisher = NULL, @publication_type = 0, @mode = 1");
		rows_rje = repl_job_error.rowsAffected[0];
		rows_re = repl_error.rowsAffected[0];
		//EVAL ROWs RETURNED AND ALERT IF > 0
		console.log(repl_job_error + "\n" + repl_error);
		if(rows_rje === undefined) {
			rows_rje = 0;
			//TEST A CASE 
			//if(DBNAME == "MXOCCSQLCMD4") {rows_rje = 1;}
		}
		if(rows_re === undefined) {
			rows_re = 0;
			// TEST A CASE 
			if(DBNAME == "MXOCCSQLCMD1") {rows_re = 1;}				
		}	
		console.log("Replication job error monitoring for DB " + DBNAME + " returned: \n" + rows_rje + " rows" + "\nReplication error  monitoring for DB " + DBNAME + " returned: \n" + rows_re + " rows");
		if(rows_rje > 0 || rows_re > 0) {
			const state = "error";
			if(state == "error" && rows_rje > 0) {
				await alert.postAlert("DB_jobrepl_error_" + DBNAME, `one or more *REPLICATION JOB(s)* from ${DBNAME}  is/are *FAILING*`, '3', '', 'OnPrem_Availability', DBNAME, 'SQL Database', 'DOC Monterrey', '', 'DOC');
				console.log("REPLICATION JOB IS FAILING FOR DB " + DBNAME + " --- RETURNED ROWS = " + rows_rje);
			}
			if(state == "error" && rows_re > 0) {
				await alert.postAlert("DB_replication_error_" + DBNAME, `*REPLICATION* from ${DBNAME} is *FAILING*`, '3', '', 'OnPrem_Availability', DBNAME, 'SQL Database', 'DOC Monterrey', '', 'DOC');
				console.log("REPLICATION IS FAILING " + DBNAME + " --- RETURNED ROWS = " + rows_re);
			}
		}
		results[DBNAME]={"rows_rje" : rows_rje, "rows_re": rows_re};
	}	
	catch(err) {
		process.exitCode = 1;
		console.log(err);
	}
	finally {
		await pool.close();
		await sql.close();
	}
	callback();
	return results[DBNAME]
}

for(let i = 0; i < DB_Names.length; i++) {
	repl_error_monitoring(DB_Names[i], function() {
		//console.log(rows_rje);
		//console.log(rows_re);
		if(i == DB_Names.length - 1) {
			console.log(results);
		}
	});
}

module.exports.result = results;
module.exports.funct = repl_error_monitoring;