import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'datasets', 'fra.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT DISTINCT district_name, district_id, state_id FROM claims WHERE district_name LIKE '%hyderabad%' COLLATE NOCASE")
print('Hyderabad in claims:', c.fetchall())

c.execute("SELECT DISTINCT district_name, district_id, state_id FROM claims WHERE district_name LIKE '%nizamabad%' COLLATE NOCASE")
print('Nizamabad in claims:', c.fetchall())

c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', c.fetchall())
