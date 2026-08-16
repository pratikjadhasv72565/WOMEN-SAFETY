# SheSafe Mobile App 📱🛡️

Cross-platform React Native (Expo) mobile app for **SheSafe Women Safety**.

---

## ✨ Features

- **🚨 One-Tap Emergency SOS**:
  - Automatically initiates phone call to the primary contact via native dialer.
  - Fetches precise GPS coordinates and automatically composes/dispatches an emergency SMS with live Google Maps link.
  - Logs the SOS event directly to the Django server.
- **👥 Trusted Guardians Management**:
  - View, add, set primary, and delete emergency contacts.
  - Syncs directly with your SheSafe account database.
- **📞 National Emergency Hotlines**:
  - One-tap quick dials for National Emergency (112), Women Helpline (181), and Police (100).
- **🔐 Secure Authentication**:
  - Login & Registration synced with the Django backend.
  - Persistent login via AsyncStorage.

---

## 🚀 Quick Start & How to Run

### 1. Configure the Backend URL
Open `src/config.js` and set your backend server URL:

```javascript
// For testing on physical phone via Expo Go (use your PC's Wi-Fi IP):
export const API_BASE = 'http://192.168.1.X:8000';

// For Android Emulator:
export const API_BASE = 'http://10.0.2.2:8000';

// For deployed Production server:
export const API_BASE = 'https://your-domain.onrender.com';
```

### 2. Start the Django Backend (in `SheSafe` directory)
```powershell
python manage.py runserver 0.0.0.0:8000
```

### 3. Start the Mobile App (in `SheSafe-Mobile` directory)
```powershell
npm start
# OR
npx expo start
```

---

## 📱 Testing on Your Phone

1. Install **Expo Go** from Google Play Store (Android) or Apple App Store (iOS).
2. Ensure your phone and PC are connected to the **same Wi-Fi network**.
3. Scan the **QR Code** in your terminal using the Expo Go app.
4. The SheSafe app will build and open directly on your mobile device!
