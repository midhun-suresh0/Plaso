const { MongoClient } = require('mongoose').mongo;

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/plaso';
const ATLAS_URI = process.env.ATLAS_MONGODB_URI || 'mongodb+srv://midhun487:midhun487@cluster0.ryltxbn.mongodb.net/plaso?retryWrites=true&w=majority';
const BATCH_SIZE = 500;

async function migrate() {
  console.log('==================================================');
  console.log('🚀 Starting Migration: Local MongoDB -> MongoDB Atlas');
  console.log('==================================================');
  console.log(`Source: ${LOCAL_URI}`);
  console.log(`Destination: ${ATLAS_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log('--------------------------------------------------');

  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    await Promise.all([localClient.connect(), atlasClient.connect()]);
    console.log('✅ Connected to both Local MongoDB and MongoDB Atlas.');

    const localDb = localClient.db('plaso');
    const atlasDb = atlasClient.db('plaso');

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in local database.\n`);

    const summary = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const localCount = await localCol.countDocuments();
      console.log(`📦 Processing collection: "${colName}" (${localCount} documents)...`);

      if (localCount === 0) {
        // Even if 0 docs, create the collection on Atlas
        await atlasDb.createCollection(colName).catch(() => {});
        console.log(`   ℹ️ Empty collection created on Atlas.`);
        summary.push({ collection: colName, sourceCount: 0, targetCount: 0, status: 'MATCH' });
        continue;
      }

      // Clear any existing docs in destination collection to avoid duplicates during clean migration
      await atlasCol.deleteMany({});

      // Migrate documents in batches
      const cursor = localCol.find({});
      let batch = [];
      let totalMigrated = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        batch.push(doc);

        if (batch.length >= BATCH_SIZE) {
          await atlasCol.insertMany(batch, { ordered: false });
          totalMigrated += batch.length;
          console.log(`   Migrated ${totalMigrated}/${localCount} docs...`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await atlasCol.insertMany(batch, { ordered: false });
        totalMigrated += batch.length;
      }

      // Copy indexes (except the default _id_ index)
      try {
        const indexes = await localCol.indexes();
        const customIndexes = indexes
          .filter(idx => idx.name !== '_id_')
          .map(idx => {
            const { key, name, unique, sparse, expireAfterSeconds, partialFilterExpression, background } = idx;
            const indexSpec = { key };
            const options = { name };
            if (unique !== undefined) options.unique = unique;
            if (sparse !== undefined) options.sparse = sparse;
            if (expireAfterSeconds !== undefined) options.expireAfterSeconds = expireAfterSeconds;
            if (partialFilterExpression !== undefined) options.partialFilterExpression = partialFilterExpression;
            if (background !== undefined) options.background = background;
            return { ...indexSpec, ...options };
          });

        if (customIndexes.length > 0) {
          for (const idx of customIndexes) {
            try {
              const { key, ...options } = idx;
              await atlasCol.createIndex(key, options);
            } catch (idxErr) {
              console.warn(`   ⚠️ Warning copying index ${idx.name} on ${colName}: ${idxErr.message}`);
            }
          }
          console.log(`   Copied ${customIndexes.length} index(es).`);
        }
      } catch (idxErr) {
        console.warn(`   ⚠️ Could not read/copy indexes for ${colName}:`, idxErr.message);
      }

      // Verify count
      const atlasCount = await atlasCol.countDocuments();
      const status = localCount === atlasCount ? 'MATCH' : 'MISMATCH';
      console.log(`   ✅ Completed: ${atlasCount}/${localCount} documents in Atlas [${status}].\n`);

      summary.push({
        collection: colName,
        sourceCount: localCount,
        targetCount: atlasCount,
        status,
      });
    }

    console.log('==================================================');
    console.log('📊 Migration Summary & Verification');
    console.log('==================================================');
    console.table(summary);

    const allMatched = summary.every(s => s.status === 'MATCH');
    if (allMatched) {
      console.log('\n🎉 ALL COLLECTIONS AND DOCUMENTS MIGRATED AND VERIFIED SUCCESSFULLY!');
    } else {
      console.warn('\n⚠️ Some collections have mismatched counts. Please check the summary above.');
    }

  } catch (err) {
    console.error('❌ Migration failed with error:', err);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
