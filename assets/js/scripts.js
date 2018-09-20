// Train Scheduler
// Firebase Realtime Database and MomentJS, with Bootstrap and jQuery
// © Richard Trevillian, 2018-09-20
// University of Richmond, Full Stack Web Development Bootcamp

// Swiss Railway Clock by Richard Beddington 
// https: //codepen.io/RichieAHB/
// Thanks Richie! Sweet clock!



// START jQUERY FUNCTION
// ----------------------------------------------------------------

$(document).ready(function () {

    // ==========================================================
    // CONNECT TO FIREBASE REALTIME DATABASE
    // ==========================================================

    // initialize variable with Firebase credentials
    var config = {
        apiKey: "AIzaSyCAlKIQlCVpzuFGD4nNsXqistWoyzM5wcE",
        authDomain: "trainschedule-a52e0.firebaseapp.com",
        databaseURL: "https://trainschedule-a52e0.firebaseio.com",
        projectId: "trainschedule-a52e0",
        storageBucket: "trainschedule-a52e0.appspot.com",
        messagingSenderId: "619259019326"
    };
    // initalize Firebase, send credentials
    firebase.initializeApp(config);
    // create a reference to the Firebase Realtime Database
    var db = firebase.database();


    // ==========================================================
    // INITIALIZE VARIABLES FOR STORED DATA
    // ==========================================================

    var trainName = "";
    var trainRoute = "";
    var trainFirst = "";
    var trainFreq = 0;


    // ==========================================================
    // SUBMIT BUTTON BELOW - SENDS NEW TRAIN TO DATABASE
    // ==========================================================

    // add an on-click event listener to the Submit button
    $("#add_train_btn").on("click", function () {

        // prevent the default Submit button input behavior
        event.preventDefault();

        // get trimmed data to fill values of global variables from input fields
        trainName = $("#train_name").val().trim();
        trainRoute = $("#train_route").val().trim();
        trainFirst = $("#train_first").val().trim();
        trainFreq = $("#train_freq").val().trim();

        // create a data object to .push() that contains all values
        var addTrain = {
            name: trainName,
            route: trainRoute,
            first: trainFirst,
            freq: trainFreq,
        }

        // .push() a new data set object to root level of database
        db.ref().push(addTrain);

        // clear the input fields to be ready for next train's data
        $("#train_name").val("");
        $("#train_route").val("");
        $("#train_first").val("");
        $("#train_freq").val("");

    });


    // ==========================================================
    // EVENT LISTENER ADDS NEW DATABASE TRAINS TO THE PAGE'S SCHEDULE
    // ==========================================================

    // watch the root level of database for the addition of any child data objects
    db.ref().on("child_added", function (childSnapshot) {

        // MOMENT.JS CALCULATION VARIABLES BELOW

        // 24h Time (00:00): firstTrain is value of .first from snapshot of child_added
        var firstTrain = childSnapshot.val().first;
        // console.log(firstTrain);

        // Number (minutes): freqTrain is value of .freq from snapshot of child_added
        var freqTrain = childSnapshot.val().freq;
        // console.log(freqTrain);

        // MomentJS object: firstTrain time, 1 day ago, in 24h MILITARY TIME
        // set in past in case firstTrain time is before current time, so always pos num
        var firstTrainConverted = moment(firstTrain, "HH:mm").subtract(1, "days");
        // console.log(firstTrainConverted);

        // Number: (a day of minutes, +/-): difference b/w now and firstTrainConverted
        var timeDiffMinutes = moment().diff(moment(firstTrainConverted), "minutes");
        // console.log(timeDiffMinutes);

        // Number: remainder (MODULUS %) of dividing timeDiffMinutes by freqTrain
        var timeRemainder = timeDiffMinutes % freqTrain;
        // console.log(timeRemainder);

        // Number: MINUTES AWAY from next train arrival is freqTrain minus timeRemainder
        var nextTrainMinutes = freqTrain - timeRemainder;
        // console.log(nextTrainMinutes);

        // MomentJS object: TIME OF NEXT ARRIVAL is current time plus nextTrainMinutes
        var nextTrain = moment().add(nextTrainMinutes, "minutes");
        // console.log(nextTrain);

        // format the nextTrain MomentJS object to get it's value in CIVILIAN TIME
        var nextArrival = moment(nextTrain).format("hh:mm A");
        // console.log(nextArrival);


        // ==========================================================


        // IDs CREATED FOR DOM MANIPULATION OF TRAIN TABLE CELLS BELOW

        // get the database's unique key name of each child in the snapshot
        // use this to give each train's Minutes Away <td> a unique id=""
        var keyID = childSnapshot.key;
        // console.log(keyID);

        // modify keyID to give each train's Next Arrival <td> a unique id=""
        var keyNext = keyID + "-next";
        // console.log(keyNext);


        // ==========================================================


        // THIS CONTROLS THE COUNTDOWN TIMER ON MINUTES AWAY,
        // AND REFRESHES THE NEXT ARRIVAL TIME WHEN MINUTES AWAY HITS 0

        // HEY! I made an ES6 IIFE! Yay me!
        // Anonymous Immediately Invoked (ES6 Arrow) Function Expression:
        (() => {

            // set time's seconds to be nextTrainMinutes times 60 (seconds)
            var time = nextTrainMinutes * 60;


            // TIME CONVERTER FUNCTION BELOW

            // timeConverter function to turn an integer into minutes + seconds
            function timeConverter(t) {

                // divide the number of seconds passed into timeConverter by 60,
                // and round down to an integer, to get MINUTES
                var minutes = Math.floor(t / 60);

                // take MINUTES above times 60 to get seconds,
                // and subtract those seconds from number of seconds passed in,
                // to get the leftover SECONDS not converted to minutes, above
                var seconds = t - (minutes * 60);

                // if SECONDS are less than 10, 
                if (seconds < 10) {
                    // add a 0 to keep them double digits
                    seconds = "0" + seconds;
                }

                // if MINUTES are 0,
                if (minutes === 0) {
                    // add 00 to keep minutes double digits,
                    minutes = "00";
                    // or if minutes are less than 10 (but not 0),
                } else if (minutes < 10) {
                    // add a 0 to keep minutes double digits
                    minutes = "0" + minutes;
                }

                // return minutes:seconds (00:00 format) as the value of this function
                return minutes + ":" + seconds;
            }


            // COUNT FUNCTION BELOW: 
            // DECREMENTS SECONDS, CALLS THE TIME FORMAT CONVERTER, MANIPULATES DOM,
            // AND RESETS MINUTES AWAY AND NEXT ARRIVAL COUNTS

            // callback for setInterval() below. Runs once per second.
            function count() {

                // decrement the number of seconds in time
                time--;

                // time's seconds converted into 00:00 minutes and seconds format
                let converted = timeConverter(time);

                // grab the unique ID of each Minutes Away <td>, insert converted time
                $('#' + keyID).text(converted);

                // when the value of time reaches 0, then...
                if (time === 0) {

                    // reset time value to nextTrainMinutes to reset the Minute's Away
                    time = nextTrainMinutes * 60;

                    // probably a cop-out to reload the window to refresh Next Arrival,
                    // but not sure how else to do it...
                    window.location.reload(true);
                }

            }

            // call the count() function once every second
            setInterval(count, 1000);

        })()


        // TAKE DATABASE DATA AND CALCULATED VALUES ABOVE, AND APPEND THEM INTO THE SCHEDULE TABLE, ONCE FOR EACH TRAIN IN THE DATABASE
        $("#train_list").append("<tr><th scope='row'>" + childSnapshot.val().name + "</th><td>" + childSnapshot.val().route + "</td><td>" + childSnapshot.val().freq + "</td><td id='" + keyNext + "'>" + nextArrival + "</td><td id='" + keyID + "'></td></tr>");

        // if any errors occur, send them here, to .on()'s second error handler function
    }, function (errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });


    // ==========================================================
    // CODE FOR DIGITAL CLOCK ON "CURRENT TRAIN SCHEDULE" BAR
    // ==========================================================

    var updateClock = function () {
        var realTime = moment().format("hh:mm:ss A");
        $("#time_box").html(realTime);
    }
    setInterval(updateClock, 1000);


    // END jQUERY FUNCTION
});
// ----------------------------------------------------------------