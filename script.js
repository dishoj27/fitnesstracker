/* =========================
   FIREBASE (optional, for logging in from any device)
   Fill in firebase-config.js to turn it on.
   Without it, accounts are stored in this browser only.
========================= */

let fbAuth = null;
let fbDb = null;

function initFirebase() {

    if (
        typeof firebase === "undefined" ||
        typeof FIREBASE_CONFIG === "undefined" ||
        !FIREBASE_CONFIG.apiKey ||
        FIREBASE_CONFIG.apiKey.indexOf("PASTE_") === 0
    ) {
        return false;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }

    fbAuth = firebase.auth();
    fbDb = firebase.firestore();

    return true;
}


function friendlyAuthError(err) {

    const messages = {
        "auth/email-already-in-use": "This email is already registered. Please log in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/user-not-found": "Invalid email or password.",
        "auth/wrong-password": "Invalid email or password.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection."
    };

    return messages[err.code] || ("Something went wrong: " + err.message);
}


function finishLogin(user, remember, cloud) {

    // Never keep the password in the browser for cloud accounts
    localStorage.setItem("fitTrackUser", JSON.stringify(user));

    if (cloud) {
        localStorage.setItem("fitTrackCloud", "true");
    }

    if (remember) {
        localStorage.setItem("fitTrackLoggedIn", "true");
    }
    else {
        sessionStorage.setItem("fitTrackLoggedIn", "true");
    }

    window.location.href = "dashboard.html";
}



/* =========================
   SIGN UP
========================= */

async function registerUser(event) {

    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const age = document.getElementById("signupAge").value;
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const fitnessGoal = document.getElementById("fitnessGoal").value;
    const role = document.getElementById("userRole").value;


    if (initFirebase()) {

        try {

            const cred =
                await fbAuth.createUserWithEmailAndPassword(email, password);

            await fbDb.collection("users").doc(cred.user.uid).set({
                name: name,
                age: age,
                email: email,
                fitnessGoal: fitnessGoal,
                role: role
            });

            await fbAuth.signOut();

        }
        catch (err) {

            alert(friendlyAuthError(err));
            return;

        }

    }

    else {

        localStorage.setItem(
            "fitTrackUser",
            JSON.stringify({
                name: name,
                age: age,
                email: email,
                password: password,
                fitnessGoal: fitnessGoal,
                role: role
            })
        );

    }


    alert("Account created successfully!");

    window.location.href = "login.html";
}



/* =========================
   LOGIN
========================= */

async function loginUser(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe");
    const remember = !!(rememberMe && rememberMe.checked);


    if (initFirebase()) {

        try {

            const cred =
                await fbAuth.signInWithEmailAndPassword(email, password);

            const doc =
                await fbDb.collection("users").doc(cred.user.uid).get();

            const profile = doc.exists ? doc.data() : {};

            await fbAuth.signOut();

            finishLogin({
                name: profile.name || email,
                age: profile.age || "",
                email: email,
                fitnessGoal: profile.fitnessGoal || "",
                role: profile.role || "user"
            }, remember, true);

        }
        catch (err) {

            alert(friendlyAuthError(err));

        }

        return;
    }


    // Local mode (no Firebase): account lives in this browser only
    const user = JSON.parse(localStorage.getItem("fitTrackUser"));

    if (!user || !user.password) {

        alert("No account found on this device. Please create an account first.");
        return;

    }

    if (email === user.email && password === user.password) {

        finishLogin(user, remember, false);

    }
    else {

        alert("Invalid email or password.");

    }

}



/* =========================
   AUTH GUARD
========================= */

function isLoggedIn() {

    return (
        localStorage.getItem("fitTrackLoggedIn") === "true" ||
        sessionStorage.getItem("fitTrackLoggedIn") === "true"
    );

}


function requireLogin() {

    if (
        document.body.classList.contains("dashboard-page") &&
        !isLoggedIn()
    ) {

        window.location.href = "login.html";

    }

}



/* =========================
   PASSWORD
========================= */

function togglePassword(id) {

    const input =
        document.getElementById(id);


    if (input.type === "password") {

        input.type = "text";

    }

    else {

        input.type = "password";

    }

}



/* =========================
   OTHER LOGIN BUTTONS
========================= */

function forgotPassword() {

    alert(
        "Password reset can be connected to a backend later."
    );

}


function googleLogin() {

    alert(
        "Google login can be connected using Firebase later."
    );

}



/* =========================
   DEFAULT GOALS
========================= */

const DEFAULT_GOALS = {

    steps: 10000,

    calories: 650,

    distance: 5,

    activeTime: 60

};



/* =========================
   GET GOALS
========================= */

