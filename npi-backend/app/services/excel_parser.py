from io import BytesIO
from typing import Iterator
import openpyxl

def parse_rows(file_bytes: bytes, expected_headers: list[str]) -> Iterator[dict]:
    wb = openpyxl.load_workbook(BytesIO(file_bytes), data_only=True, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    header_row = next(rows)
    headers = [str(h).strip().lower().replace(" ", "_") if h else "" for h in header_row]

    missing = [h for h in expected_headers if h not in headers]
    if missing:
        raise ValueError(f"Missing expected column(s): {', '.join(missing)}")

    col_index = {h: headers.index(h) for h in expected_headers}
    for raw_row in rows:
        if raw_row is None or all(v is None for v in raw_row):
            continue
        yield {h: raw_row[col_index[h]] for h in expected_headers}