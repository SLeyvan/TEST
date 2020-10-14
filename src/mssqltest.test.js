const {
  get_result,
	get_repl_error,
	get_repl_job_error,
	repl_error_monitoring,
	start_monitor
} = require('dotenv').config();
const DB_Names = require('./DB_Names.json');

test('Test repl_error_monitoring', () => {
  // Test every function with different params, like:
  await start_monitor(DB_Names);

  const results = get_result();

  expect(results.count).tobe(0);
});

