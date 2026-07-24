import pytz
from datetime import datetime

IST = pytz.timezone('Asia/Kolkata')

def get_now_ist():
    """Returns the current datetime in Indian Standard Time (IST)."""
    return datetime.now(IST)

def to_ist(dt):
    """Converts a naive or aware datetime to IST."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume naive is UTC then convert
        return pytz.utc.localize(dt).astimezone(IST)
    return dt.astimezone(IST)
