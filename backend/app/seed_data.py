import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.models.product import Product, Retailer, ProductListing
from backend.app.models.price import PriceObservation
from backend.app.models.alert import Watchlist, WatchlistItem, PriceAlertRule, Notification, NotificationDelivery
from backend.app.models.planner import ShoppingList, ShoppingListItem, Budget, RecurringPurchase, PurchaseRecord
from backend.app.models.system import RefreshJob
from backend.app.services.auth_service import get_password_hash
from backend.app.services.email_adapter import render_price_alert_email_html

def seed_database(db: Session):
    """Seed comprehensive demo catalog, retailers, price histories, and initial user data."""
    # Check if already seeded
    if db.query(Retailer).count() > 0:
        return

    print("Seeding SmartCart Intelligence database...")

    # 1. Retailers
    retailers_data = [
        {
            "code": "amazon_in",
            "name": "Amazon India",
            "website_url": "https://www.amazon.in",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
            "freshness_ttl_minutes": 60,
            "notes": "Integrated via PA-API v5 adapter interface. Standard shipping threshold ₹499."
        },
        {
            "code": "flipkart",
            "name": "Flipkart",
            "website_url": "https://www.flipkart.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/2/29/Flipkart_logo.svg/330px-Flipkart_logo.svg.png",
            "freshness_ttl_minutes": 60,
            "notes": "Integrated via Flipkart Affiliate API adapter. Standard delivery fee ₹49 under ₹500."
        },
        {
            "code": "croma",
            "name": "Croma (Tata)",
            "website_url": "https://www.croma.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Croma_Logo.png",
            "freshness_ttl_minutes": 120,
            "notes": "Enterprise electronics retailer. Free store pickup and doorstep express delivery."
        },
        {
            "code": "reliance_digital",
            "name": "Reliance Digital",
            "website_url": "https://www.reliancedigital.in",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Reliance_Digital_logo.svg/330px-Reliance_Digital_logo.svg.png",
            "freshness_ttl_minutes": 120,
            "notes": "Consumer electronics store with MyJio points rewards and free shipping."
        },
        {
            "code": "tatacliq",
            "name": "Tata CLiQ",
            "website_url": "https://www.tatacliq.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tata_CLiQ_logo.svg/330px-Tata_CLiQ_logo.svg.png",
            "freshness_ttl_minutes": 180,
            "notes": "Lifestyle and electronics multi-vendor portal with authentic brand warranty."
        }
    ]

    retailer_objs = {}
    for r_data in retailers_data:
        r = Retailer(**r_data)
        db.add(r)
        db.flush()
        retailer_objs[r.code] = r

    # 2. Products Catalog
    products_data = [
        {
            "title": "Apple iPhone 16 Pro (128 GB, Natural Titanium)",
            "brand": "Apple",
            "model_number": "MYNQ3HN/A",
            "gtin_upc": "195949733491",
            "category": "Electronics",
            "subcategory": "Smartphones",
            "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
            "description": "A18 Pro chip, 48MP Fusion camera with 5x Telephoto, 6.3-inch Super Retina XDR display, Grade 5 Titanium design.",
            "tags": "iphone,apple,smartphone,flagship,5g",
            "base_mrp": 119900.0,
            "current_base": 114900.0,
            "retailers": ["amazon_in", "flipkart", "croma", "reliance_digital"]
        },
        {
            "title": "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB RAM, 256GB Storage)",
            "brand": "Samsung",
            "model_number": "SM-S928BZTCINS",
            "gtin_upc": "8806095304381",
            "category": "Electronics",
            "subcategory": "Smartphones",
            "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
            "description": "Galaxy AI features, 200MP camera with Quad Telephoto, Snapdragon 8 Gen 3 for Galaxy, Built-in S Pen.",
            "tags": "samsung,galaxy,android,s24,ai,flagship",
            "base_mrp": 129999.0,
            "current_base": 119999.0,
            "retailers": ["amazon_in", "flipkart", "croma", "reliance_digital"]
        },
        {
            "title": "Apple MacBook Air 13.6-inch M3 Chip (16GB Unified Memory, 512GB SSD)",
            "brand": "Apple",
            "model_number": "MXCV3HN/A",
            "gtin_upc": "195949321483",
            "category": "Computers",
            "subcategory": "Laptops",
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
            "description": "Strikingly thin design, 8-core CPU, 10-core GPU, Liquid Retina display, up to 18 hours battery life.",
            "tags": "macbook,apple,laptop,m3,ultrabook",
            "base_mrp": 134900.0,
            "current_base": 124900.0,
            "retailers": ["amazon_in", "flipkart", "croma", "reliance_digital"]
        },
        {
            "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Silver)",
            "brand": "Sony",
            "model_number": "WH1000XM5/S",
            "gtin_upc": "027242923508",
            "category": "Electronics",
            "subcategory": "Audio",
            "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
            "description": "Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, 30-hour battery life, Crystal clear calls.",
            "tags": "sony,headphones,anc,bluetooth,audio",
            "base_mrp": 34990.0,
            "current_base": 26990.0,
            "retailers": ["amazon_in", "flipkart", "croma", "tatacliq"]
        },
        {
            "title": "Philips Digital Air Fryer HD9252/90 (4.1L, Rapid Air Technology)",
            "brand": "Philips",
            "model_number": "HD9252/90",
            "gtin_upc": "8710103975762",
            "category": "Home & Kitchen",
            "subcategory": "Kitchen Appliances",
            "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
            "description": "Fry with up to 90% less fat, Touch screen with 7 presets, Keep warm function, Dishwasher safe parts.",
            "tags": "kitchen,airfryer,philips,healthy,cooking",
            "base_mrp": 11995.0,
            "current_base": 7499.0,
            "retailers": ["amazon_in", "flipkart", "croma", "tatacliq"]
        },
        {
            "title": "Dyson V12 Detect Slim Total Clean Cordless Vacuum Cleaner",
            "brand": "Dyson",
            "model_number": "368340-01",
            "gtin_upc": "5025155057391",
            "category": "Home & Kitchen",
            "subcategory": "Home Appliances",
            "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
            "description": "Illuminates invisible microscopic dust, Piezo sensor counts dust particles, up to 60 minutes run time.",
            "tags": "dyson,vacuum,cleaner,home,cordless",
            "base_mrp": 55900.0,
            "current_base": 44900.0,
            "retailers": ["amazon_in", "croma", "reliance_digital"]
        },
        {
            "title": "Tata Tea Gold (1 kg Pouch)",
            "brand": "Tata Tea",
            "model_number": "TTG-1000G",
            "gtin_upc": "8901052003852",
            "category": "Groceries",
            "subcategory": "Beverages",
            "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
            "description": "Rich taste and irresistible aroma of gently rolled long tea leaves blended with Assam CTC tea.",
            "tags": "tea,groceries,tata,beverage,daily",
            "base_mrp": 620.0,
            "current_base": 465.0,
            "retailers": ["amazon_in", "flipkart"]
        },
        {
            "title": "Daawat Rozana Super Basmati Rice (5 kg)",
            "brand": "Daawat",
            "model_number": "DWT-RS-5KG",
            "gtin_upc": "8901537000118",
            "category": "Groceries",
            "subcategory": "Staples",
            "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
            "description": "Finest long grain basmati rice aged to perfection, non-sticky texture, rich authentic aroma.",
            "tags": "rice,basmati,groceries,staples",
            "base_mrp": 599.0,
            "current_base": 420.0,
            "retailers": ["amazon_in", "flipkart"]
        },
        {
            "title": "Atomic Habits by James Clear (Hardcover Edition)",
            "brand": "Penguin Random House",
            "model_number": "9781847941831",
            "gtin_upc": "9781847941831",
            "category": "Books",
            "subcategory": "Self-Help",
            "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
            "description": "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 15 million copies sold worldwide.",
            "tags": "book,habits,bestseller,psychology",
            "base_mrp": 799.0,
            "current_base": 485.0,
            "retailers": ["amazon_in", "flipkart"]
        }
    ]

    now = datetime.now(timezone.utc)
    product_objs = []

    for p_info in products_data:
        p = Product(
            title=p_info["title"],
            brand=p_info["brand"],
            model_number=p_info["model_number"],
            gtin_upc=p_info["gtin_upc"],
            category=p_info["category"],
            subcategory=p_info["subcategory"],
            image_url=p_info["image_url"],
            description=p_info["description"],
            tags=p_info["tags"],
            is_active=True
        )
        db.add(p)
        db.flush()
        product_objs.append(p)

        # Create listings and historical observations
        for ret_code in p_info["retailers"]:
            retailer = retailer_objs.get(ret_code)
            if not retailer:
                continue

            # Variant price per retailer
            variance_factor = {
                "amazon_in": 1.0,
                "flipkart": 0.995,
                "croma": 1.015,
                "reliance_digital": 1.01,
                "tatacliq": 0.998
            }.get(ret_code, 1.0)

            store_base = round(p_info["current_base"] * variance_factor, 2)
            store_mrp = p_info["base_mrp"]

            listing = ProductListing(
                product_id=p.id,
                retailer_id=retailer.id,
                external_sku=f"SKU-{ret_code.upper()}-{p.id}",
                listing_url=f"{retailer.website_url}/dp/{p.model_number}",
                is_verified=True
            )
            db.add(listing)
            db.flush()

            # Create 14 historical observations over last 90 days
            # With authentic price movements (promotions, drops, stable points)
            for days_ago in [90, 75, 60, 45, 30, 21, 14, 10, 7, 5, 3, 2, 1, 0]:
                obs_date = now - timedelta(days=days_ago, hours=random.randint(1, 12))
                
                # Fluctuation pattern
                if days_ago == 0:
                    obs_price = store_base
                    provenance = "LIVE"
                elif days_ago in [14, 30]: # Promotional discount events
                    obs_price = round(store_base * 0.94, 2)
                    provenance = "HISTORICAL"
                elif days_ago >= 60: # Earlier price higher
                    obs_price = round(store_base * 1.05, 2)
                    provenance = "HISTORICAL"
                else:
                    jitter = random.choice([-0.01, 0.0, 0.015, -0.02])
                    obs_price = round(store_base * (1 + jitter), 2)
                    provenance = "HISTORICAL"

                shipping = 0.0 if obs_price > 500 else 40.0
                obs = PriceObservation(
                    product_listing_id=listing.id,
                    price=obs_price,
                    original_price=store_mrp,
                    currency="INR",
                    in_stock=True,
                    shipping_cost=shipping,
                    taxes_and_fees=0.0,
                    estimated_total=round(obs_price + shipping, 2),
                    provenance=provenance,
                    observed_at=obs_date,
                    retrieved_at=obs_date,
                    raw_metadata={"seeded": True, "retailer": ret_code}
                )
                db.add(obs)

    # 3. Create Demo User
    demo_user = User(
        email="demo@smartcart.ai",
        username="demo_user",
        hashed_password=get_password_hash("SmartCart123!"),
        full_name="Ragu Ram",
        preferred_currency="INR",
        email_notifications_enabled=True,
        in_app_notifications_enabled=True
    )
    db.add(demo_user)
    db.flush()

    # 4. User's Watchlist
    watchlist = Watchlist(user_id=demo_user.id, name="My Tracked Products")
    db.add(watchlist)
    db.flush()

    # Add iPhone 16 Pro, Sony XM5, and Tata Tea to Watchlist
    watchlist_items_seed = [
        (product_objs[0], 110000.0, "Waiting for Diwali festival price drop", "HIGH"),
        (product_objs[3], 25000.0, "Upgrade old headphones", "MEDIUM"),
        (product_objs[6], 450.0, "Monthly grocery replenishment", "LOW")
    ]
    for prod, target, note, priority in watchlist_items_seed:
        wi = WatchlistItem(
            watchlist_id=watchlist.id,
            product_id=prod.id,
            target_price=target,
            note=note,
            priority=priority,
            needed_by=now + timedelta(days=25)
        )
        db.add(wi)

        # Create alert rule
        rule = PriceAlertRule(
            user_id=demo_user.id,
            product_id=prod.id,
            rule_type="TARGET_PRICE",
            threshold_value=target,
            is_active=True
        )
        db.add(rule)

    # 5. Seed an Initial Price Drop Notification & Email Delivery Preview
    iphone_prod = product_objs[0]
    notif = Notification(
        user_id=demo_user.id,
        product_id=iphone_prod.id,
        title=f"Price Drop Detected for {iphone_prod.title}",
        message=f"The price dropped from ₹1,19,900.00 to ₹1,14,900.00 on Amazon India. You save ₹5,000.00!",
        previous_price=119900.0,
        new_price=114900.0,
        channel="BOTH",
        status="UNREAD"
    )
    db.add(notif)
    db.flush()

    email_preview = render_price_alert_email_html(
        product_title=iphone_prod.title,
        previous_price=119900.0,
        new_price=114900.0,
        currency="₹",
        target_price=110000.0,
        retailer_name="Amazon India",
        listing_url="https://www.amazon.in/dp/MYNQ3HN/A"
    )

    delivery = NotificationDelivery(
        notification_id=notif.id,
        channel="EMAIL",
        delivery_mode="MOCK_DEV",
        recipient=demo_user.email,
        status="PREVIEWED",
        preview_body=email_preview,
        error_message=None
    )
    db.add(delivery)

    # 6. Seed Shopping Lists
    list_tech = ShoppingList(
        user_id=demo_user.id,
        title="Electronics & Workstation Upgrades",
        description="Planned gear for final year B.Tech AI/DS projects",
        color="cyan"
    )
    db.add(list_tech)
    db.flush()

    item_1 = ShoppingListItem(
        shopping_list_id=list_tech.id,
        product_id=product_objs[2].id, # MacBook Air M3
        item_title="Apple MacBook Air 13.6-inch M3",
        desired_quantity=1,
        estimated_unit_price=124900.0,
        is_purchased=False,
        priority="HIGH",
        needed_by=now + timedelta(days=45)
    )
    item_2 = ShoppingListItem(
        shopping_list_id=list_tech.id,
        product_id=product_objs[3].id, # Sony XM5
        item_title="Sony WH-1000XM5 Wireless Headphones",
        desired_quantity=1,
        estimated_unit_price=26990.0,
        is_purchased=True,
        priority="MEDIUM",
        needed_by=now - timedelta(days=2)
    )
    db.add(item_1)
    db.add(item_2)

    list_grocery = ShoppingList(
        user_id=demo_user.id,
        title="Monthly Pantry Staples",
        description="Household essential supplies",
        color="emerald"
    )
    db.add(list_grocery)
    db.flush()

    item_3 = ShoppingListItem(
        shopping_list_id=list_grocery.id,
        product_id=product_objs[6].id, # Tata Tea
        item_title="Tata Tea Gold 1kg",
        desired_quantity=2,
        estimated_unit_price=465.0,
        is_purchased=False,
        priority="HIGH"
    )
    item_4 = ShoppingListItem(
        shopping_list_id=list_grocery.id,
        product_id=product_objs[7].id, # Daawat Rice
        item_title="Daawat Rozana Super Basmati Rice 5kg",
        desired_quantity=1,
        estimated_unit_price=420.0,
        is_purchased=True,
        priority="MEDIUM"
    )
    db.add(item_3)
    db.add(item_4)

    # 7. Seed Monthly Budget
    current_my = now.strftime("%Y-%m")
    budget_overall = Budget(
        user_id=demo_user.id,
        month_year=current_my,
        category="All Categories",
        budget_limit=40000.0
    )
    budget_electronics = Budget(
        user_id=demo_user.id,
        month_year=current_my,
        category="Electronics",
        budget_limit=30000.0
    )
    budget_groceries = Budget(
        user_id=demo_user.id,
        month_year=current_my,
        category="Groceries",
        budget_limit=5000.0
    )
    db.add(budget_overall)
    db.add(budget_electronics)
    db.add(budget_groceries)

    # 8. Seed Recurring Purchases
    recurring_tea = RecurringPurchase(
        user_id=demo_user.id,
        product_id=product_objs[6].id,
        custom_title="Tata Tea Gold 1kg",
        replenishment_interval_days=30,
        last_replenished_at=now - timedelta(days=28),
        next_review_at=now + timedelta(days=2),
        is_active=True
    )
    recurring_rice = RecurringPurchase(
        user_id=demo_user.id,
        product_id=product_objs[7].id,
        custom_title="Daawat Basmati Rice 5kg",
        replenishment_interval_days=45,
        last_replenished_at=now - timedelta(days=15),
        next_review_at=now + timedelta(days=30),
        is_active=True
    )
    db.add(recurring_tea)
    db.add(recurring_rice)

    # 9. Seed Confirmed Purchase Records (Proves Realized Savings!)
    purchase_1 = PurchaseRecord(
        user_id=demo_user.id,
        product_id=product_objs[3].id, # Sony XM5
        retailer_id=retailer_objs["flipkart"].id,
        purchase_price=26990.0,
        original_baseline_price=34990.0,
        purchase_date=now - timedelta(days=5),
        notes="Purchased during Super Value Days on Flipkart with HDFC card offer."
    )
    purchase_2 = PurchaseRecord(
        user_id=demo_user.id,
        product_id=product_objs[8].id, # Atomic Habits
        retailer_id=retailer_objs["amazon_in"].id,
        purchase_price=485.0,
        original_baseline_price=799.0,
        purchase_date=now - timedelta(days=12),
        notes="Lightning deal on Amazon India."
    )
    db.add(purchase_1)
    db.add(purchase_2)

    # 10. Initial Refresh Job Record
    job = RefreshJob(
        job_type="INITIAL_BOOTSTRAP_SYNC",
        triggered_by="SYSTEM",
        status="COMPLETED",
        items_processed=len(products_data),
        items_updated=len(products_data),
        started_at=now - timedelta(minutes=10),
        completed_at=now - timedelta(minutes=9)
    )
    db.add(job)

    db.commit()
    print("Database seeding completed successfully.")
