require('dotenv').config();

const sql = require('mssql');
const config = require('../config.json');
const alert = require('../lib/netcool-alert');
let result = {
	error_count: 0
};

function get_result() {
	return result;
}

// Podemos testear estas por separado
async function get_repl_error(pool) {
	const repl_error = await pool.request().query("exec sp_replmonitorhelpsubscription @publisher = NULL, @publication_type = 0, @mode = 1");
	const rows_affected = repl_error.rowsAffected[0] || 0;

	await pool.close();
	await sql.close();

	return !rows_affected ? null : {
		rows_affected,
		error: repl_error
	}
}

async function get_repl_job_error(pool) {
	const repl_job_error = await pool.request().query("exec sp_replmonitorhelpsubscription @publisher = NULL, @publication_type = 0, @mode = 7");
	const rows_affected = repl_job_error.rowsAffected[0] || 0;

	await pool.close();
	await sql.close();

	return !repl_job_error.rowsAffected[0] ? null : {
		rows_affected,
		error: repl_job_error
	}
}

async function repl_error_monitoring(dbname) {	
	//PERFORM STRING OPERATIONS TO  INPUT CORRECT DB NAME
	const instance = config["config_" + dbname][0];	
	const DBNAME = dbname.toUpperCase().substring(dbname.indexOf("_") + 1);
	//ESTABLISH CONNECTION WITH DB AND PERFORM QUERIES
	const pool = await new sql.ConnectionPool(instance).connect();
	const repl_job_error = await get_repl_job_error(pool);
	const repl_error = await get_repl_error(pool);
	const db_4_has_errors = repl_job_error && DBNAME == "MXOCCSQLCMD4";
	const db_1_has_errors = repl_job_error && DBNAME == "MXOCCSQLCMD1";

	const report = {
		rows_rje: repl_job_error ? repl_job_error.rows_affected : 0,
		rows_re: repl_error ? repl_error.rows_affected : 0,
	}

	console.log("Checking Replication job from ---> " + DBNAME);
	console.log(instance);
	console.log("Errors:", repl_job_error, repl_error);

	console.log("Replication job error monitoring for DB " + DBNAME + " returned: \n" + report.rows_rje + " rows");
	console.log("Replication error  monitoring for DB " + DBNAME + " returned: \n" + report.rows_re + " rows");

	//EVAL ROWs RETURNED AND ALERT IF > 0
	if(repl_job_error) {
		await alert.postAlert("DB_jobrepl_error_" + DBNAME, `one or more *REPLICATION JOB(s)* from ${DBNAME}  is/are *FAILING*`, '3', '', 'OnPrem_Availability', DBNAME, 'SQL Database', 'DOC Monterrey', '', 'DOC');
		console.log("REPLICATION JOB IS FAILING FOR DB " + DBNAME + " --- RETURNED ROWS = " + report.rows_rje);
		result.error_count++;
	}
	if(repl_error) {
		await alert.postAlert("DB_replication_error_" + DBNAME, `*REPLICATION* from ${DBNAME} is *FAILING*`, '3', '', 'OnPrem_Availability', DBNAME, 'SQL Database', 'DOC Monterrey', '', 'DOC');
		console.log("REPLICATION IS FAILING " + DBNAME + " --- RETURNED ROWS = " + report.rows_re);
		result.error_count++;
	}
	result[DBNAME] = report;
}

async function start_monitor(DB_Names) {
	result = {
		error_count: 0
	}
	// Para poder probar si truena repl_error_monitoring
	return Promise
		.all(DB_Names.map(DB_Name => repl_error_monitoring(DB_Name)))
		.then(() => get_result())
		.catch(err => {
			process.exitCode = 1;
			console.log(err);
		})
}

module.exports = {
	get_result,
	get_repl_error,
	get_repl_job_error,
	repl_error_monitoring,
	start_monitor
};