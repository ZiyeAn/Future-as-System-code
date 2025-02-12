document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();//prevent reload

    //play sound after submit the form
    const audio1 = new Audio('assets/clap.mp3'); 
    const audio2 = new Audio('assets/cooking.mp3')
    audio1.play();
    audio2.play();

    // change background color and add backgroung img
    document.body.style.backgroundColor = '#000';
    document.body.style.backgroundImage = "url('assets/result.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";

    //hide the buttons while showing the result
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.style.display = 'none';

    //show the loading image
    const result = document.getElementById('result');
    result.classList.remove('hidden');

    //store uploaded files in the formdata
    const formData = new FormData();
    const fileInput = document.getElementById('mushroomImage');
    formData.append('uploadFiles', fileInput.files[0]);

    //fetch answer from API
    try {
        const response = await fetch('/identify', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to fetch the identification result.");
        }

        const result = await response.json();
        console.log("Raw Result:", result);

        //wait for the music and show the result
        setTimeout(() => {
            const resultDiv = document.getElementById('result');
            resultDiv.classList.remove('hidden');
            displayResult(result.output);
        }, 1500); 
    } catch (error) {
        document.getElementById('result').innerText = `Error: ${error.message}`;
    }
});

//turn raw result into orderly result
function displayResult(rawOutput) {
    try {
        const cleanedOutput = rawOutput.replace(/```json\n?|\n```/g, "");
        const result = JSON.parse(cleanedOutput);

        if (!result.name || !result.basic_info || !result.recipe) {
            document.getElementById("result").innerText = "Invalid result format.";
            return;
        }

        // Create HTML structure for the result
        const container = document.createElement("div");
        container.classList.add("result-text");

        container.innerHTML = `
          <h2>${result.name}</h2>
          <h3>Basic Information</h3>
          <p>${result.basic_info}</p>
          <h3>Recipe: ${result.recipe.name}</h3>
          <h4>Ingredients</h4>
          <ul>${result.recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join("")}</ul>
          <h4>Instructions</h4>
          <ol>${result.recipe.instructions.map(step => `<li>${step}</li>`).join("")}</ol>
        `;

        // Append the formatted result to the result div
        const resultDiv = document.getElementById("result");
        resultDiv.innerHTML = ""; 
        resultDiv.appendChild(container);
    } catch (error) {
        document.getElementById("result").innerText = `Error parsing result: ${error.message}`;
    }
}