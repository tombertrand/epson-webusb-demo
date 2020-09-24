const fs = require("fs");
const usb = require("webusb").usb;

function selectEndpoint(direction, device) {
  const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
    (ep) => ep.direction === direction
  );

  if (endpoint == null)
    throw new Error(`Endpoint ${direction} not found in device interface.`);
  return endpoint;
}

console.log("Searching for Web USB devices...");
(async () => {
  try {
    const device = await usb.requestDevice({
      filters: [
        { vendorId: 0x04b8, productId: 0x0e20 }, // epson tmm30
        { vendorId: 0x0519, productId: 0x003 }, // star tsp100
      ],
    });

    console.log("Device found", device);

    try {
      console.log("Opening device");
      await device.open();
      console.log("Device opened");
      console.log("Selecting device configuration");
      await device.selectConfiguration(1);
      console.log("Device configuration selected");
      console.log("Claiming device");
      await device.claimInterface(0);
      console.log("Device claimed");

      const endpoint = selectEndpoint("out", device);

      const image =
        device.manufacturerName === "STAR"
          ? fs.readFileSync("./image-star")
          : fs.readFileSync("./image-epson");

      console.log("Device transferOut");
      device.transferOut(endpoint.endpointNumber, image);
      console.log("Device transferOut completed");
    } catch (err) {
      console.log("Printing error", err);
    }
  } catch (err) {
    console.log("Request device error", err);
  }
})();
