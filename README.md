# MALVITHA Electronics Restoration

Repair-request website for the pamphlet QR code: **https://restore.malvitha.com**
(also https://malvitha-restore.web.app). Separate from the store at malvitha.com.

## What it does

- **Customers** (the page `/`): see the services, send a repair request with up to 5 photos,
  get an Enquiry ID (e.g. `RST-26-K7QX2M`) and can open WhatsApp with that ID pre-filled.
- **Admin** (`/admin`): sign in with Google as `malvithas@gmail.com`; see every request live,
  search, filter, view photos, set one of 9 statuses, keep internal notes, WhatsApp or call the
  customer, delete a request.

## Where things are

| Path | What |
|---|---|
| `public/index.html`, `public/css/style.css`, `public/js/app.js` | the customer page |
| `public/js/config.js` | settings: Firebase web config, WhatsApp number, admin email, categories, service cards |
| `public/admin/` | the admin page |
| `public/img/` | pictures cut from the pamphlet |
| `firestore.rules` | who may do what in the database (the real security) |
| `firebase.json` | hosting settings |

## Data (Firestore, project `malvitha-restore`, Mumbai)

- `enquiries/{id}`: one repair request. Fields: `name, phone, category, device, brand, problem,
  contact, src ("qr" from the pamphlet), photos (count), status, notes, day, created, updated`.
- `enquiries/{id}/photos/{0..4}`: one photo each, shrunk on the phone (`data` = JPEG as text).
  The free plan has no file storage, so photos live in the database.
- `limits/{phone_day}`: counts requests per phone per day.

## Security (firestore.rules)

- Customers can only **create** a request (every field checked) and its photos (within 10 minutes,
  images only, size limited). They can never read anything.
- At most **5 requests per phone per day**.
- Only the verified admin Google account can read, update status/notes, or delete.

## Run on this computer

```
cd public
python -m http.server 5055
```
Open http://127.0.0.1:5055 . The page talks to the real database, so a request sent locally is a
real request (delete it in the admin).

## Publish changes

```
npx firebase-tools@13 deploy --only hosting --project malvitha-restore
npx firebase-tools@13 deploy --only firestore --project malvitha-restore   # after changing firestore.rules
```
When you change `css/style.css` or `js/app.js`, raise the `?v=` number in `index.html` so phones load
the new file.

## Change common things

- **WhatsApp number / admin email / categories / service cards**: `public/js/config.js`
  (a new category key must also be added to the list in `firestore.rules`).
- **Statuses**: `STATUS` in `public/admin/admin.js` and the list in `firestore.rules`.

## Domain

`restore.malvitha.com` = GoDaddy DNS record `CNAME restore -> malvitha-restore.web.app`,
connected in Firebase Hosting. The QR code points to `https://restore.malvitha.com/?src=qr`.
