# RECAB Equipment Monitoring: shared backend setup (about 15 minutes, free)

You need three things: **Supabase** (database + logins), the **V6 HTML file**, and a **host** for the file.

## 1. Create the Supabase project
1. Go to supabase.com, sign up and click **New project**. Pick a name, a strong database password and a region close to you (for example Singapore).
2. Wait for it to finish setting up.

## 2. Create the database
1. Left menu, **SQL Editor**, **New query**.
2. Paste everything from `supabase_schema.sql` and click **Run**. It should say "Success".

## 3. Allow instant sign-in for accounts you create
**Authentication**, **Sign In / Providers**, **Email**: turn **Confirm email** OFF, then save.
(The app creates accounts for your staff, so nobody needs to confirm an email.)

## 4. Create YOUR admin account (do this before sharing the link)
**Authentication**, **Users**, **Add user**, **Create new user**. Enter your email and a password, and tick **Auto Confirm User** if shown.
The first account ever created automatically becomes the active **admin**.

## 5. Connect the HTML file
1. **Project Settings**, **API**. Copy the **Project URL** and the public **anon / publishable** key. This key is meant to be public: the database rules protect your data.
2. Open `IT_Equipment_Monitoring_V6.html` in a text editor (Notepad is fine) and paste the two values at the very top:
   ```js
   window.RECAB_CONFIG={
     SUPABASE_URL:"https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY:"eyJ..."
   };
   ```
   Never paste the `service_role` / secret key anywhere in this file.

## 6. Host the file (pick one)
- **Netlify Drop**: app.netlify.com/drop, rename the file to `index.html`, drag it in. You get an https link.
- **GitHub Pages**, **Cloudflare Pages** or **Vercel** also work.

Open the link on any device, sign in with your admin email, then open **User Accounts** to create staff accounts.

## 7. Move your old data over
In the old V5 file open **Reports & Export**, download the JSON backup, then open V6, sign in as admin and use the restore/import button on the same screen.

## How it behaves
- **Logins**: real accounts (email + password). Sessions last across reloads. People can change their own password.
- **Roles**: **Admin** has full control. **User** is view-only. This is enforced by the database, not just the screen.
- **New accounts**: admin-created accounts start with a temporary password and must choose their own at first sign-in. Admins can disable, enable, reset or delete accounts.
- **Live data**: when an admin adds or edits something, every signed-in device updates within about a second. A 45-second refresh is the safety net.
- **Edits don't collide**: each record is saved on its own, so two admins editing different records never overwrite each other. If two admins edit the very same record, the last save wins.
- **Offline**: if the connection drops, changes are kept on screen and saved automatically when it returns.

## Limits to know about
- Supabase free projects pause after about 7 days with no activity. Open the project dashboard and click **Restore** to wake one.
- Deleting an account removes its login but not the records it created.
- Free-plan limits (500 MB database, 50,000 monthly active users) are far above what this system needs.
- If you leave the two settings at the top empty, the file runs in the old single-device mode.
