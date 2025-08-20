import BeckhoffClient from 'node-beckhoff';

// --- Connection Settings for our PLC ---
const settings = {
  "plc": {
    "ip": "15.15.50.13", // The VPN-reachable IP of the PLC
    "port": 48898       // The standard AMS router port on the PLC
  },
  "remote": {
    "netid": "172.18.236.210.1.1", // The AMS Net ID of the PLC
    "port": 851                    // The TwinCAT 3 runtime port
  },

  "local": {},
  "develop": {
    "verbose": true, // Enable verbose logging for detailed diagnostics
    "debug": false
  }
};

async function main() {
  let beckhoff;
  try {
    beckhoff = new BeckhoffClient(settings);
    console.log('Beckhoff client initialized. Fetching PLC info to establish connection...');
    
    // This first command establishes the connection and initializes the internal DB
    const plcInfo = await beckhoff.getPlcInfo();
    console.log('✅ Successfully connected to PLC. Info:', plcInfo);

    const symbolToRead = [
      { name: 'BIOLOGICAL_HMI.COOLING_TOWER_IN_FM_OUT_HMI' }
    ];

    // Set up a loop to read the tag every 2 seconds
    setInterval(async () => {
      try {
        const data = await beckhoff.readPlcData(symbolToRead);
        if (data && data[0] && typeof data[0].value !== 'undefined') {
          console.log('Cooling Tower Flow:', data[0].value);
        } else {
          console.log('Tag read but no data returned.', data);
        }
      } catch (readErr) {
        console.error('❌ Error during tag read:', readErr.message);
      }
    }, 2000);

  } catch (err) {
    console.error('❌ An error occurred during initial connection:', err.message);
    if (beckhoff) {
      try {
        await beckhoff.destroy(); // Ensure cleanup on failure
      } catch (destroyErr) {
        // Suppress errors during cleanup as the initial error is more important
      }
    }
    process.exit(1);
  }

  // Handle graceful shutdown on Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n🔌 Disconnecting from PLC...');
    if (beckhoff) {
      await beckhoff.destroy();
    }
    process.exit(0);
  });
}

main();
