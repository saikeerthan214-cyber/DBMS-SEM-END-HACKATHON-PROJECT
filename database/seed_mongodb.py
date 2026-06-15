"""
seed_mongodb.py
Seeds MongoDB Atlas with reviews, saved items, and user activities.
Run: python seed_mongodb.py
Requires: pip install pymongo
"""

import sys

# Install pymongo if not available
try:
    from pymongo import MongoClient
    from pymongo.server_api import ServerApi
except ImportError:
    import subprocess
    print("Installing pymongo...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
    from pymongo import MongoClient
    from pymongo.server_api import ServerApi

from datetime import datetime

MONGO_URI = "mongodb+srv://admin:Search123@cluster0.rzlkzgm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

print("Connecting to MongoDB Atlas...")

try:
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'), tlsAllowInvalidCertificates=True)
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

db = client["searchai_mongo"]

# ── Clear existing data ───────────────────────────────────────────────────────
db.reviews.drop()
db.saveditems.drop()
db.useractivities.drop()
print("🗑️  Cleared old collections")

# ── Reviews ───────────────────────────────────────────────────────────────────
reviews = [
    {"itemId": 1, "itemTitle": "iPhone 15 Pro Max",       "username": "arjun",   "rating": 5, "comment": "Excellent camera and performance. Best phone I have ever used!", "createdAt": datetime.now()},
    {"itemId": 2, "itemTitle": "MacBook Air M2",           "username": "priya",   "rating": 5, "comment": "Super fast, great battery life. Perfect for design work.",        "createdAt": datetime.now()},
    {"itemId": 3, "itemTitle": "Sony WH-1000XM5",          "username": "rohan",   "rating": 4, "comment": "Best noise cancelling headphones. Sound quality is amazing.",      "createdAt": datetime.now()},
    {"itemId": 4, "itemTitle": "Ergonomic Office Chair",   "username": "sneha",   "rating": 5, "comment": "Very comfortable for long work hours. Back pain gone!",            "createdAt": datetime.now()},
    {"itemId": 5, "itemTitle": "Samsung Galaxy S24",       "username": "vikram",  "rating": 4, "comment": "Great display and camera. Android experience is smooth.",          "createdAt": datetime.now()},
    {"itemId": 6, "itemTitle": "Slim Fit Oxford Shirt",    "username": "arjun",   "rating": 4, "comment": "Good quality fabric. Fits perfectly as described.",               "createdAt": datetime.now()},
    {"itemId": 7, "itemTitle": "Gaming Laptop",            "username": "rohan",   "rating": 5, "comment": "Runs all games at ultra settings. Excellent cooling system.",      "createdAt": datetime.now()},
    {"itemId": 8, "itemTitle": "Data Structures Book",     "username": "priya",   "rating": 5, "comment": "Best book for competitive programming. Clear explanations.",       "createdAt": datetime.now()},
]

result = db.reviews.insert_many(reviews)
print(f"✅ Inserted {len(result.inserted_ids)} reviews")

# ── Saved Items ───────────────────────────────────────────────────────────────
saved_items = [
    {"username": "arjun",  "itemId": 1, "itemTitle": "iPhone 15 Pro Max",    "category": "Electronics", "price": 134900, "savedAt": datetime.now()},
    {"username": "arjun",  "itemId": 2, "itemTitle": "MacBook Air M2",        "category": "Electronics", "price": 114900, "savedAt": datetime.now()},
    {"username": "arjun",  "itemId": 4, "itemTitle": "Ergonomic Office Chair","category": "Furniture",   "price": 18999,  "savedAt": datetime.now()},
    {"username": "priya",  "itemId": 3, "itemTitle": "Sony WH-1000XM5",       "category": "Electronics", "price": 29990,  "savedAt": datetime.now()},
    {"username": "priya",  "itemId": 6, "itemTitle": "Slim Fit Oxford Shirt", "category": "Clothing",    "price": 1299,   "savedAt": datetime.now()},
    {"username": "rohan",  "itemId": 7, "itemTitle": "Gaming Laptop",         "category": "Electronics", "price": 85000,  "savedAt": datetime.now()},
    {"username": "rohan",  "itemId": 8, "itemTitle": "Data Structures Book",  "category": "Books",       "price": 399,    "savedAt": datetime.now()},
    {"username": "vikram", "itemId": 5, "itemTitle": "Samsung Galaxy S24",    "category": "Electronics", "price": 79999,  "savedAt": datetime.now()},
]

result = db.saveditems.insert_many(saved_items)
print(f"✅ Inserted {len(result.inserted_ids)} saved items")

# ── User Activities ───────────────────────────────────────────────────────────
activities = [
    {"username": "arjun",  "action": "search", "target": "Gaming Laptop",    "metadata": {"results": 12}, "performedAt": datetime.now()},
    {"username": "arjun",  "action": "view",   "target": "iPhone 15 Pro Max","metadata": {"price": 134900},"performedAt": datetime.now()},
    {"username": "arjun",  "action": "save",   "target": "MacBook Air M2",   "metadata": {"category": "Electronics"}, "performedAt": datetime.now()},
    {"username": "priya",  "action": "search", "target": "Office Chair",     "metadata": {"results": 8},  "performedAt": datetime.now()},
    {"username": "priya",  "action": "view",   "target": "Sony WH-1000XM5",  "metadata": {"price": 29990},"performedAt": datetime.now()},
    {"username": "rohan",  "action": "search", "target": "Data Structures",  "metadata": {"results": 5},  "performedAt": datetime.now()},
    {"username": "rohan",  "action": "save",   "target": "Gaming Laptop",    "metadata": {"category": "Electronics"}, "performedAt": datetime.now()},
    {"username": "vikram", "action": "search", "target": "Samsung S24",      "metadata": {"results": 6},  "performedAt": datetime.now()},
    {"username": "sneha",  "action": "view",   "target": "Ergonomic Chair",  "metadata": {"price": 18999},"performedAt": datetime.now()},
    {"username": "sneha",  "action": "search", "target": "Clothing",         "metadata": {"results": 50}, "performedAt": datetime.now()},
]

result = db.useractivities.insert_many(activities)
print(f"✅ Inserted {len(result.inserted_ids)} user activities")

print("\n🎉 MongoDB Atlas seeded successfully!")
print(f"   Database  : searchai_mongo")
print(f"   reviews   : {db.reviews.count_documents({})} documents")
print(f"   saveditems: {db.saveditems.count_documents({})} documents")
print(f"   useractivities: {db.useractivities.count_documents({})} documents")
print("\n📊 Open Atlas → Browse Collections to see the data!")

client.close()
