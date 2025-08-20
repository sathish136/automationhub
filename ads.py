import pyads
import sys

# --- PLC Connection Details ---
PLC_AMS_NET_ID = '172.18.236.210.1.1'
PLC_PORT = pyads.PORT_TC3PLC1

def read_plc_tag(tag_name):
    """Connects to the PLC, reads a single tag, and returns the value."""
    try:
        plc = pyads.Connection(PLC_AMS_NET_ID, PLC_PORT)
        plc.open()
        value = plc.read_by_name(tag_name, pyads.PLCTYPE_REAL)
        plc.close()
        return value
    except Exception as e:
        # Print errors to stderr so Node.js can distinguish them from valid output
        print(f"Python Error: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    # This script is designed to be called from another process (like Node.js).
    # It expects the tag name to be passed as the first command-line argument.
    if len(sys.argv) > 1:
        tag_to_read = sys.argv[1]
        tag_value = read_plc_tag(tag_to_read)
        if tag_value is not None:
            # Print the raw value to stdout for the calling process to capture
            print(tag_value)
    else:
        print("Python Error: No tag name provided.", file=sys.stderr)
