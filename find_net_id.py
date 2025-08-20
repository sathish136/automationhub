import pyads
from pyads import pyads_ex

try:
    # This function directly queries the local AMS router for its address.
    # It requires a port to be opened first.
    port = pyads_ex.adsPortOpenEx()
    local_address = pyads_ex.adsGetLocalAddressEx(port)

    # Inspect the AmsAddr object to find the correct property for the Net ID.
    print("--- AmsAddr Object Attributes ---")
    print(local_address.__dict__)
    print("---------------------------")

    # From the output, we can identify the correct attribute and use it.
    # It is likely named '_ams_addr' or similar.
    if hasattr(local_address, 'netid'):
        print(f"PYADS_AMS_NET_ID:{local_address.netid}")

except Exception as e:
    print(f"Error getting local AMS Net ID: {e}")

finally:
    # Ensure the port is always closed.
    if 'port' in locals() and port:
        pyads_ex.adsPortCloseEx(port)
