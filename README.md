# Pixel Soccer: Cozy Football (Alpha)

Game sepak bola pixel art 2D offline untuk Android, dibangun dari GDD dan paket aset CozyPixelSoccer.

## Menjalankan
- **Uji di browser:** `cd www && python3 -m http.server 8000` lalu buka http://localhost:8000 (desktop: WASD/panah, J=umpan, K=tembak (tahan), L=through, Shift=sprint, P=jeda).
- **Build APK:** buka folder `android/` di Android Studio (atau jalankan `./build_android.sh`). Aset game ada di `android/app/src/main/assets/www`.

## Fitur alpha (sesuai GDD)
Training (6 latihan, rank S/A/B/C + XP), Tournament (Beginner 4 tim, Cozy League 8, Grand Pixel 8; gugur; hadiah; unlock koin), 11 pemain default, formasi 4-3-3/4-4-2/4-2-3-1/3-5-2 dengan penalti posisi, kapten, level & max level, upgrade atribut (koin + poin), 10 passive skill, shop (4 stok, rotasi setelah turnamen), 3 pergantian/pertandingan, stamina, pelanggaran/penalti, adu penalti, statistik pertandingan & Player of the Match, achievement, save lokal dengan validasi.

## Catatan
- Paket aset hanya berisi 3 rekrutan; 7 rekrutan lain memakai sprite default yang di-recolor (`tools/prepare_assets.py`).
- Babak tidak bertukar sisi (arcade). Chemistry, kepribadian, dan perbandingan pemain belum diimplementasikan.
- APK belum dibangun di lingkungan ini (tanpa Android SDK/jaringan); kode Android belum diuji kompilasi.

## CI (GitHub Actions)
`.github/workflows/android.yml` membangun APK debug otomatis pada push, pull request, atau manual (Actions > Android Build > Run workflow). APK ada di Artifacts (`CozyPixelSoccer-debug-apk`). Push tag `v*` (mis. `v0.1.0`) juga membuat GitHub Release berisi APK.

## Kontrol & kamera
Lapangan 2x lebih luas dengan kamera mengikuti pembawa bola dan radar mini di kiri atas. Tombol berlabel: TEMBAK (tahan = tembakan jauh), UMPAN (tahan = umpan jauh), TEROBOS, SPRINT; tanpa bola: TEKEL dan GANTI. Keyboard: J umpan (tahan = jauh), K tembak/tekel, L terobos, Shift sprint.
