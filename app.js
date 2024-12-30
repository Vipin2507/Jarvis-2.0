const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
let isListening = false; // State variable to track if JARVIS is listening

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    var day = new Date();
    var hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Good Morning Boss...");
    } else if (hour >= 12 && hour < 17) {
        speak("Good Afternoon Master...");
    } else {
        speak("Good Evening Sir...");
    }
}

window.addEventListener('load', () => {
    speak("Initializing JARVIS...");
    wishMe();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};
function tellJoke() {
    fetch('https://official-joke-api.appspot.com/random_joke')
        .then(response => response.json())
        .then(data => {
            const joke = `${data.setup} ... ${data.punchline}`;
            speak(joke);
        })
        .catch(error => {
            console.error("Error fetching joke:", error);
            speak("Sorry, I couldn't fetch a joke at the moment.");
        });
}
function playMusicOnYouTube(song) {
    const query = song.replace("play", "").trim();
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(youtubeSearchUrl, "_blank");
    speak(`Playing ${query} on YouTube.`);
}

btn.addEventListener('click', () => {
    if (!isListening) {
        wishMe();
        content.textContent = "Listening...";
        isListening = true; // Set the state to listening
        recognition.start();
    }
});

function takeCommand(message) {
    if (message.includes('hey') || message.includes('hello')) {
        speak("Hello Sir, How May I Help You?");
    }else if (message.includes("play")) {
        playMusicOnYouTube(message);
    }
    else if (message.includes("joke")) {
        tellJoke();
    }
    else if(message.includes("what is this")){
        startCameraRecognition();
    }
    else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "This is what I found on the internet regarding " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "This is what I found on Wikipedia regarding " + message;
        speak(finalText);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const finalText = "Opening Calculator";
        speak(finalText);
    } else if (message.includes('stop')) {
        speak("Stopping JARVIS. Have a nice day!");
        recognition.stop(); // Stop the recognition
        isListening = false; // Update state to not listening
        return; // Exit the function
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "I found some information for " + message + " on Google";
        speak(finalText);
    }
    // Only restart recognition if the command was not 'stop'
    if (isListening) {
        recognition.start();
    }
}

// Start listening when the recognition service is ready
recognition.onend = () => {
    if (isListening) { // Only restart if still listening
        content.textContent = "Listening...";
        recognition.start();
    }
};

function startCameraRecognition() {
    // Create and display a small box for the camera
    const videoBox = document.createElement('div');
    videoBox.style.position = 'fixed';
    videoBox.style.bottom = '10px';
    videoBox.style.right = '10px';
    videoBox.style.width = '320px';
    videoBox.style.height = '240px';
    videoBox.style.border = '2px solid #00ff00';
    videoBox.style.zIndex = '9999';
    videoBox.style.backgroundColor = '#000';
    document.body.appendChild(videoBox);

    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.height = '100%';
    videoBox.appendChild(video);

    const canvas = document.createElement('canvas'); // Hidden canvas for processing
    const context = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            speak("Camera is on. Recognizing an object...");
            processCameraFeed(video, canvas, context, stream, videoBox);
        })
        .catch(error => {
            console.error("Error accessing the camera: ", error);
            speak("Unable to access the camera. Please check your permissions.");
            videoBox.remove();
        });
}

async function processCameraFeed(video, canvas, context, stream, videoBox) {
    // Load TensorFlow.js and the MobileNet model
    speak("Loading the recognition model...");
    const model = await mobilenet.load();
    speak("Model loaded successfully.");

    // Capture a single frame for recognition
    setTimeout(async () => {
        // Draw the current video frame to the canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Perform recognition on the current frame
        const predictions = await model.classify(canvas);

        if (predictions.length > 0) {
            const topPrediction = predictions[0];
            const resultMessage = `I see something that looks like ${topPrediction.className} with a confidence of ${Math.round(topPrediction.probability * 100)} percent.`;
            console.log(resultMessage);
            speak(resultMessage);
        } else {
            speak("I'm not sure what I'm looking at.");
        }

        // Stop the camera and release resources
        stream.getTracks().forEach(track => track.stop());
        videoBox.remove();
        speak("Object recognition is complete. Camera is now off.");
    }, 2000); // Wait for 2 seconds to ensure the video is ready
}

// Handle recognition errors
recognition.onerror = (event) => {
    console.error('Speech recognition error detected: ' + event.error);
    speak("Sorry, I didn't catch that. Could you please repeat?");
};
