/**
 * seed_products.js
 * Creates categories + fetches products from dummyjson.com and seeds them.
 * Run: node seed_products.js
 */

const http  = require('http');
const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function httpPost(path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 8081, path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpGetAuth(path, token) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost', port: 8081, path,
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

const CATEGORY_MAP = {
  'smartphones':          'Electronics',
  'laptops':              'Electronics',
  'tablets':              'Electronics',
  'mobile-accessories':   'Electronics',
  'computer-accessories': 'Electronics',
  'motorcycle':           'Electronics',
  'sports-accessories':   'Electronics',
  'skin-care':            'Electronics',
  'beauty':               'Electronics',
  'fragrances':           'Electronics',
  'mens-shirts':          'Clothing',
  'mens-shoes':           'Clothing',
  'mens-watches':         'Clothing',
  'womens-dresses':       'Clothing',
  'womens-shoes':         'Clothing',
  'womens-watches':       'Clothing',
  'womens-bags':          'Clothing',
  'womens-jewellery':     'Clothing',
  'sunglasses':           'Clothing',
  'tops':                 'Clothing',
  'furniture':            'Furniture',
  'home-decoration':      'Furniture',
  'kitchen-accessories':  'Furniture',
  'lighting':             'Furniture',
  'groceries':            'Books',
};

async function main() {
  console.log('🚀 Starting product seeder...\n');

  // Step 1: Login
  console.log('1️⃣  Logging in as admin...');
  try {
    await httpPost('/api/auth/register', {
      username: 'admin', email: 'admin@platform.com',
      password: 'Admin@123', role: 'ADMIN',
    });
  } catch { /* already exists */ }

  const loginRes = await httpPost('/api/auth/login', {
    username: 'admin', password: 'Admin@123',
  });

  if (!loginRes.body?.token) {
    console.error('❌ Login failed. Make sure backend is running on port 8081.');
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log('   ✅ Logged in.\n');

  // Step 2: Create categories if they don't exist
  console.log('2️⃣  Setting up categories...');
  const CATEGORIES = [
    { name: 'Electronics', description: 'Gadgets, phones, laptops and accessories' },
    { name: 'Books',       description: 'Academic and fiction books' },
    { name: 'Clothing',    description: 'Apparel, shoes, watches and accessories' },
    { name: 'Furniture',   description: 'Home, office furniture and decor' },
  ];

  const existingCats = await httpGetAuth('/api/categories', token);
  const categoryMap  = {};
  existingCats.forEach(c => { categoryMap[c.name] = c.id; });

  for (const cat of CATEGORIES) {
    if (!categoryMap[cat.name]) {
      const res = await httpPost('/api/categories', cat, token);
      if (res.body?.id) {
        categoryMap[cat.name] = res.body.id;
        console.log(`   ✅ Created category: ${cat.name} (id=${res.body.id})`);
      }
    } else {
      console.log(`   ✅ Category exists: ${cat.name} (id=${categoryMap[cat.name]})`);
    }
  }
  console.log();

  // Step 3: Fetch from dummyjson
  console.log('3️⃣  Fetching 150 products from dummyjson.com...');
  const dummyData = await httpGet('https://dummyjson.com/products?limit=150&skip=0&select=title,description,price,category');
  console.log(`   Fetched ${dummyData.products.length} products.\n`);

  // Step 4: Insert
  console.log('4️⃣  Inserting products...');
  let success = 0, skipped = 0;

  for (const product of dummyData.products) {
    const platformCat = CATEGORY_MAP[product.category] || 'Electronics';
    const catId       = categoryMap[platformCat];

    if (!catId) { skipped++; continue; }

    const priceINR = Math.round(product.price * 83);

    const res = await httpPost('/api/items', {
      title:       product.title,
      description: product.description,
      price:       priceINR,
      category:    { id: catId },
    }, token);

    if (res.status === 200 || res.status === 201) {
      success++;
      process.stdout.write(`\r   Inserted ${success} products...`);
    } else {
      skipped++;
    }
  }

  console.log(`\n\n🎉 Done! ${success} products inserted successfully.`);
  console.log(`   Skipped: ${skipped}`);
  console.log('\n📊 Open http://localhost:5173 to see your platform with real products!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('💡 Make sure the backend is running on http://localhost:8081');
  process.exit(1);
});
