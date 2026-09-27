import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'fra.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("UPDATE claims SET longitude = 83.5 WHERE longitude > 84.5 AND latitude < 19.5 AND state_id IN ('andhra-pradesh', 'odisha')")
c.execute("UPDATE claims SET longitude = 85.0 WHERE longitude > 86.5 AND latitude < 21.0 AND state_id = 'odisha'")
c.execute("UPDATE claims SET longitude = 73.5 WHERE longitude < 73.0 AND latitude < 20.0")
c.execute("UPDATE claims SET latitude = 9.0 WHERE latitude < 8.1")
# East extreme points for NE states
c.execute("UPDATE claims SET longitude = 95.0 WHERE longitude > 96.0 AND state_id = 'arunachal-pradesh'")

conn.commit()
print("Trimmed sea outliers.")
