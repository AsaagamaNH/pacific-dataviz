# 🌊 The Sinking Voices of the Pacific: A Tale of Climate Injustice

> **Projek Infografis & Visualisasi Data Interaktif**  
> *Tugas Besar Metode Visualisasi Data — Semester 4*

---

## 📌 Tentang Proyek

Negara-negara Kepulauan Pasifik (**Pacific Island Countries and Territories - PICT**) berada di garis depan krisis iklim global. Visualisasi interaktif ini mengangkat narasi **Keadilan Iklim (Climate Justice)** — bagaimana wilayah yang berkontribusi paling sedikit terhadap emisi gas rumah kaca justru menjadi korban pertama dari kenaikan permukaan laut dan bencana alam.

Dibangun dengan **React + D3.js + Scrollama** menggunakan pendekatan *scrollytelling* untuk membimbing audiens memahami data secara emosional dan ilmiah.

---

## 📂 Struktur Proyek

```
Projek Infografis/
├── README.md                        # Dokumentasi proyek
├── data/
│   ├── raw/                         # Data mentah dari SPC Pacific Data Hub
│   │   ├── CC_GHG_EMI.csv           # Emisi gas rumah kaca per kapita
│   │   ├── CC_RAIN_ANOM.csv         # Anomali curah hujan
│   │   ├── CC_SEA_LVL.csv           # Kenaikan permukaan air laut
│   │   ├── SDG11_AALT.csv           # Kerugian ekonomi akibat bencana
│   │   └── SDG11_AFFCT.csv          # Jumlah korban terdampak bencana
│   └── data_final_imputed.json      # Dataset bersih, siap visualisasi
├── scripts/
│   └── merge_and_impute.py          # Script preprocessing & imputasi
├── docs/
│   └── response_draft.txt           # Draft laporan ke dosen
└── dataviz-react/                   # Aplikasi visualisasi (React + Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx                 # Entry point React
        ├── index.css                # Design tokens & global styles
        ├── App.jsx                  # Layout utama + scrollytelling
        ├── App.css                  # Component styles
        ├── assets/
        │   └── data_final_imputed.json
        └── components/
            ├── D3Charts.jsx         # 5 visualisasi D3 (bubble, area, bar, heatmap, dot matrix)
            ├── ParticleBackground.jsx  # Background animasi subtle
            ├── ScrollProgress.jsx   # Navigasi chapter (fixed dots)
            └── AnimatedCounter.jsx  # Counter animasi di hero section
```

---

## 🎨 Alur Storytelling (5 Chapter)

| Chapter | Judul | Visualisasi | Insight |
|---------|-------|-------------|---------|
| 1 | The Paradox | Bubble Pack Chart | Emisi per kapita mendekati nol, kontras dengan negara industri |
| 2 | The Rising Tides | Area Chart | Anomali permukaan laut meningkat >10cm dalam dekade terakhir |
| 3 | The Economic Toll | Horizontal Bar Chart | Fiji menanggung >$1,25 Miliar kerugian |
| 4 | Rainfall Shifts | Heatmap | Pola curah hujan semakin tidak stabil sejak 1990 |
| 5 | Bridging the Data Gaps | Dot Matrix | 54% data diimputasi — transparansi metodologi |

---

## 🛠️ Metodologi Data

Dari total **6.440 baris data**, sekitar **54% data kosong** karena keterbatasan pelaporan pulau-pulau kecil. Diatasi dengan **Hierarchical Mean Imputation**:

1. Isi dengan rata-rata indikator pada tahun yang sama
2. Jika masih kosong, isi dengan rata-rata indikator seluruh tahun
3. Fallback ke `0`

---

## 💻 Cara Menjalankan

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

## 🎨 Desain

- **Tema**: White minimalist dengan aksen teal
- **Font Judul**: Vollkorn (serif)
- **Font Paragraf**: Inter (sans-serif)
- **Warna Aksen**: Teal `#0d9488`, Coral `#e74c3c`, Amber `#d97706`

---

## 📦 Tech Stack

- **React 19** + **Vite**
- **D3.js v7** — visualisasi data
- **Scrollama** — scroll-driven storytelling
- **Lucide React** — ikon
