import os
import pandas as pd

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'raw')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'data')

# =========================================================================
# 1. DAFTAR FILE SUMBER (data/raw/)
# =========================================================================
files = {
    "SDG11_AFFCT":  os.path.join(RAW_DIR, "SDG11_AFFCT.csv"),   # VC_DSR_AFFCT
    "SDG11_AALT":   os.path.join(RAW_DIR, "SDG11_AALT.csv"),    # VC_DSR_AALT
    "CC_RAIN_ANOM": os.path.join(RAW_DIR, "CC_RAIN_ANOM.csv"),   # RAIN_ANOM
    "CC_SEA_LVL":   os.path.join(RAW_DIR, "CC_SEA_LVL.csv"),    # SEA_LVL
    "CC_GHG_EMI":   os.path.join(RAW_DIR, "CC_GHG_EMI.csv"),    # GHG_EMI_CAPITA
}

# =========================================================================
# 2. BACA & SAMAKAN STRUKTUR KOLOM TIAP FILE
#    - File SDG_11 punya kolom 'INDICATOR'
#    - File CLIMATE_CHANGE punya kolom 'CLIMATE_CHANGE_INDICATORS'
#    Keduanya kita seragamkan jadi satu nama kolom: 'INDICATOR'
# =========================================================================
long_dfs = []
for tag, filepath in files.items():
    df = pd.read_csv(filepath)

    if 'INDICATOR' in df.columns:
        df = df.rename(columns={'Indicator': 'INDICATOR_LABEL'})
    else:
        df = df.rename(columns={
            'CLIMATE_CHANGE_INDICATORS': 'INDICATOR',
            'Climate Change Indicators': 'INDICATOR_LABEL'
        })

    df = df.rename(columns={'Pacific Island Countries and territories': 'GEO_PICT_LABEL'})

    keep_cols = ['GEO_PICT', 'GEO_PICT_LABEL', 'INDICATOR', 'INDICATOR_LABEL',
                 'TIME_PERIOD', 'OBS_VALUE', 'UNIT_MEASURE']
    keep_cols = [c for c in keep_cols if c in df.columns]

    long_dfs.append(df[keep_cols].copy())

# Gabungkan kelima file jadi satu dataframe format panjang (long format)
long_df = pd.concat(long_dfs, ignore_index=True)
long_df['OBS_VALUE'] = pd.to_numeric(long_df['OBS_VALUE'], errors='coerce')
long_df['TIME_PERIOD'] = pd.to_numeric(long_df['TIME_PERIOD'], errors='coerce').astype('Int64')

# =========================================================================
# 3. BANGUN GRID LENGKAP: semua kombinasi Negara x Indikator x Tahun
#    Inilah "proses join" yang menyebabkan munculnya data bolong (NaN) --
#    karena tidak setiap negara melaporkan setiap indikator di setiap tahun.
# =========================================================================
countries  = long_df[['GEO_PICT', 'GEO_PICT_LABEL']].drop_duplicates()
indicators = long_df[['INDICATOR', 'INDICATOR_LABEL']].drop_duplicates()
years = pd.DataFrame({
    'TIME_PERIOD': range(int(long_df['TIME_PERIOD'].min()), int(long_df['TIME_PERIOD'].max()) + 1)
})

grid = countries.merge(indicators, how='cross').merge(years, how='cross')

# Join data aktual ke grid lengkap (left join) -> combined_df
combined_df = grid.merge(
    long_df[['GEO_PICT', 'INDICATOR', 'TIME_PERIOD', 'OBS_VALUE', 'UNIT_MEASURE']],
    on=['GEO_PICT', 'INDICATOR', 'TIME_PERIOD'],
    how='left'
)

print(f"Total baris combined_df: {len(combined_df)}")
print(f"Baris dengan OBS_VALUE kosong sebelum imputasi: {combined_df['OBS_VALUE'].isna().sum()}")

# =========================================================================
# 4. IMPUTASI NILAI BOLONG
#    Strategi: isi dengan rata-rata per Tahun per Indikator,
#    lalu rata-rata total per Indikator, lalu 0 jika masih kosong.
# =========================================================================
combined_df['OBS_VALUE'] = pd.to_numeric(combined_df['OBS_VALUE'], errors='coerce')

combined_df['OBS_VALUE'] = combined_df.groupby(['TIME_PERIOD', 'INDICATOR'])['OBS_VALUE'] \
    .transform(lambda x: x.fillna(x.mean()))

combined_df['OBS_VALUE'] = combined_df.groupby('INDICATOR')['OBS_VALUE'] \
    .transform(lambda x: x.fillna(x.mean()))

combined_df['OBS_VALUE'] = combined_df['OBS_VALUE'].fillna(0)

print(f"Baris dengan OBS_VALUE kosong sesudah imputasi: {combined_df['OBS_VALUE'].isna().sum()}")

# =========================================================================
# 5. EXPORT KE JSON
# =========================================================================
output_path = os.path.join(OUTPUT_DIR, "data_final_imputed.json")
combined_df.to_json(output_path, orient="records", indent=4)
print(f"Berhasil disimpan ke: {output_path}")
