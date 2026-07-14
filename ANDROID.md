# SYSTEM — Android APK Üretim Rehberi

Bu proje Capacitor 8 üzerinden native Android APK olarak paketlenmek üzere
yapılandırıldı. Aşağıdaki adımlar hem Debug hem Release APK üretimini kapsar.

## 1. Ön Koşullar

Yerel makinede kurulu olmalı:

- **Node 20+** ve **bun** (bu deponun paket yöneticisi).
- **JDK 17** (Android Gradle Plugin 8+ zorunluluğu).
- **Android Studio Ladybug (2024.2)** veya üzeri — Android SDK 34+ ile.
- Ortam değişkeni: `ANDROID_HOME` = Android SDK yolu.

## 2. Web Katmanını Derle ve Capacitor'a Bağla

```bash
bun install
bun run android:build   # vite build + prepare-android + cap sync android
```

`android:build` script'i şunları yapar:

1. `vite build` çalıştırır — Nitro çıktısı `.output/` altına düşer.
2. `scripts/prepare-android.mjs` statik varlıkları `android-webroot/` içine
   kopyalar. Capacitor `webDir` bu klasörü kullanır, yani APK internet olmadan
   açılabilir.
3. `cap sync android` `android/` klasörünü günceller (ilk çalıştırmadan önce
   `bun run android:init` ile Android platformunu ekleyin).

## 3. Android Studio ile APK Üretimi

```bash
bun run android:open
```

Studio açıldığında:

- **Debug APK**: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
- **Release APK / AAB**: `Build → Generate Signed Bundle / APK…`
  - Keystore yoksa Studio üzerinden oluşturun (`New Keystore`).
  - `build.gradle` içinde `versionCode` ve `versionName` değerlerini her
    yeni sürümde artırın; kullanıcı verileri korunur (Capacitor Preferences
    kalıcı depolamayı kullanır, uygulama yükseltmelerinde silinmez).

APK çıktısı: `android/app/build/outputs/apk/{debug|release}/`

## 4. Çevrimdışı Çalışma

- Tüm SYSTEM özellikleri (görevler, XP, streak, odak, profil) tamamen yerel
  çalışır. İnternet gerektirmez.
- Veri katmanı öncelik sırası: **Capacitor Preferences → LocalStorage**.
  Preferences Android tarafından `/data/data/app.lovable.system/` altında
  tutulur ve uygulama güncellemelerinde otomatik korunur.

## 5. Google Play Yükleme Notları

- `applicationId` = `app.lovable.system` (Capacitor `appId` ile eşleşir).
- Release AAB kullanın (`Build → Generate Signed Bundle`).
- Play Console'da yeni sürüm yüklerken `versionCode` artmalı; aksi halde
  yükleme reddedilir.
- Data safety formu: uygulama hiçbir kullanıcı verisini uzak sunucuya
  göndermez, yalnızca cihazda saklar.

## 6. İzinler

Mevcut sürümde manifest sadece varsayılan izinleri talep eder
(`INTERNET` isteğe bağlı, offline çalışır). Yeni özellikler için
`src/lib/native/permissions.ts` merkezi izin katmanı kullanılmalıdır.
