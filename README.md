# The Sinking Voices of the Pacific: A Tale of Climate Injustice

> **Projek Infografis & Visualisasi Data Interaktif**  
> *Tugas Besar Metode Visualisasi Data — Semester 4*

### 🌊 [Lihat Live Demo →](https://dataviz-react-two.vercel.app/)

---

## Tentang Proyek

Negara-negara Kepulauan Pasifik (**Pacific Island Countries and Territories - PICT**) berada di garis depan krisis iklim global. Visualisasi interaktif ini mengangkat narasi **Keadilan Iklim (Climate Justice)** — bagaimana wilayah yang berkontribusi paling sedikit terhadap emisi gas rumah kaca justru menjadi korban pertama dari kenaikan permukaan laut dan bencana alam.

Dibangun dengan **React + D3.js + GSAP** menggunakan pendekatan *scrollytelling* dengan parallax transitions untuk membimbing audiens memahami data secara emosional dan ilmiah.

---

## Struktur Proyek

```
Projek Infografis/
├── README.md                            # Dokumentasi proyek
├── vercel.json                          # Konfigurasi deployment Vercel
├── data/
│   ├── raw/                             # Data mentah dari SPC Pacific Data Hub
│   │   ├── CC_GHG_EMI.csv               # Emisi gas rumah kaca per kapita
│   │   ├── CC_RAIN_ANOM.csv             # Anomali curah hujan
│   │   ├── CC_SEA_LVL.csv              # Kenaikan permukaan air laut
│   │   ├── SDG11_AALT.csv               # Kerugian ekonomi akibat bencana
│   │   └── SDG11_AFFCT.csv              # Jumlah korban terdampak bencana
│   └── data_final_imputed.json          # Dataset bersih, siap visualisasi
├── scripts/
│   └── merge_and_impute.py              # Script preprocessing & imputasi
├── Dokumen UAS Metode Visualisasi Data/ # Laporan & dokumen pendukung
└── dataviz-react/                       # Aplikasi visualisasi (React + Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx                     # Entry point React + Router setup
        ├── index.css                    # Design tokens & global styles
        ├── App.jsx                      # Router shell (HomePage + CountryPage)
        ├── App.css                      # Component styles
        ├── assets/
        │   ├── data_final_imputed.json  # Dataset (copy untuk bundling)
        │   └── pacific_countries.js     # Data referensi negara Pasifik
        ├── context/
        │   └── DataContext.jsx          # React Context provider untuk data
        ├── hooks/
        │   └── useContainerSize.js      # Custom hook ukuran container
        ├── pages/
        │   ├── HomePage.jsx             # Halaman utama scrollytelling
        │   └── CountryPage.jsx          # Halaman detail per negara
        └── components/
            ├── HeroSection.jsx          # Hero section dengan animated counters
            ├── TransitionScreen.jsx     # Layar transisi antar chapter
            ├── ChartSection.jsx         # Wrapper layout untuk setiap chart
            ├── ParallaxSection.jsx      # Parallax scroll effect
            ├── GeoMapSection.jsx        # Peta interaktif negara Pasifik
            ├── ParticleBackground.jsx   # Background animasi partikel
            ├── ScrollProgress.jsx       # Navigasi section (fixed dots)
            ├── AnimatedCounter.jsx      # Counter animasi di hero section
            └── charts/
                ├── SeaLevelChart.jsx    # Area chart anomali permukaan laut
                ├── RainfallChart.jsx    # Bar chart anomali curah hujan
                ├── EconomicLossChart.jsx # Horizontal bar chart kerugian ekonomi
                ├── AffectedPopChart.jsx  # Chart populasi terdampak bencana
                └── EmissionsGeoChart.jsx # Geo-bubble chart emisi per kapita
```

---

## Alur Storytelling (8 Section)

| Section | Judul | Visualisasi | Insight |
|---------|-------|-------------|---------|
| 1 | Hero | Animated Counters | Ringkasan: jumlah negara, kerugian ekonomi, populasi terdampak |
| 2 | The Paradox | Transition Screen | Emisi < 0.03% global, tapi korban pertama perubahan iklim |
| 3 | Rising Waters | Area Chart | Anomali permukaan laut meningkat secara akseleratif sejak 1993 |
| 4 | Shattered Seasons | Bar Chart (anomali) | Pola curah hujan semakin volatile — swing antara kekeringan dan banjir |
| 5 | The Economic Toll | Horizontal Bar Chart | Kerugian ekonomi akibat bencana iklim, Fiji menanggung beban terbesar |
| 6 | Nations on the Front Line | Chart populasi | Ratusan ribu orang terdampak langsung bencana iklim |
| 7 | Emissions vs. Impact | Geo-Bubble Chart | Ironi: emiter terkecil menderita paling besar |
| 8 | Explore the Data | Peta Interaktif | Peta TopoJSON Pasifik — klik negara untuk detail data |

Setiap chapter diawali **Transition Screen** dengan judul & narasi, diikuti **Chart Section** berisi visualisasi D3.js dengan penjelasan kontekstual.

---

## Halaman Detail Negara

Aplikasi memiliki routing — klik pada negara di peta interaktif akan membuka halaman `/country/:countryName` yang menampilkan data lengkap untuk negara tersebut.

---

## Metodologi Data

Dari total **6.440 baris data**, sekitar **54% data kosong** karena keterbatasan pelaporan pulau-pulau kecil. Diatasi dengan **Hierarchical Mean Imputation**:

1. Isi dengan rata-rata indikator pada tahun yang sama
2. Jika masih kosong, isi dengan rata-rata indikator seluruh tahun
3. Fallback ke `0`

---

## Cara Menjalankan

### Preprocessing Data (opsional)
```bash
pip install pandas
cd scripts
python merge_and_impute.py
```

### Menjalankan Visualisasi
```bash
cd dataviz-react
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## Desain

- **Tema**: Dark mode — charcoal dengan neon accents
- **Font Judul**: Vollkorn (serif)
- **Font Paragraf**: Inter (sans-serif)
- **Warna Aksen**:
  - Cyan `#00F5D4` — aksen utama & highlight
  - Coral `#FF6B6B` — data peringatan & kerugian
  - Amber `#FFD93D` — data dampak manusia
  - Blue `#4CC9F0` — data lingkungan
  - Purple `#B388FF` — data curah hujan
- **Background**: `#0B0F19` (primary), `#111827` (secondary)
- **Efek**: Neon glow, glassmorphism cards, parallax scrolling, particle animation

---

## Tech Stack

- **React 19** + **Vite 8**
- **D3.js v7** — visualisasi data (area, bar, geo-bubble chart)
- **GSAP 3** + **ScrollTrigger** — animasi parallax & scroll-driven transitions
- **Scrollama** — scroll event detection
- **React Router DOM v7** — client-side routing
- **TopoJSON Client** — rendering peta Pasifik
- **Lucide React** — ikon UI
- **Intersection Observer** — polyfill visibilitas elemen

---

## Deployment

Aplikasi di-deploy menggunakan **Vercel**. Konfigurasi routing tersedia di `vercel.json`.

🔗 **Live URL**: [https://dataviz-react-two.vercel.app/](https://dataviz-react-two.vercel.app/)

---

## Tim Proyek

| Nama | NIM | Email |
|------|-----|-------|
| Asaagama Nashrul Haq | 103102400065 | asaagamanashrulhaq@student.telkomuniversity.ac.id |
| Muhammad Zahir Mubasysyir | 103102400073 | muhammadzahir@student.telkomuniversity.ac.id |
| Avrio De Galyn Athar | 103102400032 | avriodegalynathar@student.telkomuniversity.ac.id |
