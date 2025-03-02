document.addEventListener("DOMContentLoaded", function () {
    const xrayInput = document.getElementById("xray");
    const uploadBtn = document.getElementById("uploadBtn");
    const processBtn = document.getElementById("processBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const previewImage = document.getElementById("previewImage");
    const preview = document.getElementById("preview");
    const uploadSpinner = document.getElementById("uploadSpinner");
    const errorMessage = document.getElementById("errorMessage");
    const resultElement = document.getElementById("result");
    const treatmentElement = document.getElementById("treatmentInfo"); // Fixed ID
    const dangerStatus = document.getElementById("dangerStatus");

    let model;

    // ✅ Load the TensorFlow.js model
    async function loadModel() {
        try {
            console.log("🚀 Loading model...");
            model = await tf.loadLayersModel("./web_model/model.json");
            console.log("✅ Model loaded successfully!");
        } catch (error) {
            console.error("❌ Error loading model:", error);
            errorMessage.textContent = "⚠️ Failed to load model.";
            errorMessage.classList.remove("d-none");
        }
    }
    loadModel();

    // ✅ Upload button triggers file selection
    uploadBtn.addEventListener("click", function () {
        xrayInput.click();
    });

    // ✅ Display preview when file is selected
    xrayInput.addEventListener("change", function () {
        const file = xrayInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                preview.classList.remove("d-none");
            };
            reader.readAsDataURL(file);
            errorMessage.classList.add("d-none");
        }
    });

    // ✅ Cancel button resets everything
    cancelBtn.addEventListener("click", function () {
        preview.classList.add("d-none");
        xrayInput.value = "";
    });

    // ✅ Process X-ray image
    processBtn.addEventListener("click", async function () {
        if (!model) {
            console.error("🚨 Model not loaded.");
            return;
        }
        if (!xrayInput.files.length) {
            errorMessage.textContent = "❌ Please select an X-ray image.";
            errorMessage.classList.remove("d-none");
            return;
        }

        uploadSpinner.classList.remove("d-none");
        resultElement.innerText = "";
        treatmentElement.innerText = "-";
        dangerStatus.innerHTML = '<span class="indicator"></span> <span class="status-text">-</span>';

        try {
            console.log("🖼️ Preprocessing image...");
            const tensor = await preprocessImage(xrayInput.files[0]);
            console.log("📏 Image preprocessed. Shape:", tensor.shape);

            console.log("🤖 Making prediction...");
            const prediction = model.predict(tensor);
            const predictionValues = await prediction.data();
            console.log("📊 Prediction values:", predictionValues);

            updateUI(predictionValues[1]); // Assuming second value is pneumonia probability
        } catch (error) {
            console.error("❌ Error during prediction:", error);
            errorMessage.textContent = "⚠️ An error occurred while processing the image.";
            errorMessage.classList.remove("d-none");
        } finally {
            uploadSpinner.classList.add("d-none");
        }
    });

    // ✅ Preprocess Image for Model
    async function preprocessImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = function () {
                const tensor = tf.browser.fromPixels(img)
                    .resizeNearestNeighbor([224, 224])
                    .expandDims()
                    .toFloat()
                    .div(tf.scalar(255));
                resolve(tensor);
            };
        });
    }

    // ✅ Update UI with Prediction Results
    function updateUI(pneumoniaProbability) {
        let resultText = "";
        let resultColor = "green";
        let treatmentAdvice = "";

        if (pneumoniaProbability > 0.8) {
            resultText = "⚠️ Severe Pneumonia Detected!";
            resultColor = "red";
            treatmentAdvice = "Seek immediate medical attention. Take prescribed antibiotics and rest.";
        } else if (pneumoniaProbability > 0.5) {
            resultText = "⚠️ Mild Pneumonia Detected!";
            resultColor = "orange";
            treatmentAdvice = "Monitor symptoms, stay hydrated, and consult a doctor if worsens.";
        } else {
            resultText = "✅ No Pneumonia Detected!";
            resultColor = "green";
            treatmentAdvice = "Maintain hygiene, get vaccinated, and avoid smoking.";
        }
        
        

        console.log("🔍 Diagnosis Result:", resultText);

        resultElement.innerText = resultText;
        resultElement.style.color = resultColor;
        resultElement.style.fontWeight = "bold";
        resultElement.style.textAlign = "center";

        treatmentElement.innerText = treatmentAdvice;

        // Update risk indicator
        dangerStatus.innerHTML = `<span class="indicator ${resultColor === 'red' ? 'danger' : resultColor === 'orange' ? 'warning' : 'safe'}"></span>
                                  <span class="status-text">${resultText}</span>`;

        recommendHospitals();
    }

    // ✅ Recommend hospitals based on severity
    function recommendHospitals() {
        document.getElementById('hospital-recommendation').innerText = "🏥 Recommended hospitals: Apollo Hospital, Medanta, AIIMS.";
    }
});
