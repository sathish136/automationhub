import ads from "node-ads";

const options = {
  // Connect to the local AMS router, which will forward the request to the PLC
  host: '127.0.0.1',
  port: 48898,

  // The AMS Net ID of the target PLC
  amsNetIdTarget: '172.18.236.210.1.1',

  // The local AMS Net ID of this machine, which the PLC recognizes
  amsNetIdSource: '192.168.22.11.1.1',

  // Set a timeout for the connection
  timeout: 2000,

  targetAdsPort: 851                     // TwinCAT 3 port
};

const client = ads.connect(options, () => {
  console.log("✅ Connected to PLC");

  setInterval(() => {
    client.read(
      { 
        symname: "BIOLOGICAL_HMI.COOLING_TOWER_IN_FM_OUT_HMI", 
        bytelength: ads.REAL 
      },
      (err, result) => {
        if (err) {
          console.error("❌ Read error:", err); // Log the full error object
          return;
        }
        console.log("Cooling Tower Flow:", result.value);
      }
    );
  }, 2000);
});

client.on("error", (err) => {
  console.error("❌ ADS Client Error:", err);
});

process.on("SIGINT", () => {
  console.log("\n🔌 Disconnecting from PLC...");
  client.end();
  process.exit();
});
