// Train Scheduler
// Firebase Realtime Database and MomentJS, with Bootstrap and jQuery
// © Richard Trevillian, 2018-09-20
// University of Richmond, Full Stack Web Development Bootcamp


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
    $("#add_train_btn").on("click", function (event) {

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
    db.ref().on("child_added", function (snapshot) {

            // console.log(childSnapshot.val());
            makeTrainSchedule(snapshot);

            function makeTrainSchedule(childSnapshot) {

                // create an object to hold individual values for each train object returned by childSnapshot
                var aTrain = {};

                aTrain.name = childSnapshot.val().name;
                aTrain.route = childSnapshot.val().route;

                // MOMENT.JS CALCULATION VARIABLES BELOW

                // 24h Time (00:00): firstTrain is value of .first from snapshot of child_added
                aTrain.firstTrain = childSnapshot.val().first;
                // console.log(firstTrain);

                // Number (minutes): freqTrain is value of .freq from snapshot of child_added
                aTrain.freqTrain = childSnapshot.val().freq;
                // console.log(freqTrain);

                // MomentJS object: firstTrain time, 1 day ago, in 24h MILITARY TIME
                // set in past in case firstTrain time is before current time, so always pos num
                aTrain.firstTrainConverted = moment(aTrain.firstTrain, "HH:mm").subtract(1, "year");
                // console.log(firstTrainConverted);

                // Number: (a day of minutes, +/-): difference b/w now and firstTrainConverted
                aTrain.timeDiffMinutes = moment().diff(moment(aTrain.firstTrainConverted), "minutes");
                // console.log(timeDiffMinutes);

                // Number: remainder (MODULUS %) of dividing timeDiffMinutes by freqTrain
                aTrain.timeRemainder = aTrain.timeDiffMinutes % aTrain.freqTrain;
                // console.log(timeRemainder);

                // Number: MINUTES AWAY from next train arrival is freqTrain minus timeRemainder
                aTrain.nextTrainMinutes = aTrain.freqTrain - aTrain.timeRemainder;
                // console.log(nextTrainMinutes);

                // MomentJS object: TIME OF NEXT ARRIVAL is current time plus nextTrainMinutes
                aTrain.nextTrain = moment().add(aTrain.nextTrainMinutes, "minutes");
                // console.log(nextTrain);

                // format the nextTrain MomentJS object to get it's value in CIVILIAN TIME
                aTrain.nextArrival = moment(aTrain.nextTrain).format("hh:mm A");
                // console.log(nextArrival);


                // ==========================================================


                // IDs CREATED FOR DOM MANIPULATION OF TRAIN TABLE CELLS BELOW

                // get the database's unique key name of each child in the snapshot
                // use this to give each train's Minutes Away <td> a unique id=""
                aTrain.keyID = childSnapshot.key;
                // console.log(aTrain.keyID);

                // modify keyID to give each train's Next Arrival <td> a unique id=""
                aTrain.keyNext = aTrain.keyID + "-next";
                // console.log(aTrain.keyNext);


                // ==========================================================


                // THIS CONTROLS THE COUNTDOWN TIMER ON MINUTES AWAY,
                // AND REFRESHES THE NEXT ARRIVAL TIME WHEN MINUTES AWAY HITS 0

                // HEY! I made an ES6 IIFE! Yay me!
                // Anonymous Immediately Invoked (ES6 Arrow) Function Expression:
                (() => {

                    // set time's seconds to be nextTrainMinutes times 60 (seconds)
                    aTrain.time = aTrain.nextTrainMinutes * 60;


                    // TIME CONVERTER FUNCTION BELOW

                    // timeConverter function to turn an integer into minutes + seconds
                    function timeConverter(t) {

                        // divide the number of seconds passed into timeConverter by 60,
                        // and round down to an integer, to get MINUTES
                        aTrain.minutes = Math.floor(t / 60);

                        // take MINUTES above times 60 to get seconds,
                        // and subtract those seconds from number of seconds passed in,
                        // to get the leftover SECONDS not converted to minutes, above
                        aTrain.seconds = t - (aTrain.minutes * 60);

                        // if SECONDS are less than 10, 
                        if (aTrain.seconds < 10) {
                            // add a 0 to keep them double digits
                            aTrain.seconds = "0" + aTrain.seconds;
                        }

                        // if MINUTES are 0,
                        if (aTrain.minutes === 0) {
                            // add 00 to keep minutes double digits,
                            aTrain.minutes = "00";
                            // or if minutes are less than 10 (but not 0),
                        } else if (aTrain.minutes < 10) {
                            // add a 0 to keep minutes double digits
                            aTrain.minutes = "0" + aTrain.minutes;
                        }

                        // return minutes:seconds (00:00 format) as the value of this function
                        return aTrain.minutes + ":" + aTrain.seconds;
                    }


                    // COUNT FUNCTION BELOW: 
                    // DECREMENTS SECONDS, CALLS THE TIME FORMAT CONVERTER, MANIPULATES DOM,
                    // AND RESETS MINUTES AWAY AND NEXT ARRIVAL COUNTS

                    // callback for setInterval() below. Runs once per second.
                    function count() {

                        // decrement the number of seconds in time
                        aTrain.time--;

                        // time's seconds converted into 00:00 minutes and seconds format
                        aTrain.converted = timeConverter(aTrain.time);

                        // grab the unique ID of each Minutes Away <td>, insert converted time
                        $('#' + aTrain.keyID).text(aTrain.converted);

                        // when the value of time reaches 0, then...
                        if (aTrain.time === 0) {

                            // reset time value to nextTrainMinutes to reset the Minute's Away
                            aTrain.time = aTrain.nextTrainMinutes * 60;

                            // reset nextTrain since it calls current time with moment()
                            aTrain.nextTrain = moment().add(aTrain.nextTrainMinutes, "minutes");

                            // and also reset nextArrival, based on new current time from nextTrain
                            aTrain.nextArrival = moment(aTrain.nextTrain).format("hh:mm A");

                            // grab the unique ID of each Next Arrival <td>, insert new nextArrival value
                            $('#' + aTrain.keyNext).text(aTrain.nextArrival);

                        }
                    }

                    // call the count() function once every second
                    setInterval(count, 1000);

                    // TAKE DATABASE DATA AND CALCULATED VALUES ABOVE, AND APPEND THEM INTO THE SCHEDULE TABLE, ONCE FOR EACH TRAIN IN THE DATABASE
                    $("#train_list").append("<tr><th scope='row'>" + aTrain.name + "</th><td>" + aTrain.route + "</td><td>" + aTrain.freqTrain + "</td><td id='" + aTrain.keyNext + "'>" + aTrain.nextArrival + "</td><td id='" + aTrain.keyID + "'></td></tr>");

                })()

            };
        },

        // if any errors occur, send them here, to .on()'s second error handler function
        function (errorObject) {
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