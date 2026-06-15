/**
 * SearchAI — MongoDB Atlas Schema
 * Database: searchai_mongo
 *
 * Collections:
 *   reviews        — item reviews with star ratings
 *   saveditems     — user bookmark/wishlist entries
 *   useractivities — event log (search, save, view, review)
 *
 * Run this file in MongoDB Shell or Compass "Run a File":
 *   mongosh "mongodb+srv://..." --file mongodb_schema.js
 *
 * Or paste each block into Compass > Database > mongosh tab.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Connect to database
// ─────────────────────────────────────────────────────────────────────────────
const db = db.getSiblingDB('searchai_mongo');

print('\n🚀 SearchAI — Applying MongoDB Schema to searchai_mongo\n');
print('='.repeat(60));


// ═════════════════════════════════════════════════════════════════════════════
// COLLECTION 1: reviews
// ═════════════════════════════════════════════════════════════════════════════
print('\n📋 Setting up collection: reviews');

db.createCollection('reviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'Review',
      description: 'User review for a catalogue item',
      required: ['itemId', 'itemTitle', 'username', 'rating', 'createdAt'],
      additionalProperties: true,
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        itemId: {
          bsonType: 'int',
          minimum: 1,
          description: 'PostgreSQL items.id — must be a positive integer'
        },
        itemTitle: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 255,
          description: 'Denormalised item title for display without a JOIN'
        },
        username: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Author username (matches users.username in PostgreSQL)'
        },
        rating: {
          bsonType: 'int',
          minimum: 1,
          maximum: 5,
          description: 'Star rating 1–5'
        },
        comment: {
          bsonType: 'string',
          maxLength: 2000,
          description: 'Review text (optional)'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Submission timestamp'
        }
      }
    }
  },
  validationLevel: 'moderate',   // existing docs not re-validated on update
  validationAction: 'error'      // reject invalid inserts
});

// Indexes
db.reviews.createIndex({ itemId: 1 },                    { name: 'idx_reviews_itemId' });
db.reviews.createIndex({ username: 1 },                  { name: 'idx_reviews_username' });
db.reviews.createIndex({ itemId: 1, username: 1 },       { name: 'idx_reviews_item_user' });
db.reviews.createIndex({ createdAt: -1 },                { name: 'idx_reviews_createdAt' });
db.reviews.createIndex({ rating: 1 },                    { name: 'idx_reviews_rating' });

print('   ✅ reviews — schema validator + 5 indexes applied');


// ═════════════════════════════════════════════════════════════════════════════
// COLLECTION 2: saveditems
// ═════════════════════════════════════════════════════════════════════════════
print('\n📋 Setting up collection: saveditems');

db.createCollection('saveditems', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'SavedItem',
      description: 'User wishlist / bookmark entry',
      required: ['username', 'itemId', 'savedAt'],
      additionalProperties: true,
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        username: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Owner username'
        },
        itemId: {
          bsonType: 'int',
          minimum: 1,
          description: 'PostgreSQL items.id'
        },
        itemTitle: {
          bsonType: 'string',
          maxLength: 255,
          description: 'Cached item title for display'
        },
        category: {
          bsonType: 'string',
          maxLength: 100,
          description: 'Cached category name'
        },
        price: {
          bsonType: ['double', 'int', 'decimal'],
          minimum: 0,
          description: 'Price at the time of saving'
        },
        savedAt: {
          bsonType: 'date',
          description: 'Timestamp when item was saved'
        }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'error'
});

// Unique compound index — one save per user per item
db.saveditems.createIndex(
  { username: 1, itemId: 1 },
  { unique: true, name: 'idx_saveditems_user_item_unique' }
);
db.saveditems.createIndex({ username: 1 },   { name: 'idx_saveditems_username' });
db.saveditems.createIndex({ itemId: 1 },     { name: 'idx_saveditems_itemId' });
db.saveditems.createIndex({ savedAt: -1 },   { name: 'idx_saveditems_savedAt' });

print('   ✅ saveditems — schema validator + 4 indexes (1 unique) applied');


// ═════════════════════════════════════════════════════════════════════════════
// COLLECTION 3: useractivities
// ═════════════════════════════════════════════════════════════════════════════
print('\n📋 Setting up collection: useractivities');

db.createCollection('useractivities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'UserActivity',
      description: 'Immutable event log entry for a user action',
      required: ['username', 'action', 'performedAt'],
      additionalProperties: true,
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        username: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'User who performed the action'
        },
        action: {
          bsonType: 'string',
          enum: ['search', 'view', 'save', 'unsave', 'review', 'login', 'register'],
          description: 'Type of action performed'
        },
        target: {
          bsonType: 'string',
          maxLength: 255,
          description: 'What was acted on (item title, keyword, etc.)'
        },
        metadata: {
          bsonType: 'object',
          description: 'Arbitrary extra data (results count, price, category, …)'
        },
        performedAt: {
          bsonType: 'date',
          description: 'When the action occurred'
        }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'error'
});

// Indexes
db.useractivities.createIndex({ username: 1 },                      { name: 'idx_activity_username' });
db.useractivities.createIndex({ performedAt: -1 },                  { name: 'idx_activity_performedAt' });
db.useractivities.createIndex({ action: 1 },                        { name: 'idx_activity_action' });
db.useractivities.createIndex({ username: 1, performedAt: -1 },     { name: 'idx_activity_user_time' });

// TTL index — auto-delete activity older than 90 days (optional, comment out to disable)
db.useractivities.createIndex(
  { performedAt: 1 },
  { expireAfterSeconds: 7776000, name: 'idx_activity_ttl_90d' }
);

print('   ✅ useractivities — schema validator + 5 indexes (incl. TTL) applied');


// ═════════════════════════════════════════════════════════════════════════════
// SEED DATA — sample documents in each collection
// ═════════════════════════════════════════════════════════════════════════════
print('\n🌱 Seeding sample documents...');

// reviews
db.reviews.deleteMany({});
db.reviews.insertMany([
  { itemId: 1, itemTitle: 'Laptop',         username: 'arjun',  rating: 5, comment: 'Blazing fast performance. Best laptop I have owned.', createdAt: new Date() },
  { itemId: 1, itemTitle: 'Laptop',         username: 'priya',  rating: 4, comment: 'Great value for the price. Battery could be better.', createdAt: new Date() },
  { itemId: 2, itemTitle: 'Smartphone',     username: 'rohan',  rating: 5, comment: 'Excellent camera and smooth Android experience.',      createdAt: new Date() },
  { itemId: 3, itemTitle: 'Headphones',     username: 'sneha',  rating: 4, comment: 'Very comfortable for long work hours.',               createdAt: new Date() },
  { itemId: 4, itemTitle: 'Mechanical Keyboard', username: 'vikram', rating: 5, comment: 'Satisfying click sound and great RGB.',          createdAt: new Date() },
  { itemId: 6, itemTitle: 'Java Programming', username: 'arjun', rating: 5, comment: 'Clear explanations with practical examples.',        createdAt: new Date() },
  { itemId: 7, itemTitle: 'Data Structures', username: 'priya', rating: 5, comment: 'Must-read for any CS student or developer.',         createdAt: new Date() },
  { itemId: 12, itemTitle: 'Office Chair',  username: 'sneha',  rating: 5, comment: 'Back pain gone after switching to this chair.',       createdAt: new Date() },
]);
print('   ✅ reviews — 8 sample documents inserted');

// saveditems
db.saveditems.deleteMany({});
db.saveditems.insertMany([
  { username: 'arjun',  itemId: 1,  itemTitle: 'Laptop',         category: 'Electronics', price: 55000, savedAt: new Date() },
  { username: 'arjun',  itemId: 3,  itemTitle: 'Headphones',     category: 'Electronics', price: 3500,  savedAt: new Date() },
  { username: 'priya',  itemId: 2,  itemTitle: 'Smartphone',     category: 'Electronics', price: 25000, savedAt: new Date() },
  { username: 'priya',  itemId: 9,  itemTitle: 'T-Shirt',        category: 'Clothing',    price: 599,   savedAt: new Date() },
  { username: 'rohan',  itemId: 6,  itemTitle: 'Java Programming',category: 'Books',       price: 499,   savedAt: new Date() },
  { username: 'rohan',  itemId: 12, itemTitle: 'Office Chair',   category: 'Furniture',   price: 8999,  savedAt: new Date() },
  { username: 'vikram', itemId: 5,  itemTitle: 'Monitor 27"',    category: 'Electronics', price: 18999, savedAt: new Date() },
  { username: 'sneha',  itemId: 15, itemTitle: 'Yoga Mat',       category: 'Sports',      price: 899,   savedAt: new Date() },
]);
print('   ✅ saveditems — 8 sample documents inserted');

// useractivities
db.useractivities.deleteMany({});
db.useractivities.insertMany([
  { username: 'arjun',  action: 'search',   target: 'gaming laptop',  metadata: { results: 12 },       performedAt: new Date() },
  { username: 'arjun',  action: 'view',     target: 'Laptop',         metadata: { price: 55000 },      performedAt: new Date() },
  { username: 'arjun',  action: 'save',     target: 'Laptop',         metadata: { category: 'Electronics' }, performedAt: new Date() },
  { username: 'priya',  action: 'search',   target: 'office chair',   metadata: { results: 8 },        performedAt: new Date() },
  { username: 'priya',  action: 'review',   target: 'Smartphone',     metadata: { rating: 5 },         performedAt: new Date() },
  { username: 'rohan',  action: 'search',   target: 'data structures', metadata: { results: 5 },       performedAt: new Date() },
  { username: 'rohan',  action: 'save',     target: 'Office Chair',   metadata: { category: 'Furniture' }, performedAt: new Date() },
  { username: 'vikram', action: 'search',   target: 'monitor 4k',     metadata: { results: 6 },        performedAt: new Date() },
  { username: 'sneha',  action: 'search',   target: 'yoga mat',       metadata: { results: 3 },        performedAt: new Date() },
  { username: 'sneha',  action: 'save',     target: 'Yoga Mat',       metadata: { category: 'Sports' }, performedAt: new Date() },
]);
print('   ✅ useractivities — 10 sample documents inserted');


// ═════════════════════════════════════════════════════════════════════════════
// VERIFY
// ═════════════════════════════════════════════════════════════════════════════
print('\n📊 Verification:');
print('   reviews        :', db.reviews.countDocuments(),      'documents');
print('   saveditems     :', db.saveditems.countDocuments(),    'documents');
print('   useractivities :', db.useractivities.countDocuments(),'documents');

print('\n📑 Indexes:');
print('   reviews        :', db.reviews.getIndexes().length,      'indexes');
print('   saveditems     :', db.saveditems.getIndexes().length,    'indexes');
print('   useractivities :', db.useractivities.getIndexes().length,'indexes');

print('\n✅ MongoDB schema setup complete!\n');
print('='.repeat(60));
print('\nSample queries to try in Compass / mongosh:');
print('  db.reviews.find({ itemId: 1 }).sort({ createdAt: -1 })');
print('  db.saveditems.find({ username: "arjun" })');
print('  db.useractivities.aggregate([{ $group: { _id: "$action", count: { $sum: 1 } } }])');
print('  db.reviews.aggregate([{ $group: { _id: "$itemId", avgRating: { $avg: "$rating" }, total: { $sum: 1 } } }, { $sort: { avgRating: -1 } }])');
print('');
