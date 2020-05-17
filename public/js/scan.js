// Hide Submit Button.
$(document).ready(function () {
  $('#submit').hide();
});

// Create a scanner using Istascan
let scanner = new Instascan.Scanner(
  {
    // Find video element by id
    video: document.getElementById('preview')
  }
);

// Using Istacan to read QR code and create a string.
scanner.addListener('scan', function (content) {
  var input = document.getElementById('hiddenInput');

  // Change hiddenInput value to the QR code value.
  input.value = content.toString();

  //Press hidden submit button.
  $(document).ready(function () {
    $('#submit').trigger('click');
  });
});

// Detect Camera
Instascan.Camera.getCameras().then(cameras => {
  if (cameras.length > 0) {
    scanner.start(cameras[0]);
  
  // If there is no camera detected
  } else {
    console.error("No camera detected.");
  }
});
