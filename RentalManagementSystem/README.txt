RENTAL MANAGEMENT SYSTEM
Try now (no server): open index.html (the GitHub Pages default page) or login.html. Landlord: admin@rms.ug / admin123. Tenants: use "Create account" on the login page.
Go live (PHP + MySQL): 1) import backend/schema.sql  2) edit backend/config.php credentials  3) open backend/setup.php once, then delete it
4) in js/app.js set DEMO=false  5) serve the folder with Apache/XAMPP (PHP 8+).
Existing databases: add the payment number field with `ALTER TABLE payments ADD payer_number VARCHAR(30) NULL;` and the property room identifier with `ALTER TABLE properties ADD room_number VARCHAR(40) NULL;`. Then assign a room number and location to each existing property in the Properties page before tenants can request it.
Security: tenant sign-up always creates role 'tenant'; no route can create an admin. Tenants can only add/read their own bookings, payments and complaints.
Tenant pages: tenant/index.html (houses, prices, room photos, booking) and tenant/portal.html (bookings, payments, complaints).
The tenant payment form records the amount, Mobile Money provider and payer number as pending. It does not initiate a charge; configure a supported payment gateway before accepting payments. Never collect or store a customer's Mobile Money PIN.
Each property listing represents one separately bookable room. Create a separate listing for every room, reusing its building location and assigning each room a distinct number. Tenants can request an available room with a preferred move-in date. Requests are saved as pending, shown on the admin dashboard and in Leases & bookings, and include the room number and location.
Room photos: paste image URLs (comma-separated) on a property. If none are set, illustrative interior photos from Unsplash are used; an internet connection is needed to load those fallback images.
