"""
AURA - Luxe Modern Atelier Web Application
Flask backend providing static page rendering and REST APIs for e-commerce catalog, search, and checkout.
"""

from flask import Flask, render_template, jsonify, request
import os

app = Flask(__name__)

# Sample Product Database for AURA Shopping Brand
PRODUCTS = [
    {
        "id": 1,
        "name": "AURA Chrono-Gold Watch",
        "category": "watches",
        "price": 1450.00,
        "originalPrice": 1680.00,
        "rating": 4.9,
        "reviews": 128,
        "badge": "Best Seller",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        "description": "Hand-assembled 18k gold electroplated automatic timepiece with sapphire crystal glass and midnight dial.",
        "inStock": True,
        "features": ["Water resistant to 100m", "42mm Dial Diameter", "Swiss Movement Mechanism", "2-Year Warranty"]
    },
    {
        "id": 2,
        "name": "Obsidian Velvet Blazer",
        "category": "couture",
        "price": 890.00,
        "originalPrice": 950.00,
        "rating": 4.8,
        "reviews": 84,
        "badge": "Exclusive",
        "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
        "description": "Tailored slim-fit tuxedo blazer crafted from premium Italian silk-velvet with satin peak lapels.",
        "inStock": True,
        "features": ["100% Italian Silk Velvet", "Satin Peak Lapels", "Interior Stash Pocket", "Dry Clean Only"]
    },
    {
        "id": 3,
        "name": "Titanium Stealth Headphones",
        "category": "tech",
        "price": 450.00,
        "originalPrice": 499.00,
        "rating": 4.95,
        "reviews": 210,
        "badge": "Trending",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "description": "Audiophile-grade wireless acoustic headphones featuring active noise cancellation and memory foam earcups.",
        "inStock": True,
        "features": ["45-Hour Battery Life", "Spatial Audio Tech", "Titanium Driver Unit", "Ultra-Fast Charging"]
    },
    {
        "id": 4,
        "name": "Monogram Leather Duffel",
        "category": "leatherware",
        "price": 980.00,
        "originalPrice": 1100.00,
        "rating": 4.87,
        "reviews": 65,
        "badge": "New Arrival",
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        "description": "Full-grain calfskin leather weekender bag featuring burnished brass hardware and removable shoulder strap.",
        "inStock": True,
        "features": ["Handcrafted Leather", "Solid Brass Hardware", "Dedicated Shoe Compartment", "TSA Approved Size"]
    },
    {
        "id": 5,
        "name": "Solstice Pearl Pendant",
        "category": "jewelry",
        "price": 650.00,
        "originalPrice": 720.00,
        "rating": 4.92,
        "reviews": 96,
        "badge": "Limited Edition",
        "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
        "description": "Luminous Tahitian black pearl suspended on an intricate 18k solid yellow gold snake chain.",
        "inStock": True,
        "features": ["Natural Tahitian Pearl", "18k Solid Gold", "18-inch Adjustable Chain", "Certificate of Authenticity"]
    },
    {
        "id": 6,
        "name": "Veridian Emerald Eyewear",
        "category": "accessories",
        "price": 320.00,
        "originalPrice": 360.00,
        "rating": 4.75,
        "reviews": 42,
        "badge": "Popular",
        "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        "description": "Sculpted acetate sunglasses with polarized emerald-tinted UV400 protective lenses.",
        "inStock": True,
        "features": ["Handmade Acetate Frame", "UV400 Protection", "Anti-reflective Coating", "Includes Leather Case"]
    },
    {
        "id": 7,
        "name": "Kinetic Apex Runners",
        "category": "footwear",
        "price": 420.00,
        "originalPrice": 480.00,
        "rating": 4.88,
        "reviews": 115,
        "badge": "Featured",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        "description": "Performance luxury sneakers with carbon-fiber plate responsiveness and breathable fly-knit upper.",
        "inStock": True,
        "features": ["Carbon Fiber Propulsion Plate", "Ultra-Light Foam", "Custom Knit Mesh", "High-Traction Rubber"]
    },
    {
        "id": 8,
        "name": "Elysium Silk Evening Dress",
        "category": "couture",
        "price": 1200.00,
        "originalPrice": 1350.00,
        "rating": 4.98,
        "reviews": 79,
        "badge": "Atelier Pick",
        "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
        "description": "Floor-length bias-cut mulberry silk gown with fluid drape detail and asymmetric open back.",
        "inStock": True,
        "features": ["100% Pure Mulberry Silk", "Bias Cut Silhouette", "Asymmetric Back Detail", "Handmade in Milan"]
    }
]

CATEGORIES = [
    {"id": "all", "name": "All Collections"},
    {"id": "couture", "name": "Couture"},
    {"id": "watches", "name": "Timepieces"},
    {"id": "tech", "name": "Luxury Tech"},
    {"id": "leatherware", "name": "Leatherware"},
    {"id": "jewelry", "name": "Jewelry"},
    {"id": "accessories", "name": "Accessories"},
    {"id": "footwear", "name": "Footwear"}
]

@app.route("/")
def index():
    return render_template("index.html", categories=CATEGORIES, products=PRODUCTS)

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category", "all")
    search_query = request.args.get("q", "").strip().lower()

    filtered = PRODUCTS

    if category != "all":
        filtered = [p for p in filtered if p["category"] == category]

    if search_query:
        filtered = [
            p for p in filtered 
            if search_query in p["name"].lower() or search_query in p["description"].lower()
        ]

    return jsonify({"status": "success", "count": len(filtered), "products": filtered})

@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return jsonify({"status": "error", "message": "Product not found"}), 404
    return jsonify({"status": "success", "product": product})

@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify({"status": "success", "categories": CATEGORIES})

@app.route("/api/checkout", methods=["POST"])
def process_checkout():
    data = request.get_json() or {}
    items = data.get("items", [])
    if not items:
        return jsonify({"status": "error", "message": "Cart is empty"}), 400

    total_amount = sum(item.get("price", 0) * item.get("quantity", 1) for item in items)
    
    return jsonify({
        "status": "success",
        "orderId": f"AURA-{os.urandom(4).hex().upper()}",
        "itemCount": len(items),
        "totalAmount": round(total_amount, 2),
        "message": "Thank you for your order with AURA Luxe Atelier!"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
