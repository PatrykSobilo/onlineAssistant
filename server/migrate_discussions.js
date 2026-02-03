const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Running migration...');

    // Check if columns already exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'discussions' 
      AND COLUMN_NAME IN ('note_category_id', 'note_sub_category_id', 'context_level')
    `, [process.env.DB_NAME]);

    const existingColumns = columns.map(c => c.COLUMN_NAME);

    if (!existingColumns.includes('note_category_id')) {
      await connection.query(`
        ALTER TABLE discussions 
        ADD COLUMN note_category_id INT NULL
      `);
      console.log('✅ Added note_category_id column');
    } else {
      console.log('ℹ️  note_category_id column already exists');
    }

    if (!existingColumns.includes('note_sub_category_id')) {
      await connection.query(`
        ALTER TABLE discussions 
        ADD COLUMN note_sub_category_id INT NULL
      `);
      console.log('✅ Added note_sub_category_id column');
    } else {
      console.log('ℹ️  note_sub_category_id column already exists');
    }

    if (!existingColumns.includes('context_level')) {
      await connection.query(`
        ALTER TABLE discussions 
        ADD COLUMN context_level INT DEFAULT 1
      `);
      console.log('✅ Added context_level column');
    } else {
      console.log('ℹ️  context_level column already exists');
    }

    // Add foreign keys if they don't exist
    const [foreignKeys] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'discussions' 
      AND CONSTRAINT_NAME IN ('fk_discussion_category', 'fk_discussion_subcategory')
    `, [process.env.DB_NAME]);

    const existingFKs = foreignKeys.map(fk => fk.CONSTRAINT_NAME);

    if (!existingFKs.includes('fk_discussion_category')) {
      try {
        await connection.query(`
          ALTER TABLE discussions 
          ADD CONSTRAINT fk_discussion_category 
          FOREIGN KEY (note_category_id) REFERENCES note_categories(id) ON DELETE SET NULL
        `);
        console.log('✅ Added fk_discussion_category foreign key');
      } catch (error) {
        console.log('⚠️  Could not add fk_discussion_category foreign key:', error.message);
        console.log('   This is OK - foreign keys are optional for functionality');
      }
    } else {
      console.log('ℹ️  fk_discussion_category foreign key already exists');
    }

    if (!existingFKs.includes('fk_discussion_subcategory')) {
      try {
        await connection.query(`
          ALTER TABLE discussions 
          ADD CONSTRAINT fk_discussion_subcategory 
          FOREIGN KEY (note_sub_category_id) REFERENCES note_sub_categories(id) ON DELETE SET NULL
        `);
        console.log('✅ Added fk_discussion_subcategory foreign key');
      } catch (error) {
        console.log('⚠️  Could not add fk_discussion_subcategory foreign key:', error.message);
        console.log('   This is OK - foreign keys are optional for functionality');
      }
    } else {
      console.log('ℹ️  fk_discussion_subcategory foreign key already exists');
    }

    // Add indexes
    const [indexes] = await connection.query(`
      SHOW INDEX FROM discussions WHERE Key_name IN ('idx_discussions_category', 'idx_discussions_subcategory')
    `);

    const existingIndexes = indexes.map(idx => idx.Key_name);

    if (!existingIndexes.includes('idx_discussions_category')) {
      await connection.query(`
        CREATE INDEX idx_discussions_category ON discussions(note_category_id)
      `);
      console.log('✅ Added idx_discussions_category index');
    } else {
      console.log('ℹ️  idx_discussions_category index already exists');
    }

    if (!existingIndexes.includes('idx_discussions_subcategory')) {
      await connection.query(`
        CREATE INDEX idx_discussions_subcategory ON discussions(note_sub_category_id)
      `);
      console.log('✅ Added idx_discussions_subcategory index');
    } else {
      console.log('ℹ️  idx_discussions_subcategory index already exists');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
