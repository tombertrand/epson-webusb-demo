const fs = require("fs");
const usb = require("webusb").usb;

const STAR_COMMANDS = {
  // Kick the cash drawer
  OPEN_CASH_DRAWER: [0x1b, 0x07, 0x0b, 0x37, 0x07],
  // GET_STATUS: [0x1b, 0x1e, 0x61, 0x00, 0x1b, 0x06, 0x01],
  // ASB_OFF and then EOT
  // GET_STATUS: [0x1b, 0x1e, 0x61, 0x00, 0x04],
  // GET_STATUS: [0x04],
  // GET_SERIAL: [0x1b, 0x40, 0x1b, 0x1d, 0x29, 0x49, 0x01, 0x00, 0x31],
  // GET_MODEL: [0x1b, 0x40, 0x1b, 0x23, 0x2a, 0x0a, 0x00],
  ASB_OFF: Buffer.from([0x1b, 0x1e, 0x61, 50]),
  ASB_ON: [0x1b, 0x1e, 0x61, 0x01],

  GET_MODEL: Buffer.from([0x1b, 0x23, 0x2a, 0x0a, 0x00]),
  GET_SERIAL: Buffer.from([0x1b, 0x1d, 0x29, 0x49, 0x01, 0x00, 0x31]),
  GET_STATUS: Buffer.from([0x1b, 0x1e, 0x61, 0x00, 0x1b, 0x06, 0x01]),
  // RESET: Buffer.from([0x1b, 0x06, 0x18]),
};

const EPSON_COMMANDS = {
  GET_MODEL: Buffer.from([0x1d, 0x49, 67]),
  GET_SERIAL: Buffer.from([0x1d, 0x49, 68]),
  GET_FIRMWARE: Buffer.from([0x1d, 0x49, 65]),
  GET_STATUS: Buffer.from([0x1d, 0x61, 0b01001111]),
};

const ZEBRA_COMMANDS = {
  GET_MODEL: `~HI\n`,
};

const DYMO_COMMANDS = {
  GET_STATUS: Buffer.from([0x1b, 0x41]),
  GET_HARDWARE_STATUS: Buffer.from([0x1b, 0x61]),
};

fs.writeFileSync("epson-get-serial", Buffer.from([0x1d, 0x49, 68, 0x1b, 0x40]));
fs.writeFileSync("epson-get-model", Buffer.from([0x1d, 0x49, 66]));
fs.writeFileSync("star-get-model", Buffer.from(STAR_COMMANDS.GET_STATUS));
fs.writeFileSync("zebra-get-model", ZEBRA_COMMANDS.GET_MODEL);
fs.writeFileSync("dymo-get-status", DYMO_COMMANDS.GET_STATUS);

function selectEndpoint(direction, device) {
  const { endpoints } = device.configuration.interfaces[0].alternate;
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
        // { vendorId: 0x04b8, productId: 0x0e2a }, // epson tmm30II
        // { vendorId: 0x0519, productId: 0x003 }, // star tsp100
        { vendorId: 0x0a5f, productId: 0x011c }, // Zebra ZD410
        // { vendorId: 0x0a5f, productId: 0x0185 }, // Zebra ZD421
        // { vendorId: 2338, productId: 40 }, // LW 550
      ],
    });

    console.log("Device found", device);

    try {
      console.log("Opening device");
      await device.open();
      console.log("Device opened");
      console.log("Selecting device configuration");
      console.log("~~~~device", device);
      await device.selectConfiguration(1);
      console.log("Device configuration selected");
      console.log("Claiming device");
      await device.claimInterface(0);
      console.log("Device claimed");
      console.log(
        "~~~~device._configurations[0].interfaces.alternates[0]",
        device._configurations[0].interfaces[0].alternates[0].endpoints
      );

      const endpointOut = selectEndpoint("out", device);
      const endpointIn = selectEndpoint("in", device);

      console.log("~~~endpointIn", endpointIn);

      // const command = fs.readFileSync("./epson-get-model");
      // const command = fs.readFileSync("./star-get-model");

      // console.log("~~~command", command);

      // console.log(
      //   "~~~~buffer",
      //   Buffer.from([
      //     0x23,
      //     0x06,
      //     0x00,
      //     0x00,
      //     0x00,
      //     0x00,
      //     0x00,
      //     0x00,
      //     0x00,
      //   ]).compare(Buffer.from([0x23, 0x06], 0, 2, 0, 2))
      // );

      // console.log(
      //   "~~~~buffer",
      //   Buffer.from([0x23, 0x06]).compare(
      //     Buffer.from(
      //       [0x23, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      //       0,
      //       2
      //     )
      //   )
      // );

      // console.log(
      //   Buffer.from([0x23, 0x06]).compare(
      //     Buffer.from([0x23, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      //     0,
      //     2
      //   )
      // );

      // const buf1 = Buffer.from("1234");
      // const buf2 = Buffer.from("0123");
      // const arr = [buf1, buf2];

      // console.log(arr.sort(Buffer.compare));

      setInterval(async () => {
        try {
          const response = await device
            .transferIn(endpointIn.endpointNumber, 256)
            .catch((err) => {
              console.log("~~~err", err);
            });
          console.log("~~~response", response);
          console.log(
            "~~~response buffer to string",
            ab2str(response.data.buffer)
          );
        } catch (err) {
          console.log("~~~~err", err);
        }
        // console.log("~~~response", response.data.buffer);
        // } catch (err) {
        //   console.log("~~~err", err);
        // }

        // console.log(
        //   "~~~isCoverOpen?",
        //   response.data.buffer[0],
        //   response.data[1],
        //   (response.data.buffer[2] & 0b00100000) === 0b00100000
        // );
      }, 1000);

      setInterval(async () => {
        console.log(
          "Device transferOut - GET_STATUS",
          endpointOut.endpointNumber,
          ZEBRA_COMMANDS.GET_MODEL
        );

        device
          .transferOut(
            endpointOut.endpointNumber,
            // STAR_COMMANDS.ASB_OFF
            // EPSON_COMMANDS.GET_STATUS
            ZEBRA_COMMANDS.GET_MODEL
          )
          .catch((err) => {
            console.log("~~~err", err);
          });
      }, 1000);
      // console.log("Device transferOut completed");
    } catch (err) {
      console.log("Printing error", err);
    }
  } catch (err) {
    console.log("Request device error", err);
  }
})();

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
