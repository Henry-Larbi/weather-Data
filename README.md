# weather-Data

This repo can be a simple place to practice **learning CSV** with weather data.

## What is a CSV?

CSV means **Comma-Separated Values**.  
Each row is one record, and each column is one field.

Example:

```csv
date,city,temp_c,humidity,condition
2026-05-10,Accra,31,72,Sunny
2026-05-11,Accra,29,80,Rainy
```

## CSV learning path (beginner-friendly)

1. Understand the header row (`date`, `city`, `temp_c`, etc.).
2. Read rows as weather observations.
3. Filter rows (for example: only `condition = Rainy`).
4. Calculate simple stats (average temperature, max humidity).
5. Export cleaned data back to a new CSV.

## Practice with Python

```python
import csv

with open("weather_sample.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows: {len(rows)}")
if rows:
    avg_temp = sum(float(r["temp_c"]) for r in rows) / len(rows)
    print(f"Average temperature: {avg_temp:.1f}°C")
else:
    print("No weather rows found.")
```

## Suggested next exercises

- Add 10 more days of weather data.
- Find the hottest day.
- Count how many rainy days exist.
- Create a second CSV with only rainy days.