function getGoals() {

    const saved =
        JSON.parse(
            localStorage.getItem("fitTrackGoals")
        );


    return saved || DEFAULT_GOALS;

}



/* =========================
   SAVE GOALS
========================= */

function saveGoals() {

    const goals = {

        steps:
            Number(
                document.getElementById("stepsGoal").value
            ),

        calories:
            Number(
                document.getElementById("caloriesGoal").value
            ),

        distance:
            Number(
                document.getElementById("distanceGoal").value
            ),

        activeTime:
            Number(
                document.getElementById("activeTimeGoal").value
            )

    };


    localStorage.setItem(
        "fitTrackGoals",
        JSON.stringify(goals)
    );


    alert(
        "Goals updated successfully!"
    );


    window.location.href =
        "dashboard.html";

}



/* =========================
   RESET GOALS
========================= */

function resetGoals() {

    const confirmReset =
        confirm(
            "Reset all goals to default values?"
        );


    if (!confirmReset) {
        return;
    }


    localStorage.removeItem(
        "fitTrackGoals"
    );


    alert(
        "All goals have been reset!"
    );


    window.location.href =
        "dashboard.html";

}



/* =========================
   LOAD GOALS PAGE
========================= */

function loadGoalsPage() {

    const steps =
        document.getElementById("stepsGoal");

    if (!steps) {
        return;
    }


    const goals = getGoals();


    steps.value =
        goals.steps;

    document.getElementById(
        "caloriesGoal"
    ).value =
        goals.calories;

    document.getElementById(
        "distanceGoal"
    ).value =
        goals.distance;

    document.getElementById(
        "activeTimeGoal"
    ).value =
        goals.activeTime;

}



/* =========================
   TODAY'S ACTIVITY
========================= */

function getActivity() {

    const saved =
        JSON.parse(
            localStorage.getItem("fitTrackActivity")
        );


    return saved || {

        steps: 0,

        calories: 0,

        distance: 0,

        activeTime: 0

    };

}



/* =========================
   DASHBOARD
========================= */

function loadDashboard() {

    const stepsElement =
        document.getElementById("stepsValue");


    if (!stepsElement) {
        return;
    }


    const goals =
        getGoals();

    const activity =
        getActivity();


    document.getElementById(
        "stepsValue"
    ).textContent =
        activity.steps.toLocaleString();


    document.getElementById(
        "caloriesValue"
    ).textContent =
        activity.calories;


    document.getElementById(
        "distanceValue"
    ).textContent =
        activity.distance.toFixed(1) + " km";


    document.getElementById(
        "activeTimeValue"
    ).textContent =
        activity.activeTime + " min";


    document.getElementById(
        "stepsGoalText"
    ).textContent =
        "of " +
        goals.steps.toLocaleString() +
        " daily goal";


    document.getElementById(
        "caloriesGoalText"
    ).textContent =
        "of " +
        goals.calories +
        " kcal goal";


    document.getElementById(
        "distanceGoalText"
    ).textContent =
        "of " +
        goals.distance +
        " km daily goal";


    document.getElementById(
        "activeTimeGoalText"
    ).textContent =
        "of " +
        goals.activeTime +
        " min daily goal";


    document.getElementById(
        "stepsProgress"
    ).textContent =
        activity.steps.toLocaleString()
        + " / "
        + goals.steps.toLocaleString();


    document.getElementById(
        "caloriesProgress"
    ).textContent =
        activity.calories
        + " / "
        + goals.calories
        + " kcal";


    document.getElementById(
        "timeProgress"
    ).textContent =
        activity.activeTime
        + " / "
        + goals.activeTime
        + " min";


    const stepPercent =
        Math.min(
            activity.steps / goals.steps * 100,
            100
        );


    const caloriePercent =
        Math.min(
            activity.calories / goals.calories * 100,
            100
        );


    const distancePercent =
        Math.min(
            activity.distance / goals.distance * 100,
            100
        );


    const timePercent =
        Math.min(
            activity.activeTime / goals.activeTime * 100,
            100
        );


    const percentage =
        Math.round(
            (
                stepPercent +
                caloriePercent +
                distancePercent +
                timePercent
            ) / 4
        );


    document.getElementById(
        "goalPercent"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "circlePercent"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "progressCircle"
    ).style.background =
        `conic-gradient(
            #15945a ${percentage}%,
            #e5ece8 ${percentage}%
        )`;


    loadUser();

}



/* =========================
   USER
========================= */

