import json
import csv
import sys
from pathlib import Path
import requests
from shapely.geometry import shape, Point
from shapely.ops import unary_union, nearest_points
from shapely.prepared import prep

print("Downloading India GeoJSON...", flush=True)
url = "https://raw.githubusercontent.com/geohacker/india/master/country/india.geojson"
r = requests.get(url)

try:
    data = r.json()
except json.JSONDecodeError:
    print("Failed to download or parse India GeoJSON. Trying alternative...", flush=True)
    url = "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States"
    r = requests.get(url)
    data = r.json()

print("Building India polygon...", flush=True)
polygons = []
features = data.get("features", [])
if not features and data.get("type") == "Polygon" or data.get("type") == "MultiPolygon":
    geom = shape(data)
    polygons.append(geom)
else:
    for feature in features:
        geom = shape(feature["geometry"])
        if geom.is_valid:
            polygons.append(geom)
        else:
            polygons.append(geom.buffer(0))

india_poly = unary_union(polygons)
india_prep = prep(india_poly)

def snap_to_india(lat, lon):
    p = Point(lon, lat)
    if india_prep.contains(p):
        return lat, lon
    
    # Snap to boundary and shift slightly inward (0.01 degrees ~ 1km) to ensure it's visually inside
    nearest = nearest_points(india_poly.boundary, p)[0]
    
    # Calculate a small vector towards the centroid to pull the point inside
    centroid = india_poly.centroid
    dx = centroid.x - nearest.x
    dy = centroid.y - nearest.y
    length = (dx**2 + dy**2)**0.5
    if length > 0:
        new_x = nearest.x + (dx/length) * 0.05  # ~5km inside
        new_y = nearest.y + (dy/length) * 0.05
    else:
        new_x, new_y = nearest.x, nearest.y
        
    # verify if inside, else just return boundary
    if india_poly.contains(Point(new_x, new_y)):
        return new_y, new_x
    return nearest.y, nearest.x

def process_csv(filepath, lat_col, lon_col):
    filepath = Path(filepath)
    if not filepath.exists():
        print(f"File not found: {filepath}")
        return
        
    print(f"Processing {filepath.name}...")
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    changed = 0
    for idx, row in enumerate(rows):
        if idx % 5000 == 0 and idx > 0:
            print(f"  ...processed {idx} rows")
            
        try:
            lat = float(row[lat_col])
            lon = float(row[lon_col])
        except ValueError:
            continue
            
        n_lat, n_lon = snap_to_india(lat, lon)
        if abs(n_lat - lat) > 0.0001 or abs(n_lon - lon) > 0.0001:
            row[lat_col] = f"{n_lat:.6f}"
            row[lon_col] = f"{n_lon:.6f}"
            changed += 1

    if changed > 0:
        with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    print(f"Updated {changed} rows in {filepath.name}")

data_dir = Path("data")
process_csv(data_dir / "FRA_unit_summary_443_units.csv", "synthetic_center_lat", "synthetic_center_lon")
process_csv(data_dir / "FRA_synthetic_443_units_44300_cases.csv", "latitude", "longitude")
print("Done!")
