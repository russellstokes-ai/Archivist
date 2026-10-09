"""Test-only JSON bridge to real SQLite; no production scan logic."""
import json
import sqlite3
import sys

db = sqlite3.connect(sys.argv[1], isolation_level=None)
db.row_factory = sqlite3.Row
for line in sys.stdin:
    request = json.loads(line)
    try:
        operation = request['operation']
        if operation == 'exec':
            db.executescript(request['sql'])
            value = None
        elif operation == 'query':
            value = [dict(row) for row in db.execute(request['sql'], request.get('params', []))]
        elif operation == 'close':
            db.close()
            value = None
        else:
            cursor = db.execute(request['sql'], request.get('params', []))
            value = {'changes': cursor.rowcount}
        print(json.dumps({'id': request['id'], 'value': value}), flush=True)
        if operation == 'close':
            break
    except Exception as error:
        print(json.dumps({'id': request['id'], 'error': str(error)}), flush=True)
