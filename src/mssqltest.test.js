require('dotenv').config();

jest.mock('mssql');
const sql = require('mssql');
jest.mock('../lib/netcool-alert');

const {
  get_result,
	get_repl_error,
	get_repl_job_error,
	repl_error_monitoring,
	start_monitor
} = require('./mssqltest');
const DB_Names = require('./DB_Names.json');

describe('Testing mssqltest', () => {
  test('Test start_monitor success', async () => {
    sql.__setToSuccess();
    // Test every function with different params, like:
    const results = await start_monitor(DB_Names);
  
    expect(results.error_count).toBe(0);
  });
  test('Test monitor fail', async () => {
    sql.__setToFail();
    // Test every function with different params, like:
    const results = await start_monitor(DB_Names);
  
    expect(results.error_count).toBe(10);
  });
});