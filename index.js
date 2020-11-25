const fs = require("fs");
const usb = require("webusb").usb;

fs.writeFileSync("epson-get-serial", Buffer.from([0x1d, 0x49, 68, 0x1b, 0x40]));
fs.writeFileSync("epson-get-model", Buffer.from([0x1d, 0x49, 66]));
fs.writeFileSync("star-get-model", Buffer.from([0x1b, 0x23, 0x2a, 0x0a, 0x00]));

function selectEndpoint(direction, device) {
  const { endpoints } = device.configuration.interfaces[0].alternate;
  console.log("~~~~endpoints", endpoints);
  const endpoint = endpoints.find((ep) => ep.direction === direction);

  if (endpoint == null)
    throw new Error(`Endpoint ${direction} not found in device interface.`);
  return endpoint;
}

console.log("Searching for Web USB devices...");
(async () => {
  try {
    const device = await usb.requestDevice({
      filters: [
        // { vendorId: 0x04b8, productId: 0x0e20 }, // epson tmm30
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

      const endpointOut = selectEndpoint("out", device);
      const endpointIn = selectEndpoint("in", device);

      const command = fs.readFileSync("./star-get-model");

      // const image =
      //   device.manufacturerName === "STAR"
      //     ? fs.readFileSync("./image-star")
      //     : fs.readFileSync("./image-epson");

      console.log("~~~command", command);

      console.log("Device transferOut");
      console.log("~~~~endpointOut", endpointOut.endpointNumber);
      device.transferOut(endpointOut.endpointNumber, command);
      // device.transferOut(endpointOut.endpointNumber, image);
      console.log("Device transferOut completed");
      console.log("~~~~endpointIn", endpointIn.endpointNumber);

      const response = await device.transferIn(endpointIn.endpointNumber, 64);
      console.log("~~~model response", response);
    } catch (err) {
      console.log("Printing error", err);
    }
  } catch (err) {
    console.log("Request device error", err);
  }
})();
