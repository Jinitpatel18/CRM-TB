import { emailQueue } from './src/services/queue.service.js';

console.log('📊 Email Queue State:\n');

const delayed = await emailQueue.getDelayed();
console.log(`⏰ Delayed jobs (${delayed.length}):`);
delayed.forEach((job) => {
    console.log(`   - Name: ${job.name}`);
    console.log(`   - Data:`, job.data);
    console.log(`   - Will run at: ${new Date(job.timestamp + (job.opts.delay || 0)).toLocaleString()}`);
    console.log('');
});

const repeatable = await emailQueue.getRepeatableJobs();
console.log(`🔄 Repeatable jobs (${repeatable.length}):`);
repeatable.forEach((j) => {
    console.log(`   - Name: ${j.name}`);
    console.log(`   - Every: ${j.every ? `${j.every} ms` : 'cron: ' + j.cron}`);
    console.log('');
});

process.exit(0);