function loadUser() {

    const user =
        JSON.parse(
            localStorage.getItem("fitTrackUser")
        );


    if (!user) {
        return;
    }


    const name =
        document.getElementById(
            "welcomeName"
        );


    if (name) {
        name.textContent =
            user.name;
    }


    const dashboardName =
        document.getElementById(
            "dashboardUserName"
        );


    if (dashboardName) {
        dashboardName.textContent =
            user.name;
    }


    const letter =
        document.getElementById(
            "profileLetter"
        );


    if (letter) {

        letter.textContent =
            user.name
                .charAt(0)
                .toUpperCase();

    }

}



/* =========================
   LOGOUT
========================= */

function logoutUser() {

    if (localStorage.getItem("fitTrackCloud") === "true") {

        // cloud account: the real account is on the server,
        // so clear the cached copy from this device
        localStorage.removeItem("fitTrackUser");
        localStorage.removeItem("fitTrackCloud");

    }

    localStorage.removeItem(
        "fitTrackLoggedIn"
    );

    sessionStorage.removeItem(
        "fitTrackLoggedIn"
    );


    window.location.href =
        "login.html";

}



/* =========================
   TIMER
========================= */

let timerSeconds = 0;

let timerInterval = null;

let initialTimerSeconds = 0;



function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    const minutesElement =
        document.getElementById(
            "timerMinutes"
        );


    const secondsElement =
        document.getElementById(
            "timerSeconds"
        );


    if (!minutesElement) {
        return;
    }


    minutesElement.textContent =
        String(minutes).padStart(2, "0");


    secondsElement.textContent =
        String(seconds).padStart(2, "0");

}



/* SELECT TIMER */

function setTimer(minutes) {

    clearInterval(timerInterval);

    timerInterval = null;

    timerSeconds =
        minutes * 60;

    initialTimerSeconds =
        timerSeconds;

    updateTimerDisplay();

}



/* START TIMER */

function startTimer() {

    if (timerSeconds <= 0) {

        alert(
            "Select a timer duration first."
        );

        return;

    }


    if (timerInterval !== null) {
        return;
    }


    timerInterval =
        setInterval(function() {

            if (timerSeconds > 0) {

                timerSeconds--;

                updateTimerDisplay();

            }

            else {

                clearInterval(
                    timerInterval
                );

                timerInterval = null;

                completeWorkout();

            }

        }, 1000);

}



/* PAUSE */

function pauseTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval = null;

}



/* RESET */

function resetTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval = null;

    timerSeconds = 0;

    updateTimerDisplay();

}



/* =========================
   WEEKLY HISTORY (for Progress page)
========================= */

function getHistory() {

    const saved =
        JSON.parse(
            localStorage.getItem("fitTrackHistory")
        );


    return saved || [];

}


function addHistoryEntry(entry) {

    const history =
        getHistory();

    const today =
        new Date().toISOString().slice(0, 10);

    const existing =
        history.find(function(h) {
            return h.date === today;
        });


    if (existing) {

        existing.activeTime += entry.activeTime;
        existing.calories += entry.calories;
        existing.distance += entry.distance;
        existing.steps += entry.steps;
        existing.workouts += 1;

    }

    else {

        history.push({

            date: today,
            activeTime: entry.activeTime,
            calories: entry.calories,
            distance: entry.distance,
            steps: entry.steps,
            workouts: 1

        });

    }


    localStorage.setItem(
        "fitTrackHistory",
        JSON.stringify(history)
    );

}



/* =========================
   COMPLETE WORKOUT
========================= */

function completeWorkout() {

    let activity =
        getActivity();


    /*
       Baseline reference workout (30 minutes):

       30 active minutes
       280 calories
       3.5 km
       3500 steps

       Scale those numbers to whatever duration
       the user actually completed on the timer.
    */

    const minutesCompleted =
        Math.max(
            1,
            Math.round(
                (initialTimerSeconds || timerSeconds) / 60
            )
        );

    const ratio =
        minutesCompleted / 30;

    const gained = {

        activeTime: minutesCompleted,
        calories: Math.round(280 * ratio),
        distance: Number((3.5 * ratio).toFixed(2)),
        steps: Math.round(3500 * ratio)

    };


    activity.activeTime += gained.activeTime;

    activity.calories += gained.calories;

    activity.distance += gained.distance;

    activity.steps += gained.steps;


    localStorage.setItem(
        "fitTrackActivity",
        JSON.stringify(activity)
    );


    addHistoryEntry(gained);


    alert(
        "Workout completed! Your dashboard has been updated. 💪"
    );


    window.location.href =
        "dashboard.html";

}



/* =========================
   MOBILE SIDEBAR
========================= */

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "show"
        );

    }

}



/* =========================
   PAGE LOAD
========================= */

requireLogin();

loadGoalsPage();

loadDashboard();

loadUser();

updateTimerDisplay();
