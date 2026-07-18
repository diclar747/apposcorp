import { prisma } from '../server/src/utils/prisma.ts';
import fs from 'fs';
import path from 'path';

// Order of import to prevent foreign key errors
const importOrder = [
  { fileName: 'subscriptionPlan.json', modelName: 'subscriptionPlan' },
  { fileName: 'user.json', modelName: 'user' },
  { fileName: 'bankData.json', modelName: 'bankData' },
  { fileName: 'wallet.json', modelName: 'wallet' },
  { fileName: 'sellerProfile.json', modelName: 'sellerProfile' },
  { fileName: 'store.json', modelName: 'store' },
  { fileName: 'supplier.json', modelName: 'supplier' },
  { fileName: 'customer.json', modelName: 'customer' },
  { fileName: 'sellerCategory.json', modelName: 'sellerCategory' },
  { fileName: 'sellerMovement.json', modelName: 'sellerMovement' },
  { fileName: 'purchase.json', modelName: 'purchase' },
  { fileName: 'product.json', modelName: 'product' },
  { fileName: 'productVariant.json', modelName: 'productVariant' },
  { fileName: 'productAttribute.json', modelName: 'productAttribute' },
  { fileName: 'purchaseItem.json', modelName: 'purchaseItem' },
  { fileName: 'stockMovement.json', modelName: 'stockMovement' },
  { fileName: 'virtualCard.json', modelName: 'virtualCard' },
  { fileName: 'transaction.json', modelName: 'transaction' },
  { fileName: 'order.json', modelName: 'order' },
  { fileName: 'orderItem.json', modelName: 'orderItem' },
  { fileName: 'trackingEvent.json', modelName: 'trackingEvent' },
  { fileName: 'course.json', modelName: 'course' },
  { fileName: 'module.json', modelName: 'module' },
  { fileName: 'lesson.json', modelName: 'lesson' },
  { fileName: 'resource.json', modelName: 'resource' },
  { fileName: 'userCourse.json', modelName: 'userCourse' },
  { fileName: 'credit.json', modelName: 'credit' },
  { fileName: 'creditDocument.json', modelName: 'creditDocument' },
  { fileName: 'paymentScheduleItem.json', modelName: 'paymentScheduleItem' },
  { fileName: 'creditPayment.json', modelName: 'creditPayment' },
  { fileName: 'financialCategory.json', modelName: 'financialCategory' },
  { fileName: 'financialRecord.json', modelName: 'financialRecord' },
  { fileName: 'budgetItem.json', modelName: 'budgetItem' },
  { fileName: 'budget.json', modelName: 'budget' },
  { fileName: 'campaign.json', modelName: 'campaign' },
  { fileName: 'notification.json', modelName: 'notification' },
  { fileName: 'pushSubscription.json', modelName: 'pushSubscription' },
  { fileName: 'cartItem.json', modelName: 'cartItem' },
  { fileName: 'review.json', modelName: 'review' },
  { fileName: 'ingenioSubscription.json', modelName: 'ingenioSubscription' },
  { fileName: 'sellerSubscription.json', modelName: 'sellerSubscription' },
  { fileName: 'systemSetting.json', modelName: 'systemSetting' },
  { fileName: 'ingenioStage.json', modelName: 'ingenioStage' },
  { fileName: 'ingenioWheelSegment.json', modelName: 'ingenioWheelSegment' },
  { fileName: 'ingenioContent.json', modelName: 'ingenioContent' },
  { fileName: 'ingenioStudent.json', modelName: 'ingenioStudent' },
  { fileName: 'ingenioMaterial.json', modelName: 'ingenioMaterial' },
  { fileName: 'ingenioStudentAssignment.json', modelName: 'ingenioStudentAssignment' }
];

// Helper to convert top-level ISO date strings to Date objects
function parseTopLevelDates(item: any): any {
  const result = { ...item };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      result[key] = new Date(val);
    }
  }
  return result;
}

async function main() {
  console.log('Starting data import from db_backup...');
  
  const backupDir = path.join(process.cwd(), 'db_backup');
  
  for (const { fileName, modelName } of importOrder) {
    const filePath = path.join(backupDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Backup file not found: ${fileName}. Skipping.`);
      continue;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = JSON.parse(fileContent);
    
    if (!Array.isArray(records) || records.length === 0) {
      console.log(`ℹ️ Table ${modelName}: 0 records to import (empty or not an array).`);
      continue;
    }
    
    console.log(`⏳ Importing ${records.length} records into ${modelName}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        const parsedRecord = parseTopLevelDates(record);
        await (prisma as any)[modelName].create({
          data: parsedRecord
        });
        successCount++;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message.includes('Unique constraint failed') || err.message.includes('already exists') || err.message.includes('duplicate key')) {
          successCount++;
        } else {
          console.error(`❌ Error inserting into ${modelName} (ID: ${record.id}):`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log(`✅ Table ${modelName}: ${successCount} imported successfully, ${errorCount} failed.`);
  }
  
  console.log('Data import process completed!');
}

main()
  .catch(err => {
    console.error('Fatal error during import:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
