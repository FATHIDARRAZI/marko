const selectors = {
    imageUploader: 'imageUploader',
    watermarkUploader: 'watermarkUploader',
    watermarkType: 'watermarkType',
    spacing: 'spacing',
    opacity: 'opacity',
    scaleFactor: 'scaleFactor',
    color: 'color',
    addImageButton: 'addImageButton',
    gallery: 'gallery',
    downloadButton: 'download'
};

const classes = {
    additionalImageInput: 'additional-image-input',
    imageContainer: 'image-container',
    loadingDots: 'loading-dots'
};

let watermarkImage;
let uploadedImages = [];

document.getElementById(selectors.imageUploader).addEventListener('change', function(e) {
    for (let file of e.target.files) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let img = new Image();
            img.onload = function() {
                uploadedImages.push(img);
                showAddAnotherButton();  // Show the "Add Another Image" button after first image is uploaded
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById(selectors.watermarkUploader).addEventListener('change', function(e) {
    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            watermarkImage = img;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

document.getElementById(selectors.opacity).addEventListener('input', function() {
    document.getElementById('opacityValue').textContent = this.value;
});

document.getElementById(selectors.scaleFactor).addEventListener('input', function() {
    document.getElementById('scaleFactorValue').textContent = this.value;
});

document.getElementById(selectors.spacing).addEventListener('input', function() {
    document.getElementById('spacingValue').textContent = this.value;
});

document.getElementById(selectors.watermarkType).addEventListener('change', function() {
    const watermarkType = document.getElementById(selectors.watermarkType).value;
    const spacingLabel = document.getElementById('spacingLabel');
    const spacingInput = document.getElementById(selectors.spacing);
    if (watermarkType === 'loop') {
        spacingLabel.style.display = 'block';
        spacingInput.style.display = 'block';
    } else {
        spacingLabel.style.display = 'none';
        spacingInput.style.display = 'none';
    }
});

document.getElementById(selectors.addImageButton).addEventListener('click', function() {
    let newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.accept = 'image/*';
    newInput.classList.add(classes.additionalImageInput);
    newInput.addEventListener('change', function(e) {
        for (let file of e.target.files) {
            let reader = new FileReader();
            reader.onload = function(event) {
                let img = new Image();
                img.onload = function() {
                    uploadedImages.push(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    document.getElementById(selectors.addImageButton).insertAdjacentElement('beforebegin', newInput);
});

function showAddAnotherButton() {
    // Display the "Add Another Image" button after at least one image is uploaded
    document.getElementById(selectors.addImageButton).style.display = 'inline-block';
}

function showLoadingDots() {
    const downloadButton = document.getElementById(selectors.downloadButton);
    downloadButton.innerHTML = `Adding Watermark <div class="${classes.loadingDots}"><span></span><span></span><span></span></div>`;
}

function hideLoadingDots() {
    const downloadButton = document.getElementById(selectors.downloadButton);
    downloadButton.innerHTML = 'Add Watermark';
}

function applyColorToWatermark(watermark, color) {
    const offScreenCanvas = document.createElement('canvas');
    const offScreenCtx = offScreenCanvas.getContext('2d');
    offScreenCanvas.width = watermark.width;
    offScreenCanvas.height = watermark.height;

    // Draw the watermark image onto the off-screen canvas
    offScreenCtx.drawImage(watermark, 0, 0);

    // Get the image data
    const imageData = offScreenCtx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);
    const data = imageData.data;

    // Apply the color to the watermark
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // Check if the pixel is not transparent
            data[i] = parseInt(color.slice(1, 3), 16);     // Red
            data[i + 1] = parseInt(color.slice(3, 5), 16); // Green
            data[i + 2] = parseInt(color.slice(5, 7), 16); // Blue
        }
    }

    // Put the image data back to the off-screen canvas
    offScreenCtx.putImageData(imageData, 0, 0);

    // Return the off-screen canvas as an image
    const coloredWatermark = new Image();
    coloredWatermark.src = offScreenCanvas.toDataURL();
    return coloredWatermark;
}

function addWatermark() {
    if (!uploadedImages.length || !watermarkImage) {
        alert('Please upload both images and a watermark.');
        return;
    }

    showLoadingDots();

    const opacity = parseFloat(document.getElementById(selectors.opacity).value);
    const scaleFactor = parseFloat(document.getElementById(selectors.scaleFactor).value);
    const color = document.getElementById(selectors.color).value;
    const watermarkType = document.getElementById(selectors.watermarkType).value;
    const spacing = parseFloat(document.getElementById(selectors.spacing).value);

    const gallery = document.getElementById(selectors.gallery);
    gallery.innerHTML = '';  // Clear the gallery before adding new images

    const coloredWatermark = applyColorToWatermark(watermarkImage, color);

    coloredWatermark.onload = function() {
        uploadedImages.forEach((image, index) => {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw the original image
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // Apply watermark color
            ctx.globalAlpha = opacity;

            if (watermarkType === 'one') {
                // Calculate watermark size and position
                let watermarkWidth = coloredWatermark.width * scaleFactor;  // Resize the watermark
                let watermarkHeight = coloredWatermark.height * scaleFactor;
                let x = (canvas.width - watermarkWidth) / 2;
                let y = (canvas.height - watermarkHeight) / 2;

                // Draw the watermark
                ctx.drawImage(coloredWatermark, x, y, watermarkWidth, watermarkHeight);
            } else if (watermarkType === 'loop') {
                // Draw loop watermark
                let watermarkWidth = coloredWatermark.width * scaleFactor;
                let watermarkHeight = coloredWatermark.height * scaleFactor;
                for (let y = 0; y < canvas.height; y += watermarkHeight + spacing) {
                    for (let x = 0; x < canvas.width; x += watermarkWidth + spacing) {
                        ctx.drawImage(coloredWatermark, x, y, watermarkWidth, watermarkHeight);
                    }
                }
            } else if (watermarkType === 'diagonal') {
                // Draw diagonal watermark
                let watermarkWidth = coloredWatermark.width * scaleFactor;
                let watermarkHeight = coloredWatermark.height * scaleFactor;
                let x = 0;
                let y = 0;
                while (x < canvas.width && y < canvas.height) {
                    ctx.drawImage(coloredWatermark, x, y, watermarkWidth, watermarkHeight);
                    x += watermarkWidth + spacing;
                    y += watermarkHeight + spacing;
                }
            }

            // Create a new image element to display the watermarked image
            let watermarkedImage = new Image();
            watermarkedImage.src = canvas.toDataURL('image/png');

            // Create a container for the image and add it to the gallery
            let imageContainer = document.createElement('div');
            imageContainer.classList.add(classes.imageContainer);
            imageContainer.appendChild(watermarkedImage);

            // Add a download button
            let downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.onclick = function() {
                let link = document.createElement('a');
                link.href = watermarkedImage.src;
                link.download = `watermarked_image_${index + 1}.png`;
                link.click();
            };
            imageContainer.appendChild(downloadButton);

            gallery.appendChild(imageContainer);
        });

        hideLoadingDots();
    };
}

document.getElementById(selectors.downloadButton).addEventListener('click', addWatermark);
