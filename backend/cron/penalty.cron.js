const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');

// Cron Job: Run daily at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  console.log('⏳ Running daily overdue & penalty cron job...');
  try {
    const now = new Date();
    
    // Find 'given' transactions that have a dueDate strictly in the past
    // We only process if 30 days have passed since the last penalty OR if no penalty has ever been applied and it is past dueDate
    const overdueTransactions = await Transaction.find({
      type: 'given',
      dueDate: { $lt: now }
    });

    let processedCount = 0;

    for (const tx of overdueTransactions) {
      // Logic for "Per Cycle"
      // If no lastPenaltyDate exists, it's the first time applying a penalty
      // If lastPenaltyDate exists, check if 30 days have passed since last penalty
      let shouldApplyPenalty = false;
      
      if (!tx.lastPenaltyDate) {
        shouldApplyPenalty = true;
      } else {
        const daysSinceLastPenalty = (now - tx.lastPenaltyDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPenalty >= 30) {
          shouldApplyPenalty = true;
        }
      }

      if (shouldApplyPenalty) {
        const penaltyAmount = tx.amount * 0.02;

        // ATOMIC LOCK: Only update if lastPenaltyDate matches what we originally read.
        // If 5 concurrent servers run this script, the first one changes lastPenaltyDate to `now`.
        // The remaining 4 servers will fail the `{ lastPenaltyDate: undefined|oldDate }` query filter!
        const lockedTx = await Transaction.findOneAndUpdate(
          { _id: tx._id, lastPenaltyDate: tx.lastPenaltyDate },
          {
            $set: { isOverdue: true, lastPenaltyDate: now },
            $inc: { penaltyApplied: penaltyAmount }
          },
          { new: true }
        );

        if (lockedTx) {
          const wasFirstPenalty = !tx.lastPenaltyDate;
          const contact = await Contact.findById(tx.contact);
          
          if (wasFirstPenalty && contact) {
            contact.latePayments += 1;
            contact.totalTransactions = contact.onTimePayments + contact.latePayments;
            contact.score = Math.round((contact.onTimePayments / contact.totalTransactions) * 100);
          }
          
          if (contact) {
            contact.balance += penaltyAmount;
            await contact.save();
          }
          
          processedCount++;
        }
      }
    }

    console.log(`✅ Cron completed: Applied penalties to ${processedCount} transactions.`);
  } catch (error) {
    console.error('❌ Error in penalty cron job:', error.message);
  }
});
