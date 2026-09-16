import 'dotenv/config';
import pool from '../config/database.js';


const migrateShipments = async () => {
  const connection = await pool.getConnection();


  try {
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'shipments'
         AND COLUMN_NAME IN ('method', 'delivery_type')`
    );
    const existingColumns = new Set(columns.map(({ COLUMN_NAME }) => COLUMN_NAME));


    if (!existingColumns.has('method')) {
      await connection.query(`
        ALTER TABLE shipments
        ADD COLUMN method VARCHAR(20) GENERATED ALWAYS AS (
          CASE
            WHEN pickup_point LIKE '%Rank%' THEN 'RankDrop'
            ELSE 'Home Delivery'
          END
        ) STORED AFTER pickup_point
      `);
    }


    if (!existingColumns.has('delivery_type')) {
      await connection.query(`
        ALTER TABLE shipments
        ADD COLUMN delivery_type ENUM('normal', 'return') NOT NULL DEFAULT 'normal'
        AFTER method
      `);
    }


    console.log('Shipments migration complete');
  } finally {
    connection.release();
    await pool.end();
  }
};
migrateShipments().catch((error) => {
  console.error('Shipments migration failed:', error.message);
  process.exitCode = 1;
});
